import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Form, Input, Modal, Space, Tag, message } from 'antd';
import {
    ArrowRightOutlined,
    DesktopOutlined,
    EditOutlined,
    DeleteOutlined,
    LogoutOutlined,
    RadarChartOutlined,
    SafetyCertificateOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { authService } from '../services/authService';
import { deviceService } from '../services/deviceService';
import { io } from 'socket.io-client';
import heroPreview from '../assets/hero.png';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAdmin = authService.isAdminUser(user);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [claimForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [socket, setSocket] = useState(null);
    const [streamModal, setStreamModal] = useState(false);
    const [hasStreamFrame, setHasStreamFrame] = useState(false);
    const [streamStatus, setStreamStatus] = useState('idle');
    const [activeDeviceCode, setActiveDeviceCode] = useState(null);
    const [activeRequestId, setActiveRequestId] = useState(null);
    const activeStreamRef = useRef({ deviceCode: null, requestId: null });
    const streamUiRef = useRef({ streamModal: false, streamStatus: 'idle' });
    const streamVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const featureCards = useMemo(() => ([
        {
            icon: <DesktopOutlined />,
            title: 'Kết nối trực tiếp',
            copy: 'Nhập mã thiết bị và đưa vào workspace ngay trên trang chủ.'
        },
        {
            icon: <RadarChartOutlined />,
            title: 'Theo dõi trạng thái',
            copy: 'Xem online status và thời điểm kết nối gần nhất của toàn bộ thiết bị.'
        },
        {
            icon: <SafetyCertificateOutlined />,
            title: 'Quản lý tập trung',
            copy: 'Đổi tên, rà soát và xóa thiết bị trong cùng một giao diện.'
        }
    ]), []);
    const onlineCount = devices.filter((device) => device.status === 'online').length;

    const destroyPeerConnection = () => {
        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
            peerConnection.ontrack = null;
            peerConnection.onicecandidate = null;
            peerConnection.close();
            peerConnectionRef.current = null;
        }

        if (streamVideoRef.current?.srcObject) {
            const mediaStream = streamVideoRef.current.srcObject;
            mediaStream.getTracks().forEach((track) => track.stop());
            streamVideoRef.current.srcObject = null;
        }
    };

    const startWebRtcStream = async (activeSocket, deviceCode, requestId) => {
        if (!activeSocket || !deviceCode) {
            return;
        }

        destroyPeerConnection();

        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnectionRef.current = peerConnection;

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (streamVideoRef.current && remoteStream) {
                streamVideoRef.current.srcObject = remoteStream;
                void streamVideoRef.current.play?.().catch(() => { });
            }
            setHasStreamFrame(true);
            setStreamStatus('live');
        };

        peerConnection.onicecandidate = ({ candidate }) => {
            if (!candidate) {
                return;
            }

            activeSocket.emit('webrtc:ice_candidate', {
                deviceCode,
                requestId,
                candidate: candidate.toJSON()
            });
        };

        peerConnection.addTransceiver('video', { direction: 'recvonly' });

        const offer = await peerConnection.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false
        });

        await peerConnection.setLocalDescription(offer);

        activeSocket.emit('webrtc:offer', {
            deviceCode,
            requestId,
            sdp: {
                type: offer.type,
                sdp: offer.sdp
            }
        });
    };

    useEffect(() => {
        loadDevices();

        // Khởi tạo socket với backend URL
        const newSocket = io('http://192.168.62.45:3000', {
            transports: ['websocket', 'polling'],
            rememberUpgrade: true,
            reconnection: true,
            reconnectionDelay: 800
        });
        setSocket(newSocket);

        newSocket.on('web:request_sent', (data) => {
            setStreamStatus('requesting');
            setActiveRequestId(data.requestId || null);
        });

        newSocket.on('web:connect_result', (data) => {
            if (data.success) {
                setStreamStatus('starting');
                setActiveDeviceCode(data.deviceCode || activeStreamRef.current.deviceCode);
                setActiveRequestId(data.requestId || null);
                setStreamModal(true);
                if (data.deviceCode) {
                    void claimConnectedDevice(data.deviceCode);
                }
            } else {
                resetStreamState();
                message.error(data.detail || 'Kết nối thất bại');
            }
        });

        newSocket.on('mobile:stream_started', (data) => {
            const deviceCode = data?.deviceCode || activeStreamRef.current.deviceCode;
            const requestId = data?.requestId || activeStreamRef.current.requestId;
            setStreamStatus('live');
            setStreamModal(true);
            void startWebRtcStream(newSocket, deviceCode, requestId);
            message.success('Thiết bị đã bắt đầu truyền màn hình');
        });

        newSocket.on('webrtc:answer', async (data) => {
            const peerConnection = peerConnectionRef.current;
            if (!peerConnection || !data?.sdp) {
                return;
            }

            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } catch (error) {
                console.error('Failed to set remote answer', error);
            }
        });

        newSocket.on('webrtc:ice_candidate', async (data) => {
            const peerConnection = peerConnectionRef.current;
            if (!peerConnection || !data?.candidate) {
                return;
            }

            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('Failed to add remote ICE candidate', error);
            }
        });

        newSocket.on('mobile:stream_stopped', (data) => {
            const reason = data?.reason;
            const shouldNotify = streamUiRef.current.streamModal
                || streamUiRef.current.streamStatus === 'live'
                || streamUiRef.current.streamStatus === 'starting';
            resetStreamState({ closeModal: true });
            loadDevices();

            if (shouldNotify && reason !== 'viewer_closed') {
                message.info('Luồng stream đã kết thúc và modal đã được đóng');
            }
        });

        newSocket.on('disconnect', () => {
            resetStreamState({ closeModal: true });
        });

        return () => {
            if (activeStreamRef.current.deviceCode) {
                newSocket.emit('web:leave_stream', {
                    deviceCode: activeStreamRef.current.deviceCode,
                    requestId: activeStreamRef.current.requestId,
                    reason: 'viewer_unmount'
                });
            }
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        activeStreamRef.current = {
            deviceCode: activeDeviceCode,
            requestId: activeRequestId
        };
    }, [activeDeviceCode, activeRequestId]);

    useEffect(() => {
        streamUiRef.current = {
            streamModal,
            streamStatus
        };
    }, [streamModal, streamStatus]);

    const loadDevices = async () => {
        setLoading(true);
        try {
            const result = await deviceService.getMyDevices();
            setDevices(result.data);
        } catch {
            message.error('Lỗi tải danh sách thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const connectToDevice = (deviceCode) => {
        if (!socket || !deviceCode) {
            message.error('Kết nối socket chưa sẵn sàng');
            return;
        }

        resetStreamState();
        setActiveDeviceCode(deviceCode);
        setStreamStatus('requesting');

        socket.emit('web:connect_request', {
            deviceCode,
            requesterName: user?.fullname || user?.username || 'Người dùng'
        });

        message.loading('Đang gửi yêu cầu kết nối...', 2);
    };

    const confirmConnectToDevice = (device) => {
        if (device.status !== 'online') {
            return;
        }

        Modal.confirm({
            title: 'Kết nối thiết bị',
            content: `Bắt đầu phiên xem màn hình với "${device.deviceName || device.deviceCode}"?`,
            okText: 'Kết nối',
            cancelText: 'Hủy',
            onOk: () => connectToDevice(device.deviceCode)
        });
    };

    const claimConnectedDevice = async (deviceCode) => {
        try {
            await deviceService.claimDevice(deviceCode);
            await loadDevices();
        } catch (error) {
            const serverMessage = error?.response?.data?.message || '';
            if (!serverMessage.includes('tài khoản khác')) {
                console.error('Không thể lưu thiết bị đã kết nối', error);
            }
        }
    };

    const handleClaimDevice = async (values) => {
        setClaiming(true);
        try {
            const deviceCode = values.deviceCode.trim().toUpperCase();
            connectToDevice(deviceCode);
        } catch (error) {
            message.error(error.response?.data?.message || 'Kết nối thất bại');
        } finally {
            setClaiming(false);
        }
    };

    const resetStreamState = (options = {}) => {
        destroyPeerConnection();
        setHasStreamFrame(false);
        setStreamStatus('idle');
        setActiveDeviceCode(null);
        setActiveRequestId(null);
        if (options.closeModal !== false) {
            setStreamModal(false);
        }
    };

    const handleCloseStream = () => {
        if (socket && activeStreamRef.current.deviceCode) {
            socket.emit('web:leave_stream', {
                deviceCode: activeStreamRef.current.deviceCode,
                requestId: activeStreamRef.current.requestId,
                reason: 'viewer_closed'
            });
        }
        resetStreamState({ closeModal: true });
    };

    const renderStreamPlaceholder = () => {
        if (streamStatus === 'requesting') {
            return 'Đang gửi yêu cầu tới thiết bị...';
        }

        if (streamStatus === 'starting') {
            return 'Thiết bị đã chấp nhận. Đang khởi tạo kết nối realtime...';
        }

        return 'Đang chờ video realtime từ thiết bị...';
    };

    const handleUpdateName = async (values) => {
        try {
            await deviceService.updateDeviceName(editingDevice.id, values.deviceName);
            message.success('Cập nhật tên thiết bị thành công');
            setEditingDevice(null);
            editForm.resetFields();
            loadDevices();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    const handleDeleteDevice = (device) => {
        Modal.confirm({
            title: 'Xóa thiết bị',
            content: `Xóa "${device.deviceName || device.deviceCode}" khỏi workspace?`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await deviceService.deleteDevice(device.id);
                    message.success('Xóa thiết bị thành công');
                    loadDevices();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Xóa thiết bị thất bại');
                }
            }
        });
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    return (
        <div className="home-shell">
            <header className="home-header">
                <div className="home-brand">
                    <img src="/Logo_NL_ScreenCast.png" alt="NL ScreenCast" className="home-brand-mark" />
                </div>

                <div className="home-header-actions">
                    <div className="home-user-pill">{user?.fullname || user?.username || 'Workspace'}</div>
                    {isAdmin && (
                        <Button icon={<TeamOutlined />} onClick={() => navigate('/admin/dashboard')}>
                            Admin
                        </Button>
                    )}
                    <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </header>

            <main className="home-content">
                <section className="home-hero">
                    <div className="home-hero-copy">
                        <span className="home-chip">Smart display workflow</span>
                        <h3 className="home-title">Điều phối thiết bị và hiển thị trên một giao diện rõ ràng hơn</h3>
                        <p className="home-lead">
                            Một điểm vào chung cho quản lý thiết bị, theo dõi trạng thái trực tuyến và vận hành hệ thống hiển thị theo thời gian thực.
                        </p>

                        <Form
                            form={claimForm}
                            onFinish={handleClaimDevice}
                            layout="vertical"
                            className="home-claim-form"
                        >
                            <div className="home-claim-row">
                                <Form.Item
                                    name="deviceCode"
                                    rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị' }]}
                                    className="home-claim-input"
                                >
                                    <Input placeholder="Nhập mã thiết bị để kết nối ngay" />
                                </Form.Item>
                                <Button
                                    type="primary"
                                    size="large"
                                    htmlType="submit"
                                    icon={<ArrowRightOutlined />}
                                    loading={claiming}
                                    className="home-claim-button"
                                >
                                    Kết nối
                                </Button>
                            </div>
                        </Form>

                        <div className="home-metrics">
                            <div className="home-metric-card">
                                <div className="home-metric-value">{devices.length}</div>
                                <div className="home-metric-label">Thiết bị</div>
                            </div>
                            <div className="home-metric-card">
                                <div className="home-metric-value">{onlineCount}</div>
                                <div className="home-metric-label">Trực tuyến</div>
                            </div>
                            <div className="home-metric-card">
                                <div className="home-metric-value">{isAdmin ? 'Admin' : 'User'}</div>
                                <div className="home-metric-label">Access mode</div>
                            </div>
                        </div>
                    </div>

                    <div className="home-hero-preview">
                        <div className="home-preview-frame">
                            <img src={heroPreview} alt="NL ScreenCast preview" className="home-preview-image" />
                        </div>
                        <div className="home-preview-float">
                            <span className="home-preview-kicker">Realtime</span>
                            <strong>Device overview</strong>
                        </div>
                    </div>
                </section>

                <section className="home-grid">
                    <div className="home-panel home-feature-panel">
                        <div className="home-device-toolbar">
                            <div className="home-device-heading">
                                <h2 className="home-device-title">Tất cả thiết bị của bạn</h2>
                            </div>
                            {isAdmin && (
                                <Button onClick={() => navigate('/admin/dashboard')}>
                                    Mở admin dashboard
                                </Button>
                            )}
                        </div>
                        {loading ? (
                            <Card className="home-device-empty" loading={loading} />
                        ) : devices.length === 0 ? (
                            <Card className="home-device-empty">
                                <Empty description="Chưa có thiết bị nào" />
                            </Card>
                        ) : (
                            <div className="home-device-grid">
                                {devices.map((device) => (
                                    <Card
                                        key={device.id}
                                        className={`home-device-card${device.status === 'online' ? ' is-clickable' : ''}`}
                                        hoverable
                                        onClick={() => {
                                            if (device.status === 'online') {
                                                confirmConnectToDevice(device);
                                            }
                                        }}
                                    >
                                        <div className="home-device-phone">
                                            <div className="home-device-phone-notch" />
                                            <div className="home-device-phone-screen">
                                                <div className="home-device-card-topbar">
                                                    <div className="home-device-card-titlebar">
                                                        <span className="home-device-card-name">{device.deviceName || 'Chưa đặt tên'}</span>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            className="home-device-icon-button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setEditingDevice(device);
                                                                editForm.setFieldsValue({ deviceName: device.deviceName });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="home-device-card-extra">
                                                        <Tag color={device.status === 'online' ? 'success' : 'default'} bordered={false}>
                                                            {device.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                                                        </Tag>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            className="home-device-icon-button home-device-delete-button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDeleteDevice(device);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="home-device-code-value">{device.deviceCode}</div>
                                                <div className="home-device-meta">
                                                    <div className="home-device-meta-row">
                                                        <span className="home-device-meta-key">Kết nối cuối</span>
                                                        <span className="home-device-meta-value">
                                                            {device.lastConnected ? new Date(device.lastConnected).toLocaleString('vi-VN') : '--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="home-panel home-action-panel">
                        <div className="home-section-kicker">Chức năng</div>
                        <div className="home-feature-list">
                            {featureCards.map((item) => (
                                <div key={item.title} className="home-feature-card">
                                    <div className="home-feature-icon">{item.icon}</div>
                                    <div>
                                        <h3 className="home-feature-title">{item.title}</h3>
                                        <p className="home-feature-copy">{item.copy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Modal
                title="Đổi tên thiết bị"
                open={!!editingDevice}
                onCancel={() => { setEditingDevice(null); editForm.resetFields(); }}
                footer={null}
            >
                <Form form={editForm} onFinish={handleUpdateName} layout="vertical">
                    <Form.Item
                        label="Tên thiết bị"
                        name="deviceName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
                    >
                        <Input placeholder="Nhập tên thiết bị" />
                    </Form.Item>
                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => { setEditingDevice(null); editForm.resetFields(); }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Lưu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={null}
                open={streamModal}
                onCancel={handleCloseStream}
                width="min(94vw, 1320px)"
                className="home-stream-modal"
                footer={null}
                centered
            >
                <div className="home-stream-shell">
                    <div className="home-stream-header">
                        <div>
                            <div className="home-stream-kicker">Live stream</div>
                            <div className="home-stream-title">Chia sẻ màn hình</div>
                        </div>
                        <div className={`home-stream-status home-stream-status-${streamStatus}`}>
                            {streamStatus === 'live' ? 'Đang phát' : streamStatus === 'starting' ? 'Đang kết nối' : 'Đang chờ'}
                        </div>
                    </div>
                    <div className="home-stream-stage">
                        <video
                            ref={streamVideoRef}
                            className={`home-stream-video${hasStreamFrame ? ' is-visible' : ''}`}
                            autoPlay
                            playsInline
                            muted
                        />
                        {!hasStreamFrame && (
                            <div className="home-stream-placeholder">
                                <p>{renderStreamPlaceholder()}</p>
                            </div>
                        )}
                        <Button className="home-stream-close home-stream-close-floating" onClick={handleCloseStream}>
                            Đóng
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Home;
