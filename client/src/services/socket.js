import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }
    return socket;
};

export const connectSocket = (user) => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
        s.on('connect', () => {
            console.log('Socket connected:', s.id);
            if (user?.role === 'admin') {
                s.emit('join-admin-room');
            } else if (user?.id) {
                s.emit('join-author-room', user.id);
            }
        });
    }
};

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect();
    }
};
