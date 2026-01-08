import pako from 'pako';

const DB_NAME = 'TradingAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'instruments';

const URLs = {
    NSE: '/api/assets/market-quote/instruments/exchange/NSE.json.gz',
    MCX: '/api/assets/market-quote/instruments/exchange/MCX.json.gz'
};

// IndexedDB Helper
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'segment' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const getFromDB = async (segment) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(segment);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToDB = async (segment, data) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const today = new Date().toISOString().split('T')[0];
        const request = store.put({ segment, date: today, data });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const InstrumentService = {
    getInstruments: async (segment) => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Check Cache
        try {
            const cached = await getFromDB(segment);
            if (cached && cached.date === today && cached.data.length > 0) {
                console.log(`[InstrumentService] Returning cached data for ${segment}`);
                return cached.data;
            }
        } catch (e) {
            console.warn('IDB Read Error', e);
        }

        // 2. Fetch & Decompress
        console.log(`[InstrumentService] Fetching new data for ${segment}`);
        try {
            const response = await fetch(URLs[segment]);
            if (!response.ok) throw new Error(`Download failed: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();

            // Decompress GZIP
            let jsonStr;
            try {
                const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
                jsonStr = decompressed;
            } catch (inflateErr) {
                // Fallback: Maybe browser decompressed it automatically?
                const textDecoder = new TextDecoder("utf-8");
                jsonStr = textDecoder.decode(arrayBuffer);
            }

            const data = JSON.parse(jsonStr);

            // 3. Cache it
            await saveToDB(segment, data);

            return data;
        } catch (err) {
            console.error('Instrument Load Error:', err);
            throw err;
        }
    },

    search: (instruments, query, type) => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();

        return instruments.filter(inst => {
            const matchesQuery = inst.trading_symbol && inst.trading_symbol.toLowerCase().includes(lowerQuery);
            const matchesType = type ? inst.instrument_type === type : true;
            return matchesQuery && matchesType;
        }).slice(0, 50);
    }
};
