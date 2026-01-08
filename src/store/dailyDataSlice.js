import { createSlice } from '@reduxjs/toolkit';

// Helper to load state from local storage with expiry check
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('dailyData');
        if (serializedState === null) {
            return { data: {}, lastUpdated: null };
        }
        const parsedState = JSON.parse(serializedState);

        // Check if data is from today
        if (parsedState.lastUpdated) {
            const lastDate = new Date(parsedState.lastUpdated);
            const today = new Date();

            if (
                lastDate.getDate() !== today.getDate() ||
                lastDate.getMonth() !== today.getMonth() ||
                lastDate.getFullYear() !== today.getFullYear()
            ) {
                // Expired (not from today)
                console.log('Daily data expired, clearing storage.');
                localStorage.removeItem('dailyData');
                return { data: {}, lastUpdated: null };
            }
        }

        return parsedState;
    } catch (err) {
        console.error('Failed to load state', err);
        return { data: {}, lastUpdated: null };
    }
};

const initialState = loadState();

export const dailyDataSlice = createSlice({
    name: 'dailyData',
    initialState,
    reducers: {
        setDailyData: (state, action) => {
            state.data = { ...state.data, ...action.payload };
            state.lastUpdated = new Date().toISOString();

            // Persist to local storage
            localStorage.setItem('dailyData', JSON.stringify(state));
        },
        clearDailyData: (state) => {
            state.data = {};
            state.lastUpdated = null;
            localStorage.removeItem('dailyData');
        },
    },
});

export const { setDailyData, clearDailyData } = dailyDataSlice.actions;

export const selectDailyData = (state) => state.dailyData.data;

export default dailyDataSlice.reducer;
