import { useEffect, useState } from 'react';
import socketService from '../services/WebSocketService';

export const useWebSocket = (url = 'mock') => {
    const [isConnected, setIsConnected] = useState(socketService.isConnected);

    useEffect(() => {
        // Connect on mount
        socketService.connect(url);

        // Subscribe to connection status
        const unsubscribe = socketService.onConnectionChange(setIsConnected);

        return () => {
            unsubscribe();
            // Optional: disconnect on unmount if this is the only consumer
            // socketService.disconnect(); 
        };
    }, [url]);

    return { isConnected };
};

export const useSubscription = (topic, onData) => {
    useEffect(() => {
        const unsubscribe = socketService.subscribe(topic, onData);
        return () => unsubscribe();
    }, [topic, onData]);
};
