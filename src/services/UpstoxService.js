const UPSTOX_BASE_URL = '/api/upstox/v2';
const UPSTOX_BASE_URL_v3 = '/api/upstox/v3';

export const UpstoxService = {
    getHoldings: async (token) => {
        try {
            const response = await fetch(`${UPSTOX_BASE_URL}/portfolio/long-term-holdings`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch Holdings Error:', error);
            throw error;
        }
    },

    getShortTermPositions: async (token) => {
        try {
            const response = await fetch(`${UPSTOX_BASE_URL}/portfolio/short-term-positions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch Positions Error:', error);
            throw error;
        }
    }
};
