import { configureStore } from '@reduxjs/toolkit';
import dailyDataReducer from './dailyDataSlice';
import watchlistReducer from './watchlistSlice';
import instrumentAnalysisReducer from './instrumentAnalysisSlice';

export const store = configureStore({
    reducer: {
        dailyData: dailyDataReducer,
        watchlist: watchlistReducer,
        instrumentAnalysis: instrumentAnalysisReducer,
    },
});
