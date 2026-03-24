import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import './AuthPages.css';

function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        authService.setAuthEntry('user');
    }, []);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const result = await authService.login(values.username, values.password);

            if (result.success) {
                message.success('Đăng nhập thành công!');
                const user = result.user;
                if (authService.isAdminUser(user)) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/user/devices');
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
                        <span className="auth-chip">Secure access</span>
                        <h1 className="auth-title">Thiết bị và kết nối trong một cổng làm việc</h1>
                        <p className="auth-lead">
                            Quản lý thiết bị cá nhân và theo dõi trạng thái kết nối nhanh gọn.
                        </p>
                    </div>

                    <div className="auth-metrics">
                        <div className="auth-metric-card">
                            <div className="auth-metric-value">User</div>
                            <div className="auth-metric-label">Portal</div>
                        </div>
                        <div className="auth-metric-card">
                            <div className="auth-metric-value">Live</div>
                            <div className="auth-metric-label">Status</div>
                        </div>
                    </div>

                    <div className="auth-feature-board">
                        <div className="auth-feature-panel">
                            <div className="auth-panel-label">Core functions</div>
                            <div className="auth-feature-list">
                                <div className="auth-feature-item">
                                    <div className="auth-feature-title">Liên kết thiết bị</div>
                                    <div className="auth-feature-copy">Claim, đổi tên, theo dõi.</div>
                                </div>
                                <div className="auth-feature-item">
                                    <div className="auth-feature-title">Trạng thái trực tuyến</div>
                                    <div className="auth-feature-copy">Xem online và lần kết nối cuối.</div>
                                </div>
                            </div>
                        </div>

                        <div className="auth-activity-panel">
                            <div className="auth-panel-label">Highlights</div>
                            <div className="auth-activity-list">
                                <div className="auth-activity-item">
                                    <span className="auth-activity-dot" />
                                    <div className="auth-activity-copy">
                                        <div className="auth-activity-title">Device Claim</div>
                                        <div className="auth-activity-text">Nhập mã để thêm thiết bị.</div>
                                    </div>
                                </div>
                                <div className="auth-activity-item">
                                    <span className="auth-activity-dot" />
                                    <div className="auth-activity-copy">
                                        <div className="auth-activity-title">Live Presence</div>
                                        <div className="auth-activity-text">Theo dõi kết nối hiện tại.</div>
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
                        <span className="auth-card-badge">User</span>
                        <h1 className="auth-card-title">Đăng nhập</h1>
                        <p className="auth-card-subtitle">
                            Truy cập cổng thiết bị của bạn.
                        </p>
                    </div>

                    <Form
                        name="login"
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
                </Card>
            </section>
        </div>
    );
}

export default Login;
