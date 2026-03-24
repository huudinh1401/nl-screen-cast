import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import './AuthPages.css';

function AdminLogin() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        authService.setAuthEntry('admin');
    }, []);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const result = await authService.login(values.username, values.password);

            if (result.success) {
                const user = result.user;
                if (authService.isAdminUser(user)) {
                    message.success('Đăng nhập thành công!');
                    navigate('/admin/dashboard');
                } else {
                    message.error('Bạn không có quyền truy cập trang quản trị');
                    await authService.logout();
                }
            }
        } catch (err) {
            message.error(err.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <section className="auth-showcase">
                <div className="auth-showcase-panel">
                    <div className="auth-brand">
                        <img src="/Logo_NL_ScreenCast.png" alt="NL ScreenCast" className="auth-brand-mark" />
                    </div>

                    <div className="auth-headline">
                        <span className="auth-chip">Restricted</span>
                        <h1 className="auth-title">Điều hành user và thiết bị trong một bảng quản trị</h1>
                        <p className="auth-lead">
                            Kiểm soát tài khoản, thiết bị và quyền truy cập tập trung.
                        </p>
                    </div>

                    <div className="auth-metrics">
                        <div className="auth-metric-card">
                            <div className="auth-metric-value">Admin</div>
                            <div className="auth-metric-label">Access</div>
                        </div>
                        <div className="auth-metric-card">
                            <div className="auth-metric-value">Devices</div>
                            <div className="auth-metric-label">Monitor</div>
                        </div>
                    </div>

                    <div className="auth-feature-board">
                        <div className="auth-feature-panel">
                            <div className="auth-panel-label">Admin functions</div>
                            <div className="auth-feature-list">
                                <div className="auth-feature-item">
                                    <div className="auth-feature-title">Quản lý user</div>
                                    <div className="auth-feature-copy">Tạo, sửa, khóa, reset.</div>
                                </div>
                                <div className="auth-feature-item">
                                    <div className="auth-feature-title">Giám sát thiết bị</div>
                                    <div className="auth-feature-copy">Online, owner, last seen.</div>
                                </div>
                            </div>
                        </div>

                        <div className="auth-activity-panel">
                            <div className="auth-panel-label">Operations</div>
                            <div className="auth-activity-list">
                                <div className="auth-activity-item">
                                    <span className="auth-activity-dot" />
                                    <div className="auth-activity-copy">
                                        <div className="auth-activity-title">User Roles</div>
                                        <div className="auth-activity-text">Kiểm soát truy cập.</div>
                                    </div>
                                </div>
                                <div className="auth-activity-item">
                                    <span className="auth-activity-dot" />
                                    <div className="auth-activity-copy">
                                        <div className="auth-activity-title">Device Status</div>
                                        <div className="auth-activity-text">Theo dõi trạng thái hệ thống.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="auth-panel">
                <Card className="auth-card" bordered={false}>
                    <div className="auth-card-head">
                        <span className="auth-card-badge">Admin</span>
                        <h1 className="auth-card-title">Đăng nhập quản trị</h1>
                        <p className="auth-card-subtitle">
                            Truy cập bảng điều khiển hệ thống.
                        </p>
                    </div>

                    <Form
                        name="admin-login"
                        onFinish={onFinish}
                        autoComplete="off"
                        size="large"
                        className="auth-form"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Tên đăng nhập"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Mật khẩu"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                className="auth-submit"
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="auth-switch">
                        <Button type="link" onClick={() => navigate('/login')}>
                            Cổng người dùng
                        </Button>
                    </div>
                </Card>
            </section>
        </div>
    );
}

export default AdminLogin;
