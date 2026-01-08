import { configureStore } from '@reduxjs/toolkit';
import dailyDataReducer from './dailyDataSlice';

export const store = configureStore({
    reducer: {
        dailyData: dailyDataReducer,
    },
});
