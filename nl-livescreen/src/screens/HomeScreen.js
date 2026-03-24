import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { deviceService } from '../services/deviceService';
import { initSocket } from '../config/socket';
import { screenBroadcastService } from '../services/screenBroadcastService';

export default function HomeScreen() {
    const [deviceCode, setDeviceCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [streamState, setStreamState] = useState('idle');
    const [streamMessage, setStreamMessage] = useState('Sẵn sàng nhận kết nối');

    useEffect(() => {
        loadDeviceCode();
    }, []);

    useEffect(() => {
        if (deviceCode) {
            setupSocket();
        }
    }, [deviceCode]);

    const loadDeviceCode = async () => {
        try {
            setLoading(true);
            const code = await deviceService.getOrCreateDeviceCode();
            setDeviceCode(code);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lấy mã thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = async () => {
        try {
            const socket = await initSocket();

            socket.off('connect');
            socket.off('disconnect');
            socket.off('mobile:incoming_request');
            socket.off('mobile:stream_started');
            socket.off('mobile:stream_stopped');
            socket.off('mobile:stream_state');

            socket.on('connect', () => {
                setIsOnline(true);
                setStreamState('idle');
                setStreamMessage('Sẵn sàng nhận kết nối');
                console.log('Socket connected, registering device with code:', deviceCode);
                socket.emit('mobile:register', { deviceCode });
            });

            socket.on('disconnect', () => {
                setIsOnline(false);
                setStreamState('idle');
                setStreamMessage('Mất kết nối tới máy chủ');
            });

            socket.on('mobile:incoming_request', (data) => {
                Alert.alert(
                    'Yêu cầu kết nối',
                    `Có yêu cầu xem màn hình từ ${data.requesterName || 'người dùng'}`,
                    [
                        {
                            text: 'Từ chối',
                            onPress: () => {
                                socket.emit('mobile:response', {
                                    requestId: data.requestId,
                                    accepted: false
                                });
                            },
                            style: 'cancel'
                        },
                        {
                            text: 'Đồng ý',
                            onPress: () => {
                                setStreamState('pending');
                                setStreamMessage('Đã chấp nhận. Đang mở bảng chia sẻ màn hình...');
                                socket.emit('mobile:response', {
                                    requestId: data.requestId,
                                    accepted: true
                                });
                                setTimeout(() => {
                                    void startSystemBroadcast(socket);
                                }, 450);
                            }
                        }
                    ]
                );
            });

            socket.on('mobile:stream_started', () => {
                setStreamState('live');
                setStreamMessage('Đang truyền màn hình lên web');
            });

            socket.on('mobile:stream_stopped', (data) => {
                setStreamState('idle');
                socket.emit('mobile:register', { deviceCode });
                if (data?.reason === 'viewer_closed') {
                    setStreamMessage('Người xem đã đóng phiên và luồng đã được làm mới');
                    return;
                }
                setStreamMessage('Luồng trước đã kết thúc và đã được làm mới');
            });

            socket.on('mobile:stream_state', (data) => {
                if (data?.status === 'live') {
                    setStreamState('live');
                    setStreamMessage('Đang truyền màn hình lên web');
                }

                if (data?.status === 'idle') {
                    setStreamState('idle');
                    setStreamMessage('Sẵn sàng nhận kết nối');
                }
            });
        } catch (error) {
            console.error('Lỗi kết nối socket:', error);
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(deviceCode);
        Alert.alert('Đã sao chép', 'Mã thiết bị đã được sao chép vào clipboard');
    };

    const startSystemBroadcast = async (socket) => {
        try {
            setStreamState('starting');
            setStreamMessage('Đang mở bảng chia sẻ màn hình của iPhone...');
            await screenBroadcastService.startFullScreenBroadcast(deviceCode);
        } catch (error) {
            setStreamState('idle');
            setStreamMessage('Không thể bắt đầu broadcast. Trạng thái đã được làm mới');
            if (socket && deviceCode) {
                socket.emit('mobile:stream_stopped', {
                    deviceCode,
                    reason: 'start_failed'
                });
            }
            Alert.alert('Không thể mở broadcast', error.message || 'Vui lòng kiểm tra native module và Broadcast Extension');
        }
    };

    const formatDeviceCode = (code) => {
        // Giữ nguyên format NL-XXXXXX
        return code;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>NL ScreenCast</Text>
                <View style={styles.headerRow}>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                        <Text style={styles.statusText}>{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</Text>
                    </View>
                    <View style={[styles.streamBadge, streamState === 'live' && styles.streamBadgeLive]}>
                        <Text style={[styles.streamBadgeText, streamState === 'live' && styles.streamBadgeTextLive]}>
                            {streamState === 'live' ? 'Đang stream' : streamState === 'pending' ? 'Chờ broadcast' : 'Sẵn sàng'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Mã thiết bị của bạn</Text>
                <View style={styles.codeContainer}>
                    <Text style={styles.deviceCode}>{formatDeviceCode(deviceCode)}</Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                    <Text style={styles.copyButtonText}>Sao chép mã</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>{streamMessage}</Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Hướng dẫn sử dụng</Text>
                <Text style={styles.infoText}>1. Giữ ứng dụng mở và kết nối internet</Text>
                <Text style={styles.infoText}>2. Chia sẻ mã thiết bị cho người cần kết nối</Text>
                <Text style={styles.infoText}>3. Chấp nhận yêu cầu kết nối khi có thông báo</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
        paddingTop: 60
    },
    header: {
        marginBottom: 30
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#94a3b8',
        marginRight: 6
    },
    statusDotOnline: {
        backgroundColor: '#22c55e'
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b'
    },
    streamBadge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe'
    },
    streamBadgeLive: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac'
    },
    streamBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1d4ed8'
    },
    streamBadgeTextLive: {
        color: '#15803d'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    codeContainer: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0'
    },
    deviceCode: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1d4ed8',
        textAlign: 'center',
        letterSpacing: 2
    },
    copyButton: {
        backgroundColor: '#1d4ed8',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12
    },
    copyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    },
    hint: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 18
    },
    infoCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe'
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 12
    },
    infoText: {
        fontSize: 13,
        color: '#3b82f6',
        marginBottom: 8,
        lineHeight: 20
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b'
    }
});
