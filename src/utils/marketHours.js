export const isMarketOpen = (exchange) => {
    // Current time in IST (Assuming system time is accurate or close enough for client-side check)
    // NSE: 09:15 - 15:15
    // MCX: 09:00 - 23:45 

    // Check if weekend (Saturday=6, Sunday=0)
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) {
        return { isOpen: false, message: 'Weekend' };
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const exchangeCode = exchange ? exchange.toUpperCase() : 'NSE';

    if (exchangeCode.includes('MCX')) {
        // 9:00 AM (540 mins) to 11:45 PM (1425 mins)
        const start = 9 * 60;
        const end = 23 * 60 + 45;
        if (currentTime >= start && currentTime < end) {
            return { isOpen: true, message: 'Open' };
        }
        return { isOpen: false, message: 'Closed (09:00 - 23:45)' };
    } else {
        // Default to NSE (includes NSE_EQ, NSE_FO)
        // 9:15 AM (555 mins) to 3:30 PM (15:30 = 930 mins) - User said 15:15 close, usually trading stops 3:30 but let's stick to request 15:15? 
        // User Request: "NSE Starts at 9:15 am and close at 15:15PM" -> 15:15 is 3:15 PM.
        const start = 9 * 60 + 15;
        const end = 15 * 60 + 15;
        if (currentTime >= start && currentTime < end) {
            return { isOpen: true, message: 'Open' };
        }
        return { isOpen: false, message: 'Closed (09:15 - 15:15)' };
    }
};
