import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { SOCKET_URL } from './network';

let socket = null;

export const initSocket = async () => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = await SecureStore.getItemAsync('accessToken');

    socket = io(SOCKET_URL, {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        auth: {
            token: token
        }
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error?.message || error, {
            description: error?.description,
            context: error?.context,
            type: error?.type
        });
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket chưa được khởi tạo. Gọi initSocket() trước.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
