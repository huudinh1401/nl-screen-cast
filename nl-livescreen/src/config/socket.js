import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

let socket = null;

export const initSocket = async () => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = await SecureStore.getItemAsync('accessToken');

    socket = io('http://192.168.62.45:3000', {
        transports: ['websocket', 'polling'],
        rememberUpgrade: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
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
        console.error('Socket connection error:', error);
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
