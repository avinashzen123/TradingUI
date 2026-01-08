import { configureStore } from '@reduxjs/toolkit';
import dailyDataReducer from './dailyDataSlice';
import watchlistReducer from './watchlistSlice';

export const store = configureStore({
    reducer: {
        dailyData: dailyDataReducer,
        watchlist: watchlistReducer,
    },
});
