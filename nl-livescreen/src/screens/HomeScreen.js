import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Image,
    useWindowDimensions
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { deviceService } from '../services/deviceService';
import { initSocket } from '../config/socket';
import { screenBroadcastService } from '../services/screenBroadcastService';

const APP_LOGO = require('../../assets/konen.png');

export default function HomeScreen() {
    const [deviceCode, setDeviceCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [streamState, setStreamState] = useState('idle');
    const [streamMessage, setStreamMessage] = useState('Sẵn sàng nhận kết nối');
    const [activeScreen, setActiveScreen] = useState('connect');
    const { width } = useWindowDimensions();
    const isTabletLayout = width >= 820;

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
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    isTabletLayout && styles.scrollContentTablet
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.shell, isTabletLayout && styles.shellTablet]}>
                    <View style={styles.topPanel}>
                        <View style={styles.heroCompact}>
                            <View style={styles.brandCluster}>
                                <View style={styles.logoWrap}>
                                    <Image
                                        source={APP_LOGO}
                                        style={styles.logo}
                                        resizeMode="contain"
                                        accessibilityLabel="Logo NL Screen Cast"
                                    />
                                </View>
                                <View style={styles.heroTextBlock}>
                                    <Text style={styles.eyebrow}>Trình chiếu màn hình iPhone</Text>
                                    <Text style={styles.title}>NL ScreenCast</Text>
                                    <Text style={styles.subtitle}>
                                        Kết nối iPhone với web hoặc PC để trình chiếu hình ảnh.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.headerBadges}>
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

                        <View style={styles.segmentedControl}>
                            <TouchableOpacity
                                style={[styles.segmentButton, activeScreen === 'guide' && styles.segmentButtonActive]}
                                onPress={() => setActiveScreen('guide')}
                            >
                                <Text style={[styles.segmentText, activeScreen === 'guide' && styles.segmentTextActive]}>
                                    Hướng dẫn
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentButton, activeScreen === 'connect' && styles.segmentButtonActive]}
                                onPress={() => setActiveScreen('connect')}
                            >
                                <Text style={[styles.segmentText, activeScreen === 'connect' && styles.segmentTextActive]}>
                                    Kết nối
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {activeScreen === 'guide' ? (
                        <View style={[styles.contentGrid, isTabletLayout && styles.contentGridTablet]}>
                            <View style={styles.primaryColumn}>
                                <View style={styles.heroCard}>
                                    <View style={[styles.featureGrid, isTabletLayout && styles.featureGridTablet]}>
                                        <View style={styles.featureCard}>
                                            <Text style={styles.featureTitle}>Ứng dụng này dùng để làm gì</Text>
                                            <Text style={styles.featureBody}>
                                                Trình chiếu trực tiếp màn hình iPhone lên giao diện web để người hướng dẫn
                                                có thể giải thích rõ từng bước cài đặt và sử dụng ứng dụng.
                                            </Text>
                                        </View>
                                        <View style={styles.featureCard}>
                                            <Text style={styles.featureTitle}>Ai sẽ sử dụng</Text>
                                            <Text style={styles.featureBody}>
                                                Phù hợp cho đội onboarding, hỗ trợ khách hàng, đào tạo nội bộ và các buổi
                                                demo thao tác phần mềm trên điện thoại.
                                            </Text>
                                        </View>
                                        <View style={styles.featureCard}>
                                            <Text style={styles.featureTitle}>Vì sao cần broadcast screen</Text>
                                            <Text style={styles.featureBody}>
                                                Việc phát màn hình giúp trình bày thao tác trên thiết bị thật, giảm nhầm lẫn
                                                khi hướng dẫn qua điện thoại hoặc nhắn tin.
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.storyCard}>
                                    <Text style={styles.storyTitle}>Quy trình kết nối</Text>
                                    <View style={styles.stepRow}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepBadgeText}>1</Text>
                                        </View>
                                        <View style={styles.stepContent}>
                                            <Text style={styles.stepTitle}>Giữ ứng dụng mở</Text>
                                            <Text style={styles.stepText}>
                                                Thiết bị cần duy trì kết nối internet ổn định để luôn sẵn sàng nhận yêu cầu trình chiếu.
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.stepRow}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepBadgeText}>2</Text>
                                        </View>
                                        <View style={styles.stepContent}>
                                            <Text style={styles.stepTitle}>Chia sẻ mã thiết bị</Text>
                                            <Text style={styles.stepText}>
                                                Gửi mã này cho người đang thao tác trên nền tảng web hoặc PC để ghép đúng điện thoại.
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.stepRow}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepBadgeText}>3</Text>
                                        </View>
                                        <View style={styles.stepContent}>
                                            <Text style={styles.stepTitle}>Chấp nhận và bắt đầu phát</Text>
                                            <Text style={styles.stepText}>
                                                Khi có yêu cầu, xác nhận trên iPhone để mở bảng chia sẻ màn hình và bắt đầu trình chiếu.
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.secondaryColumn}>
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoTitle}>Khi nào nên dùng</Text>
                                    <Text style={styles.infoText}>
                                        Dùng trong các buổi onboarding khách hàng, hướng dẫn cài đặt app, đào tạo thao
                                        tác cho nhân sự mới hoặc hỗ trợ xử lý lỗi trực tiếp trên màn hình iPhone.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.contentGrid, isTabletLayout && styles.contentGridTablet]}>
                            <View style={styles.primaryColumn}>
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
                            </View>

                            <View style={styles.secondaryColumn}>
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoTitle}>Hướng dẫn sử dụng</Text>
                                    <Text style={styles.infoText}>1. Giữ ứng dụng mở và kết nối internet</Text>
                                    <Text style={styles.infoText}>2. Chia sẻ mã thiết bị cho người cần kết nối</Text>
                                    <Text style={styles.infoText}>3. Chấp nhận yêu cầu kết nối khi có thông báo</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef4ff'
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 40,
        paddingBottom: 40
    },
    scrollContentTablet: {
        paddingHorizontal: 28,
        paddingTop: 48,
        paddingBottom: 48
    },
    shell: {
        width: '100%',
        alignSelf: 'center',
        gap: 20
    },
    shellTablet: {
        maxWidth: 1120
    },
    topPanel: {
        gap: 16
    },
    heroCompact: {
        backgroundColor: '#0f172a',
        borderRadius: 28,
        padding: 20,
        gap: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.12,
        shadowRadius: 30,
        elevation: 8
    },
    heroCard: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.12,
        shadowRadius: 30,
        elevation: 8
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#dbe7f5',
        borderRadius: 18,
        padding: 4,
        gap: 4,
        alignSelf: 'flex-start'
    },
    segmentButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 14
    },
    segmentButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569'
    },
    segmentTextActive: {
        color: '#0f172a'
    },
    heroTopRow: {
        gap: 18
    },
    heroTopRowTablet: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    brandCluster: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        flex: 1
    },
    logoWrap: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    logo: {
        width: 56,
        height: 56
    },
    heroTextBlock: {
        flex: 1
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: '#93c5fd',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginBottom: 8
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#f8fafc',
        marginBottom: 12
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 24,
        color: '#cbd5e1',
        maxWidth: 640
    },
    headerBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)'
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
        color: '#e2e8f0'
    },
    streamBadge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(59,130,246,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(147,197,253,0.35)'
    },
    streamBadgeLive: {
        backgroundColor: 'rgba(34,197,94,0.16)',
        borderColor: 'rgba(134,239,172,0.35)'
    },
    streamBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#bfdbfe'
    },
    streamBadgeTextLive: {
        color: '#bbf7d0'
    },
    featureGrid: {
        marginTop: 24,
        gap: 12
    },
    featureGridTablet: {
        flexDirection: 'row'
    },
    featureCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 10
    },
    featureBody: {
        fontSize: 13,
        lineHeight: 21,
        color: '#cbd5e1'
    },
    contentGrid: {
        gap: 20
    },
    contentGridTablet: {
        flexDirection: 'row',
        alignItems: 'stretch'
    },
    primaryColumn: {
        flex: 1.15,
        gap: 20
    },
    secondaryColumn: {
        flex: 0.85,
        gap: 20
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
    storyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#dbe7f5',
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2
    },
    storyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 18
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
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 16
    },
    stepBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepBadgeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1d4ed8'
    },
    stepContent: {
        flex: 1
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4
    },
    stepText: {
        fontSize: 13,
        lineHeight: 21,
        color: '#64748b'
    },
    infoCard: {
        backgroundColor: '#f8fbff',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: '#dbeafe'
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e3a8a',
        marginBottom: 14
    },
    infoText: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 10,
        lineHeight: 22
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b'
    }
});
