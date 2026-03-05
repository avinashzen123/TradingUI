# Alerts Panel Fixes

## Issues Fixed

### 1. Alerts appear in all views ✓
- Moved `<AlertsPanel />` from `AnalysisDashboard.jsx` to `App.jsx`
- Now appears globally across all routes (Dashboard, Watchlist, Orders, Holdings, etc.)
- Positioned in the main content area after Header

### 2. Mobile visibility fixed ✓
- Updated CSS positioning to ensure alerts stay visible on mobile
- Alerts dropdown now properly sized for mobile: `width: 90vw; max-width: 320px`
- Added explicit positioning: `right: 0; left: auto`
- Increased button size to 48px for better mobile touch targets
- Adjusted top position to 70px to avoid header overlap
- Added extra small screen support (< 400px) with full-width dropdown

## Changes Made

### Files Modified:
1. `src/App.jsx`
   - Added AlertsPanel import
   - Placed AlertsPanel in main-content after Header

2. `src/pages/AnalysisDashboard.jsx`
   - Removed AlertsPanel (now global)
   - Removed AlertsPanel import

3. `src/components/InstrumentAnalysis.css`
   - Added `left: auto` to base `.alerts-panel` style
   - Updated mobile styles (768px breakpoint):
     - Width: `90vw` with `max-width: 320px`
     - Height: `max-height: 70vh`
     - Proper right alignment
   - Added extra small screen support (400px breakpoint):
     - Full width dropdown: `calc(100vw - 20px)`
     - Positioned from left edge: `left: 10px`
   - Optimized font sizes and padding for mobile
   - Fixed button size to 48px for touch targets

## Mobile Responsive Behavior

### Standard Mobile (400px - 768px):
- Alert button: 48x48px in top-right corner
- Dropdown: 90vw width, max 320px
- Aligned to right edge with proper spacing

### Extra Small Screens (< 400px):
- Alert button: 48x48px in top-right corner  
- Dropdown: Full width minus 20px padding
- Positioned from left edge for better visibility

## Testing Checklist
- [ ] Alerts visible on Dashboard
- [ ] Alerts visible on Watchlist
- [ ] Alerts visible on Orders page
- [ ] Alerts visible on Holdings page
- [ ] Alerts visible on Market Analysis
- [ ] Mobile (768px): Alert button visible in top-right
- [ ] Mobile (768px): Dropdown opens and is fully visible
- [ ] Mobile (400px): Dropdown takes full width
- [ ] Touch targets are adequate (48px minimum)
