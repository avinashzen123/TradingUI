/**
 * Test utility for custom indicators
 * Run this in browser console to verify calculations
 */

import { calculateHMA, calculateWMA, calculateSMA, calculateEMA } from './customIndicators';

export function testHMA() {
    console.log('=== Testing HMA Calculation ===');
    
    // Test data: simple increasing sequence
    const testData = [];
    for (let i = 1; i <= 100; i++) {
        testData.push(i);
    }
    
    console.log('Test data length:', testData.length);
    console.log('First 10 values:', testData.slice(0, 10));
    console.log('Last 10 values:', testData.slice(-10));
    
    // Test with period 20
    const period = 20;
    console.log(`\nCalculating HMA with period ${period}...`);
    
    const hma = calculateHMA(testData, period);
    
    console.log('HMA result length:', hma.length);
    console.log('Expected minimum length:', testData.length - period - Math.floor(Math.sqrt(period)));
    
    if (hma.length > 0) {
        console.log('First 5 HMA values:', hma.slice(0, 5));
        console.log('Last 5 HMA values:', hma.slice(-5));
        console.log('✅ HMA calculation successful!');
    } else {
        console.error('❌ HMA calculation failed - no values returned');
    }
    
    return hma;
}

export function testWMA() {
    console.log('\n=== Testing WMA Calculation ===');
    
    const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const period = 5;
    
    console.log('Test data:', testData);
    console.log('Period:', period);
    
    const wma = calculateWMA(testData, period);
    
    console.log('WMA result:', wma);
    console.log('WMA length:', wma.length);
    console.log('Expected length:', testData.length - period + 1);
    
    if (wma.length === testData.length - period + 1) {
        console.log('✅ WMA calculation successful!');
    } else {
        console.error('❌ WMA calculation failed - wrong length');
    }
    
    return wma;
}

export function testAllMovingAverages() {
    console.log('\n=== Testing All Moving Averages ===');
    
    const testData = [];
    for (let i = 1; i <= 50; i++) {
        testData.push(i);
    }
    
    const period = 10;
    
    console.log(`Test data length: ${testData.length}, Period: ${period}`);
    
    const sma = calculateSMA(testData, period);
    const ema = calculateEMA(testData, period);
    const wma = calculateWMA(testData, period);
    const hma = calculateHMA(testData, period);
    
    console.log('\nResults:');
    console.log('SMA length:', sma.length, '- Last value:', sma[sma.length - 1]);
    console.log('EMA length:', ema.length, '- Last value:', ema[ema.length - 1]);
    console.log('WMA length:', wma.length, '- Last value:', wma[wma.length - 1]);
    console.log('HMA length:', hma.length, '- Last value:', hma[hma.length - 1]);
    
    const allSuccess = sma.length > 0 && ema.length > 0 && wma.length > 0 && hma.length > 0;
    
    if (allSuccess) {
        console.log('\n✅ All moving averages calculated successfully!');
    } else {
        console.error('\n❌ Some calculations failed');
    }
    
    return { sma, ema, wma, hma };
}

// Auto-run tests if in development
if (import.meta.env.DEV) {
    console.log('Custom Indicators Test Utility Loaded');
    console.log('Run testHMA(), testWMA(), or testAllMovingAverages() in console');
}
