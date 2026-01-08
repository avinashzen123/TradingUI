import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
    try {
        const serializedState = localStorage.getItem('watchlist');
        if (serializedState === null) {
            return { items: [] };
        }
        return { items: JSON.parse(serializedState) };
    } catch (err) {
        return { items: [] };
    }
};

const initialState = loadState();

export const watchlistSlice = createSlice({
    name: 'watchlist',
    initialState,
    reducers: {
        addToWatchlist: (state, action) => {
            const instrument = action.payload;
            // Prevent duplicates
            const exists = state.items.some(item => item.instrument_key === instrument.instrument_key);
            if (!exists) {
                // Set default timeframe: 5 minutes
                state.items.push({
                    ...instrument,
                    analysisInterval: 5,
                    analysisUnit: 'minutes'
                });
                localStorage.setItem('watchlist', JSON.stringify(state.items));
            }
        },
        removeFromWatchlist: (state, action) => {
            const instrumentKey = action.payload;
            state.items = state.items.filter(item => item.instrument_key !== instrumentKey);
            localStorage.setItem('watchlist', JSON.stringify(state.items));
        },
        updateTimeframe: (state, action) => {
            const { instrumentKey, interval, unit } = action.payload;
            const item = state.items.find(i => i.instrument_key === instrumentKey);
            if (item) {
                item.analysisInterval = interval;
                item.analysisUnit = unit;
                localStorage.setItem('watchlist', JSON.stringify(state.items));
            }
        },
    },
});

export const { addToWatchlist, removeFromWatchlist, updateTimeframe } = watchlistSlice.actions;

export const selectWatchlist = (state) => state.watchlist.items;

export default watchlistSlice.reducer;
