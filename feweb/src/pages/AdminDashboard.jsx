import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Button,
    Modal,
    Input,
    Form,
    Table,
    Tag,
    Space,
    message,
    Drawer,
    Grid
} from 'antd';
import {
    UserOutlined,
    MobileOutlined,
    LogoutOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    LockOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    MenuOutlined,
    ArrowRightOutlined,
    DashboardOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { userService } from '../services/userService';
import { deviceService } from '../services/deviceService';
import { authService } from '../services/authService';
import './AdminDashboard.css';

const { Content } = Layout;

function AdminDashboard() {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.lg;
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const [usersResult, statsResult] = await Promise.all([
                    userService.getAllUsers({ search: searchTerm }),
                    userService.getUserStats()
                ]);
                setUsers(usersResult.data);
                setStats(statsResult.data);
            } else if (activeTab === 'devices') {
                const devicesResult = await deviceService.getAllDevices();
                setDevices(devicesResult.data.devices);
            }
        } catch {
            message.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm]);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        loadData();
    }, [loadData]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/admin/login');
    };

    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                await userService.updateUser(editingUser.id, values);
                message.success('Cập nhật người dùng thành công!');
            } else {
                await userService.createUser(values);
                message.success('Tạo người dùng thành công!');
            }
            setShowUserModal(false);
            setEditingUser(null);
            form.resetFields();
            loadData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDeleteUser = (userId) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa người dùng này?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await userService.deleteUser(userId);
                    message.success('Xóa người dùng thành công!');
                    loadData();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Xóa thất bại');
                }
            }
        });
    };

    const handleToggleStatus = async (userId) => {
        try {
            await userService.toggleUserStatus(userId);
            message.success('Thay đổi trạng thái thành công!');
            loadData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thay đổi trạng thái thất bại');
        }
    };

    const handleResetPassword = (userId) => {
        Modal.confirm({
            title: 'Reset mật khẩu',
            content: (
                <Form id="resetPasswordForm">
                    <Form.Item name="newPassword" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}>
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                </Form>
            ),
            okText: 'Reset',
            cancelText: 'Hủy',
            onOk: async () => {
                const formElement = document.getElementById('resetPasswordForm');
                const newPassword = formElement.querySelector('input').value;
                if (!newPassword) {
                    message.error('Vui lòng nhập mật khẩu mới!');
                    return Promise.reject();
                }
                try {
                    await userService.resetPassword(userId, newPassword);
                    message.success('Reset mật khẩu thành công!');
                } catch (error) {
                    message.error(error.response?.data?.message || 'Reset mật khẩu thất bại');
                    return Promise.reject();
                }
            }
        });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        setShowUserModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            username: user.username,
            email: user.email,
            fullname: user.fullname || '',
            phone: user.phone || '',
            role_id: user.role_id
        });
        setShowUserModal(true);
    };

    const navigationItems = useMemo(() => ([
        {
            key: 'users',
            title: 'Quản lý người dùng',
            description: 'Accounts',
            icon: <TeamOutlined />
        },
        {
            key: 'devices',
            title: 'Thiết bị hệ thống',
            description: 'Status',
            icon: <MobileOutlined />
        }
    ]), []);

    const currentSection = navigationItems.find((item) => item.key === activeTab);
    const summaryStats = [
        {
            key: 'total',
            icon: <UserOutlined />,
            value: stats?.totalUsers ?? 0,
            label: 'Tổng người dùng',
            note: 'Tất cả tài khoản đang được quản lý',
            iconClass: 'is-primary'
        },
        {
            key: 'active',
            icon: <CheckCircleOutlined />,
            value: stats?.activeUsers ?? 0,
            label: 'Đang hoạt động',
            note: 'Có thể đăng nhập và sử dụng hệ thống',
            iconClass: 'is-success'
        },
        {
            key: 'inactive',
            icon: <CloseCircleOutlined />,
            value: stats?.inactiveUsers ?? 0,
            label: 'Bị vô hiệu hóa',
            note: 'Đang tạm ngưng hoặc cần rà soát lại',
            iconClass: 'is-danger'
        }
    ];

    const userColumns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Họ tên',
            dataIndex: 'fullname',
            key: 'fullname',
            render: (text) => text || '-'
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'Role',
            key: 'role',
            render: (role) => role?.name || '-'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'status',
            render: (status) => (
                <Tag color={status ? 'success' : 'error'} bordered={false}>
                    {status ? 'Hoạt động' : 'Vô hiệu'}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                        Sửa
                    </Button>
                    <Button type="link" size="small" onClick={() => handleToggleStatus(record.id)}>
                        {record.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </Button>
                    <Button type="link" size="small" icon={<LockOutlined />} onClick={() => handleResetPassword(record.id)}>
                        Reset PW
                    </Button>
                    <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteUser(record.id)}>
                        Xóa
                    </Button>
                </Space>
            )
        }
    ];

    const deviceColumns = [
        {
            title: 'Mã thiết bị',
            dataIndex: 'deviceCode',
            key: 'deviceCode',
            render: (text) => <span className="admin-device-code">{text}</span>
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'deviceName',
            key: 'deviceName',
            render: (text) => text || '-'
        },
        {
            title: 'Chủ sở hữu',
            dataIndex: 'User',
            key: 'user',
            render: (user) => user?.username || 'Chưa liên kết'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'online' ? 'success' : 'default'} bordered={false}>
                    {status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                </Tag>
            )
        },
        {
            title: 'Kết nối lần cuối',
            dataIndex: 'lastConnected',
            key: 'lastConnected',
            render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '-'
        }
    ];

    const renderSidebar = () => (
        <aside className="admin-sidebar">
            <div className="admin-brand">
                <img src="/Logo_NL_ScreenCast.png" alt="NL ScreenCast" className="admin-brand-mark" />
                <div className="admin-brand-copy">
                    <span className="admin-eyebrow">Admin Console</span>
                    <span className="admin-brand-title">System Manager</span>
                    <span className="admin-brand-subtitle">Control Center</span>
                </div>
            </div>

            <div className="admin-sidebar-panel">
                <div className="admin-sidebar-title">Session</div>
                <div className="admin-admin-card">
                    <div className="admin-avatar">
                        {(user?.username || 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <div className="admin-admin-name">{user?.username || 'Super Admin'}</div>
                        <div className="admin-admin-role">Superadmin session</div>
                    </div>
                </div>
            </div>

            <nav className="admin-nav" aria-label="Điều hướng quản trị">
                {navigationItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`admin-nav-button${activeTab === item.key ? ' is-active' : ''}`}
                        onClick={() => {
                            setActiveTab(item.key);
                            setMobileNavOpen(false);
                        }}
                    >
                        <span className="admin-nav-main">
                            <span className="admin-nav-icon">{item.icon}</span>
                            <span className="admin-nav-label">
                                <span className="admin-nav-title">{item.title}</span>
                                <span className="admin-nav-description">{item.description}</span>
                            </span>
                        </span>
                        <ArrowRightOutlined className="admin-nav-arrow" />
                    </button>
                ))}
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-footer-card">
                    <div className="admin-footer-title">Workspace</div>
                    <p className="admin-footer-text">Users / Devices</p>
                </div>
                <Button
                    danger
                    size="large"
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    block
                >
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );

    const renderUserToolbar = () => (
        <div className="admin-toolbar">
            <Input.Search
                className="admin-search"
                placeholder="Tìm theo username, email hoặc họ tên"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={loadData}
                allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Tạo người dùng
            </Button>
        </div>
    );

    return (
        <Layout className="admin-dashboard">
            <div className="admin-shell">
                {renderSidebar()}

                <Content className="admin-content">
                    <div className="admin-mobile-bar">
                        <Button
                            type="default"
                            icon={<MenuOutlined />}
                            onClick={() => setMobileNavOpen(true)}
                        >
                            Menu
                        </Button>
                        <Button
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </Button>
                    </div>

                    <header className="admin-topbar">
                        <div className="admin-title-block">
                            <div className="admin-eyebrow">Admin Console</div>
                            <h1 className="admin-page-title">System Control</h1>
                        </div>
                        <div className="admin-topbar-actions">
                            <Button icon={<DashboardOutlined />}>
                                {currentSection?.title || 'Tổng quan'}
                            </Button>
                            {activeTab === 'users' && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                                    Tạo user mới
                                </Button>
                            )}
                        </div>
                    </header>

                    <section className="admin-hero">
                        <div className="admin-hero-grid">
                            <div className="admin-hero-panel">
                                <span className="admin-chip">Admin overview</span>
                                <h2 className="admin-hero-title">
                                    {activeTab === 'users'
                                        ? 'User Management'
                                        : 'Device Management'}
                                </h2>

                                <div className="admin-kpi-grid">
                                    {summaryStats.map((item) => (
                                        <div key={item.key} className="admin-kpi-card">
                                            <div className={`admin-kpi-icon ${item.iconClass}`}>{item.icon}</div>
                                            <div className="admin-kpi-value">{item.value}</div>
                                            <div className="admin-kpi-label">{item.label}</div>
                                            <div className="admin-kpi-note">{item.note}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-hero-panel is-dark">
                                <span className="admin-chip">Workspace</span>
                                <h2 className="admin-hero-title">Management Panel</h2>
                                <div className="admin-quick-grid">
                                    <div className="admin-quick-card">
                                        <h3>Users</h3>
                                    </div>
                                    <div className="admin-quick-card">
                                        <h3>Devices</h3>
                                    </div>
                                    <div className="admin-quick-card">
                                        <h3>Actions</h3>
                                    </div>
                                    <div className="admin-quick-card">
                                        <h3>Responsive</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="admin-section">
                        <div className="admin-section-head">
                            <div>
                                <h2 className="admin-section-title">{currentSection?.title}</h2>
                            </div>
                            {activeTab === 'users' ? renderUserToolbar() : null}
                        </div>

                        <div className="admin-table">
                            {activeTab === 'users' ? (
                                <Table
                                    columns={userColumns}
                                    dataSource={users}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 960 }}
                                />
                            ) : (
                                <Table
                                    columns={deviceColumns}
                                    dataSource={devices}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 960 }}
                                />
                            )}
                        </div>
                    </section>
                </Content>
            </div>

            <Drawer
                title={null}
                placement="left"
                open={isMobile && mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                width={320}
                closable={false}
                className="admin-mobile-drawer"
            >
                {renderSidebar()}
            </Drawer>

            <Modal
                title={editingUser ? 'Cập nhật User' : 'Tạo User mới'}
                open={showUserModal}
                onCancel={() => { setShowUserModal(false); setEditingUser(null); form.resetFields(); }}
                footer={null}
                width={600}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập username!' }]}
                    >
                        <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    {!editingUser && (
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item label="Họ tên" name="fullname">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Số điện thoại" name="phone">
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Space style={{ 'width': '100%', 'justifyContent': 'flex-end' }}>
                            <Button onClick={() => { setShowUserModal(false); setEditingUser(null); form.resetFields(); }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingUser ? 'Cập nhật' : 'Tạo'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default AdminDashboard;
