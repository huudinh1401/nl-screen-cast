const deviceService = require('../services/device.service');
const connectionService = require('../services/connection.service');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.activeStreams = new Map();
        this.socketDevices = new Map();
    }

    handleConnection(socket) {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('mobile:register', async (data) => {
            try {
                const { deviceCode } = data;

                console.log('[Mobile] Register request:', { deviceCode, socketId: socket.id });

                if (!deviceCode) {
                    socket.emit('error', { message: 'INVALID_CODE', detail: 'Device code là bắt buộc' });
                    return;
                }

                const device = await deviceService.registerDevice(deviceCode, socket.id);
                this.socketDevices.set(socket.id, device.deviceCode);
                socket.join(`device:${device.deviceCode}`);

                console.log(`[Mobile] Registered: ${device.deviceCode} (${socket.id}) - Joined room: device:${device.deviceCode}`);

                socket.emit('mobile:registered', {
                    success: true,
                    deviceCode: device.deviceCode,
                    message: 'Đăng ký thiết bị thành công'
                });

            } catch (error) {
                console.error('[Mobile] Register error:', error);
                socket.emit('error', { message: 'REGISTER_FAILED', detail: error.message });
            }
        });

        socket.on('web:connect_request', async (data) => {
            try {
                const { deviceCode, requesterName } = data;

                console.log('[Web] Connect request:', { deviceCode, requesterName, socketId: socket.id });

                if (!deviceCode) {
                    socket.emit('error', { message: 'INVALID_CODE', detail: 'Device code là bắt buộc' });
                    return;
                }

                const isOnline = await deviceService.isDeviceOnline(deviceCode);
                console.log(`[Web] Device ${deviceCode} online status:`, isOnline);

                if (!isOnline) {
                    socket.emit('web:connect_result', {
                        success: false,
                        status: 'rejected',
                        message: 'DEVICE_OFFLINE',
                        detail: 'Thiết bị không trực tuyến'
                    });
                    return;
                }

                const request = await connectionService.createRequest(deviceCode, socket.id);

                const roomName = `device:${deviceCode}`;
                console.log(`[Web] Emitting to room: ${roomName}, requestId: ${request.id}`);

                this.io.to(roomName).emit('mobile:incoming_request', {
                    requestId: request.id,
                    clientSocketId: socket.id,
                    deviceCode,
                    requesterName: requesterName || 'Người dùng',
                    timestamp: new Date()
                });

                socket.emit('web:request_sent', {
                    success: true,
                    requestId: request.id,
                    message: 'Yêu cầu kết nối đã được gửi'
                });

            } catch (error) {
                console.error('[Web] Connect request error:', error);
                socket.emit('error', { message: 'REQUEST_FAILED', detail: error.message });
            }
        });

        socket.on('mobile:response', async (data) => {
            try {
                const { requestId, accepted } = data;

                if (!requestId) {
                    socket.emit('error', { message: 'INVALID_REQUEST', detail: 'Request ID là bắt buộc' });
                    return;
                }

                const request = await connectionService.getRequestById(requestId);

                if (!request) {
                    socket.emit('error', { message: 'REQUEST_NOT_FOUND', detail: 'Không tìm thấy yêu cầu' });
                    return;
                }

                const status = accepted ? 'accepted' : 'rejected';
                await connectionService.updateRequestStatus(requestId, status);

                if (accepted) {
                    this.activeStreams.set(request.deviceCode, {
                        requestId,
                        deviceCode: request.deviceCode,
                        clientSocketId: request.clientSocketId,
                        sourceSocketId: null,
                        startedAt: Date.now()
                    });
                } else {
                    this.clearActiveStream(request.deviceCode, {
                        reason: 'rejected',
                        notifyWeb: false,
                        notifyMobile: false
                    });
                }

                this.io.to(request.clientSocketId).emit('web:connect_result', {
                    success: accepted,
                    status,
                    requestId,
                    deviceCode: request.deviceCode,
                    message: accepted ? 'Kết nối được chấp nhận' : 'Kết nối bị từ chối'
                });

                console.log(`[Mobile] Response: ${requestId} - ${status}`);

            } catch (error) {
                console.error('[Mobile] Response error:', error);
                socket.emit('error', { message: 'RESPONSE_FAILED', detail: error.message });
            }
        });

        socket.on('mobile:stream_started', (data = {}) => {
            const deviceCode = data.deviceCode || this.socketDevices.get(socket.id);
            if (!deviceCode) {
                return;
            }

            const activeStream = this.activeStreams.get(deviceCode);
            if (!activeStream) {
                return;
            }

            this.activeStreams.set(deviceCode, {
                ...activeStream,
                sourceSocketId: socket.id,
                liveAt: Date.now()
            });

            this.io.to(activeStream.clientSocketId).emit('mobile:stream_started', {
                requestId: activeStream.requestId,
                deviceCode,
                startedAt: new Date().toISOString()
            });

            this.io.to(`device:${deviceCode}`).emit('mobile:stream_state', {
                deviceCode,
                status: 'live'
            });
        });

        socket.on('webrtc:offer', (data = {}) => {
            const deviceCode = data.deviceCode;
            const activeStream = deviceCode ? this.activeStreams.get(deviceCode) : null;
            if (!deviceCode || !activeStream || activeStream.clientSocketId !== socket.id) {
                return;
            }

            this.io.to(`device:${deviceCode}`).emit('webrtc:offer', {
                requestId: activeStream.requestId,
                deviceCode,
                sdp: data.sdp
            });
        });

        socket.on('webrtc:answer', (data = {}) => {
            const deviceCode = data.deviceCode || this.socketDevices.get(socket.id);
            const activeStream = deviceCode ? this.activeStreams.get(deviceCode) : null;
            if (!deviceCode || !activeStream) {
                return;
            }

            this.io.to(activeStream.clientSocketId).emit('webrtc:answer', {
                requestId: activeStream.requestId,
                deviceCode,
                sdp: data.sdp
            });
        });

        socket.on('webrtc:ice_candidate', (data = {}) => {
            const deviceCode = data.deviceCode || this.socketDevices.get(socket.id);
            const activeStream = deviceCode ? this.activeStreams.get(deviceCode) : null;
            if (!deviceCode || !activeStream || !data.candidate) {
                return;
            }

            if (socket.id === activeStream.clientSocketId) {
                this.io.to(`device:${deviceCode}`).emit('webrtc:ice_candidate', {
                    requestId: activeStream.requestId,
                    deviceCode,
                    candidate: data.candidate,
                    source: 'viewer'
                });
                return;
            }

            this.io.to(activeStream.clientSocketId).emit('webrtc:ice_candidate', {
                requestId: activeStream.requestId,
                deviceCode,
                candidate: data.candidate,
                source: 'mobile'
            });
        });

        socket.on('mobile:stream_stopped', (data = {}) => {
            const deviceCode = data.deviceCode || this.socketDevices.get(socket.id);
            if (!deviceCode) {
                return;
            }

            this.clearActiveStream(deviceCode, {
                reason: data.reason || 'ended',
                sourceSocketId: socket.id
            });
        });

        socket.on('web:leave_stream', (data = {}) => {
            const targetDeviceCode = data.deviceCode;
            if (targetDeviceCode) {
                const activeStream = this.activeStreams.get(targetDeviceCode);
                if (activeStream?.clientSocketId === socket.id) {
                    this.clearActiveStream(targetDeviceCode, {
                        reason: data.reason || 'viewer_closed',
                        notifyWeb: false
                    });
                }
                return;
            }

            const activeStream = [...this.activeStreams.values()].find((stream) => stream.clientSocketId === socket.id);
            if (activeStream) {
                this.clearActiveStream(activeStream.deviceCode, {
                    reason: data.reason || 'viewer_closed',
                    notifyWeb: false
                });
            }
        });

        socket.on('disconnect', async () => {
            try {
                const disconnectedDeviceCode = this.socketDevices.get(socket.id);
                if (disconnectedDeviceCode) {
                    const activeStream = this.activeStreams.get(disconnectedDeviceCode);
                    if (activeStream?.sourceSocketId === socket.id) {
                        this.clearActiveStream(disconnectedDeviceCode, {
                            reason: 'mobile_disconnected',
                            sourceSocketId: socket.id
                        });
                    }
                    this.socketDevices.delete(socket.id);
                    await this.restoreDevicePresence(disconnectedDeviceCode, socket.id);
                } else {
                    const activeStream = [...this.activeStreams.values()].find((stream) => stream.clientSocketId === socket.id);
                    if (activeStream) {
                        this.clearActiveStream(activeStream.deviceCode, {
                            reason: 'viewer_disconnected',
                            notifyWeb: false
                        });
                    }
                }

                await deviceService.setDeviceOffline(socket.id);
                console.log(`[Socket] Client disconnected: ${socket.id}`);
            } catch (error) {
                console.error('[Socket] Disconnect error:', error);
            }
        });

        socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
        });
    }

    setupTimeoutCleanup() {
        setInterval(async () => {
            try {
                await connectionService.timeoutOldRequests(5);
            } catch (error) {
                console.error('[Cleanup] Timeout cleanup error:', error);
            }
        }, 60000);
    }

    clearActiveStream(deviceCode, options = {}) {
        const activeStream = this.activeStreams.get(deviceCode);
        if (!activeStream) {
            return;
        }

        this.activeStreams.delete(deviceCode);

        const payload = {
            requestId: activeStream.requestId,
            deviceCode,
            reason: options.reason || 'ended',
            endedAt: new Date().toISOString()
        };

        if (options.notifyWeb !== false) {
            this.io.to(activeStream.clientSocketId).emit('mobile:stream_stopped', payload);
        }

        if (options.notifyMobile !== false) {
            this.io.to(`device:${deviceCode}`).emit('mobile:stream_stopped', payload);
            this.io.to(`device:${deviceCode}`).emit('mobile:stream_state', {
                deviceCode,
                status: 'idle'
            });
        }
    }

    async restoreDevicePresence(deviceCode, disconnectedSocketId) {
        const fallbackSocketId = [...this.socketDevices.entries()]
            .find(([socketId, mappedDeviceCode]) => socketId !== disconnectedSocketId && mappedDeviceCode === deviceCode)?.[0];

        if (!fallbackSocketId) {
            await deviceService.setDeviceOffline(disconnectedSocketId);
            return;
        }

        await deviceService.registerDevice(deviceCode, fallbackSocketId);
        this.io.to(`device:${deviceCode}`).emit('mobile:stream_state', {
            deviceCode,
            status: 'idle'
        });
    }
}

module.exports = SocketHandler;
