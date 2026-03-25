import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Modal, Input, Form, Tag, Space, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { deviceService } from '../services/deviceService';
import { authService } from '../services/authService';
import './UserDevices.css';

const { Header, Content } = Layout;

function UserDevices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [user, setUser] = useState(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            const result = await deviceService.getMyDevices();
            setDevices(result.data);
        } catch {
            message.error('Lỗi tải danh sách thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimDevice = async (values) => {
        try {
            await deviceService.claimDevice(values.deviceCode);
            message.success('Liên kết thiết bị thành công!');
            setShowAddModal(false);
            form.resetFields();
            loadDevices();
        } catch (error) {
            message.error(error.response?.data?.message || 'Liên kết thiết bị thất bại');
        }
    };

    const handleUpdateName = async (values) => {
        try {
            await deviceService.updateDeviceName(editingDevice.id, values.deviceName);
            message.success('Cập nhật tên thiết bị thành công!');
            setEditingDevice(null);
            editForm.resetFields();
            loadDevices();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    const handleDeleteDevice = (device) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc muốn xóa thiết bị "${device.deviceName || device.deviceCode}"?`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await deviceService.deleteDevice(device.id);
                    message.success('Xóa thiết bị thành công!');
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

    const onlineCount = devices.filter((device) => device.status === 'online').length;

    return (
        <Layout className="devices-shell">
            <Header className="devices-header">
                <div className="devices-brand">
                    <div className="devices-brand-mark">NL</div>
                    <div className="devices-brand-copy">
                        <span className="devices-brand-subtitle">Device Center</span>
                        <h1 className="devices-brand-title">Thiết bị của tôi</h1>
                    </div>
                </div>
                <div className="devices-header-actions">
                    <span className="devices-user-pill">{user?.fullname || user?.username}</span>
                    <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>

            <Content className="devices-content">
                <section className="devices-hero">
                    <div className="devices-hero-card">
                        <span className="devices-chip">Portfolio</span>
                        <h2 className="devices-title">My Devices</h2>
                        <div className="devices-stats">
                            <div className="devices-stat">
                                <div className="devices-stat-value">{devices.length}</div>
                                <div className="devices-stat-label">Thiết bị</div>
                            </div>
                            <div className="devices-stat">
                                <div className="devices-stat-value">{onlineCount}</div>
                                <div className="devices-stat-label">Trực tuyến</div>
                            </div>
                        </div>
                    </div>
                    <div className="devices-hero-card is-dark">
                        <span className="devices-chip">Workspace</span>
                        <h2 className="devices-title">Control Panel</h2>
                        <div className="devices-stats">
                            <div className="devices-stat">
                                <div className="devices-stat-value">{Math.max(devices.length - onlineCount, 0)}</div>
                                <div className="devices-stat-label">Ngoại tuyến</div>
                            </div>
                            <div className="devices-stat">
                                <div className="devices-stat-value">{devices.length > 0 ? 'Live' : 'Ready'}</div>
                                <div className="devices-stat-label">Trạng thái</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="devices-toolbar">
                    <h2 className="devices-section-title">Danh sách thiết bị</h2>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                        Thêm thiết bị
                    </Button>
                </div>

                {loading ? (
                    <Card className="devices-empty" loading={loading} />
                ) : devices.length === 0 ? (
                    <Card className="devices-empty">
                        <Empty description="Chưa có thiết bị" />
                    </Card>
                ) : (
                    <div className="devices-grid">
                        {devices.map((device) => (
                            <Card
                                key={device.id}
                                className="device-card"
                                title={device.deviceName || 'Chưa đặt tên'}
                                extra={
                                    <Tag color={device.status === 'online' ? 'success' : 'default'} variant="filled">
                                        {device.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                                    </Tag>
                                }
                                actions={[
                                    <Button type="link" icon={<EditOutlined />} onClick={() => { setEditingDevice(device); editForm.setFieldsValue({ deviceName: device.deviceName }); }}>
                                        Đổi tên
                                    </Button>,
                                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDevice(device)}>
                                        Xóa
                                    </Button>
                                ]}
                            >
                                <div className="device-code-label">Mã thiết bị</div>
                                <div className="device-code-value">{device.deviceCode}</div>

                                <div className="device-meta">
                                    <div className="device-meta-row">
                                        <span className="device-meta-key">Trạng thái</span>
                                        <span className="device-meta-value">
                                            {device.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                                        </span>
                                    </div>
                                    <div className="device-meta-row">
                                        <span className="device-meta-key">Kết nối cuối</span>
                                        <span className="device-meta-value">
                                            {device.lastConnected ? new Date(device.lastConnected).toLocaleString('vi-VN') : '--'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Content>

            <Modal
                title="Thêm thiết bị mới"
                className="devices-modal"
                open={showAddModal}
                onCancel={() => { setShowAddModal(false); form.resetFields(); }}
                footer={null}
            >
                <Form form={form} onFinish={handleClaimDevice} layout="vertical">
                    <Form.Item
                        label="Mã thiết bị"
                        name="deviceCode"
                        rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị!' }]}
                    >
                        <Input placeholder="Nhập mã thiết bị (VD: NL-AB12CD)" />
                    </Form.Item>
                    <Form.Item>
                        <Space style={{'width':'100%','justifyContent':'flex-end'}}>
                            <Button onClick={() => { setShowAddModal(false); form.resetFields(); }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Thêm
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Đổi tên thiết bị"
                className="devices-modal"
                open={!!editingDevice}
                onCancel={() => { setEditingDevice(null); editForm.resetFields(); }}
                footer={null}
            >
                <Form form={editForm} onFinish={handleUpdateName} layout="vertical">
                    <Form.Item
                        label="Tên thiết bị"
                        name="deviceName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                    >
                        <Input placeholder="Nhập tên thiết bị" />
                    </Form.Item>
                    <Form.Item>
                        <Space style={{'width':'100%','justifyContent':'flex-end'}}>
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
        </Layout>
    );
}

export default UserDevices;
