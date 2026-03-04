# Mobile Testing Guide - Quick Reference

## Quick Test in Browser

### Chrome DevTools (Recommended)
1. Press `F12` to open DevTools
2. Press `Ctrl+Shift+M` (Windows) or `Cmd+Shift+M` (Mac) to toggle device toolbar
3. Select a device from dropdown or enter custom dimensions

### Test These Devices

#### iPhone SE (Small Phone)
- **Size**: 375 x 667
- **What to check**:
  - All text is readable
  - Buttons are easy to tap
  - No horizontal scrolling
  - Charts fit screen

#### iPhone 12 Pro (Modern Phone)
- **Size**: 390 x 844
- **What to check**:
  - Layout looks balanced
  - Good use of screen space
  - Comfortable reading distance

#### iPad (Tablet)
- **Size**: 768 x 1024
- **What to check**:
  - Sidebar appears at top
  - Charts are appropriately sized
  - Not too cramped, not too spacious

#### Samsung Galaxy S20 (Android)
- **Size**: 360 x 800
- **What to check**:
  - Similar to iPhone SE
  - Touch targets are adequate

## What to Look For

### ✅ Good Signs
- No horizontal scrolling
- All buttons are easy to tap (not too small)
- Text is readable without zooming
- Charts resize to fit screen
- Modals don't overflow screen
- Spacing looks balanced

### ❌ Bad Signs
- Horizontal scrollbar appears
- Buttons are too small to tap accurately
- Text is too small to read
- Charts are cut off
- Modals extend beyond screen
- Elements overlap

## Quick Visual Checks

### 1. Analysis Header
**Desktop**: Title on left, controls on right (horizontal)
**Mobile**: Everything stacked vertically

### 2. Days & Timeframe Selectors
**Desktop**: Side by side
**Mobile**: Stacked, full-width dropdowns

### 3. Indicator Manager
**Desktop**: "Add Indicator" button on right
**Mobile**: Button below title, full-width

### 4. Indicator Chips
**Desktop**: Wrap horizontally
**Mobile**: Stack vertically, full-width

### 5. Charts
**Desktop**: 400px height
**Mobile**: 250px height (smaller screens)

### 6. Dashboard Sidebar
**Desktop**: Left side, 300px wide
**Mobile**: Top of page, scrollable

### 7. Modals
**Desktop**: Centered, max-width
**Mobile**: Full-width with small padding

## Test Interactions

### Touch Targets
1. Try tapping all buttons
2. Should be easy to tap without mistakes
3. No accidental taps on nearby elements

### Scrolling
1. Scroll through instrument list
2. Scroll through analysis results
3. Should be smooth, no janky animations

### Modals
1. Open "Add Indicator" modal
2. Should fit screen with padding
3. Close button should be easy to tap

### Forms
1. Try editing indicator parameters
2. Inputs should be full-width on mobile
3. Easy to type in fields

## Landscape Mode Test

1. Rotate device to landscape (or use DevTools rotate button)
2. Check:
   - Charts are shorter (to fit screen)
   - Content is accessible
   - No excessive scrolling needed

## Common Issues & Fixes

### Issue: Horizontal Scrolling
**Cause**: Element wider than viewport
**Check**: Look for fixed widths, large padding, or wide tables

### Issue: Tiny Buttons
**Cause**: Touch targets too small
**Check**: Buttons should be at least 44x44px

### Issue: Text Too Small
**Cause**: Font size not adjusted for mobile
**Check**: Minimum 14px font size on mobile

### Issue: Modal Overflow
**Cause**: Modal height exceeds viewport
**Check**: Modal should have max-height: 95vh

### Issue: Chart Not Resizing
**Cause**: Chart width not responsive
**Check**: Chart should use container width

## Browser-Specific Tests

### iOS Safari
- Test on iPhone (real device if possible)
- Check rubber-band scrolling
- Verify touch interactions
- Test in both portrait and landscape

### Chrome Mobile (Android)
- Test on Android device
- Check address bar behavior (hides on scroll)
- Verify touch feedback
- Test back button behavior

### Samsung Internet
- Similar to Chrome Mobile
- Check any Samsung-specific quirks

## Performance Check

### Smooth Scrolling
1. Scroll through long lists
2. Should be 60fps, no lag
3. No janky animations

### Chart Rendering
1. Add/remove indicators
2. Charts should update smoothly
3. No flickering or delays

### Modal Animations
1. Open/close modals
2. Should animate smoothly
3. No layout shifts

## Accessibility Check

### Zoom Test
1. Zoom to 200% (Ctrl/Cmd + Plus)
2. Content should still be usable
3. No horizontal scrolling

### Keyboard Navigation
1. Tab through interactive elements
2. Focus should be visible
3. Logical tab order

### Screen Reader (Optional)
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through page
3. All elements should be announced

## Quick Pass/Fail Checklist

- [ ] No horizontal scrolling on any screen size
- [ ] All buttons are easy to tap (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] Charts fit within viewport
- [ ] Modals don't overflow screen
- [ ] Sidebar works on mobile (top position)
- [ ] Indicator chips stack vertically on mobile
- [ ] Forms are usable (full-width inputs)
- [ ] Landscape mode works properly
- [ ] Smooth scrolling performance
- [ ] Touch interactions feel responsive
- [ ] No layout shifts or jumps

## Report Issues

If you find issues, note:
1. **Device/Screen Size**: e.g., "iPhone SE, 375x667"
2. **Browser**: e.g., "Chrome Mobile 120"
3. **Issue**: e.g., "Horizontal scrolling on analysis page"
4. **Screenshot**: If possible
5. **Steps to Reproduce**: How to trigger the issue

## Quick Fixes to Try

### If something looks wrong:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check if viewport meta tag exists in index.html
4. Verify CSS file is loaded (check Network tab)
5. Check browser console for errors

## Success Criteria

The mobile view is working correctly if:
- ✅ You can use all features on a 375px wide screen
- ✅ Touch targets are comfortable to tap
- ✅ No need to zoom or scroll horizontally
- ✅ Charts are visible and usable
- ✅ Modals fit the screen
- ✅ Performance is smooth

## Time Estimate

- **Quick Test**: 5 minutes (test 2-3 screen sizes)
- **Thorough Test**: 15 minutes (test all devices, interactions)
- **Full Test**: 30 minutes (include real devices, accessibility)
