class WebSocketService {
    constructor() {
        this.socket = null;
        this.subscribers = new Map(); // topic -> Set(callbacks)
        this.appStateSubscribers = new Set(); // Global connection state listeners
        this.isConnected = false;
        this.mockInterval = null;
    }

    connect(url) {
        if (url === 'mock') {
            this._startMockMode();
            return;
        }

        if (this.socket) {
            this.socket.close();
        }

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.isConnected = true;
            this._notifyAppState();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this._dispatch(data);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket Disconnected');
            this.isConnected = false;
            this._notifyAppState();
            // Simple reconnection logic could go here
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        this.subscribers.get(topic).add(callback);

        // Return unsubscribe function
        return () => {
            if (this.subscribers.has(topic)) {
                this.subscribers.get(topic).delete(callback);
            }
        };
    }

    onConnectionChange(callback) {
        this.appStateSubscribers.add(callback);
        callback(this.isConnected);
        return () => this.appStateSubscribers.delete(callback);
    }

    _dispatch(data) {
        // Expecting data format: { type: 'ticker'|'order', payload: ... }
        const { type, payload } = data;
        if (this.subscribers.has(type)) {
            this.subscribers.get(type).forEach(cb => cb(payload));
        }
    }

    _notifyAppState() {
        this.appStateSubscribers.forEach(cb => cb(this.isConnected));
    }

    // Mock Mode for Demonstration
    _startMockMode() {
        this.isConnected = true;
        this._notifyAppState();

        console.log('Starting Mock WebSocket Mode');

        this.mockInterval = setInterval(() => {
            // Mock Ticker Update
            const tickerUpdate = {
                type: 'ticker',
                payload: {
                    symbol: 'BTC-USD',
                    price: 45000 + Math.random() * 100 - 50,
                    timestamp: Date.now()
                }
            };
            this._dispatch(tickerUpdate);

            // Randomly mock order update
            if (Math.random() > 0.9) {
                const orderUpdate = {
                    type: 'order',
                    payload: {
                        id: Math.floor(Math.random() * 1000),
                        status: Math.random() > 0.5 ? 'FILLED' : 'PARTIAL',
                        filledQuantity: Math.random() * 10
                    }
                };
                this._dispatch(orderUpdate);
            }
        }, 1000);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
        }
        this.isConnected = false;
        this._notifyAppState();
    }
}

const socketService = new WebSocketService();
export default socketService;
