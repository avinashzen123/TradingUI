# Floating Instruments Button - Quick Guide

## What Changed?

On mobile devices (≤768px width), instruments are now accessed via a floating button instead of being shown at the top of the screen.

## Visual Overview

### Desktop (>768px) - No Change
```
┌─────────┬────────────────────────────────┐
│ Sidebar │ Analysis View                  │
│         │                                │
│ NIFTY   │ 📈 Charts                     │
│ INFY    │ 📊 Indicators                 │
│ GOLD    │ 📋 Analysis                   │
│         │                                │
└─────────┴────────────────────────────────┘
```

### Mobile (≤768px) - New Behavior
```
Before (Old):
┌─────────────────────────┐
│ Instruments (Top)       │ ← Had to scroll past
│ ┌─────────────────────┐ │
│ │ NIFTY FUT           │ │
│ │ INFY EQ             │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Analysis View           │
│ (Scroll down to see)    │
└─────────────────────────┘

After (New):
┌─────────────────────────┐
│ Analysis View           │ ← Immediate view
│                         │
│ 📈 Charts               │
│ 📊 Indicators           │
│ 📋 Analysis             │
│                         │
│ [📋] ← Floating Button  │
└─────────────────────────┘
```

## How to Use

### 1. View Instruments
**Tap the floating button** in the bottom-left corner

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│                         │
│                         │
│ 📋 ← Tap here          │
└─────────────────────────┘
```

### 2. Drawer Opens
Instruments slide in from the left

```
┌──────────┬──────────────┐
│ Drawer   │ Overlay      │
│          │              │
│ NIFTY ✓  │ (Tap to      │
│ INFY     │  close)      │
│ GOLD     │              │
│ + Add    │              │
└──────────┴──────────────┘
```

### 3. Select Instrument
Tap any instrument to view its analysis

```
┌──────────┬──────────────┐
│ NIFTY ✓  │              │
│ INFY  ←  │ Tap this     │
│ GOLD     │              │
└──────────┴──────────────┘

Drawer closes automatically ↓

┌─────────────────────────┐
│ INFY Analysis           │
│                         │
│ 📈 Charts               │
│ 📊 Indicators           │
└─────────────────────────┘
```

### 4. Close Drawer
Multiple ways to close:
- Tap the dark overlay
- Select an instrument
- Add an instrument

## Floating Button Features

### Badge Shows Count
```
No Instruments:
┌────┐
│ 📋 │  Blue button
└────┘

With Instruments:
┌────┐
│ 📋③│  Green button + count badge
└────┘
```

### Color Coding
- **Blue**: No instruments added yet
- **Green**: Instruments added (ready to use)
- **Red Badge**: Number of instruments

## Quick Actions

### Add New Instrument
1. Tap floating button
2. Tap "+ Add" in drawer
3. Search and select
4. Drawer closes automatically

### Switch Instruments
1. Tap floating button
2. Tap different instrument
3. Drawer closes, analysis updates

### Remove Instrument
1. Tap floating button
2. Tap "×" on instrument card
3. Instrument removed

## Benefits

### ✅ More Screen Space
- Analysis view starts immediately
- No need to scroll past instruments
- Charts are visible right away

### ✅ Less Scrolling
- Instruments hidden by default
- Access only when needed
- Faster navigation

### ✅ Familiar Pattern
- Common mobile UI pattern
- Similar to WhatsApp, Gmail, etc.
- Intuitive for users

### ✅ Smooth Animations
- Drawer slides in/out smoothly
- Overlay fades in/out
- 60fps performance

## Keyboard Shortcuts (Desktop)

While the floating button is for mobile, on desktop you can:
- Click sidebar normally (always visible)
- Use Tab to navigate
- Use Enter to select

## Troubleshooting

### Button Not Visible?
- Check screen width (must be ≤768px)
- Try resizing browser window
- Check if you're on Analysis Dashboard page

### Drawer Won't Open?
- Ensure button is tapped (not held)
- Check browser console for errors
- Try refreshing page

### Drawer Won't Close?
- Tap the dark overlay area
- Select an instrument
- Refresh page if stuck

## Testing

### Quick Test
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Look for floating button in bottom-left
5. Tap to open drawer
6. Tap overlay to close

### Real Device Test
1. Open app on mobile phone
2. Navigate to Analysis Dashboard
3. Look for blue/green button in bottom-left
4. Tap to test drawer

## Comparison Table

| Feature | Old (Top Sidebar) | New (Floating Button) |
|---------|-------------------|----------------------|
| **Position** | Top of screen | Bottom-left corner |
| **Visibility** | Always visible | Hidden by default |
| **Screen Space** | Takes 40vh | Takes 56px button |
| **Scrolling** | Must scroll past | No scrolling needed |
| **Access** | Always there | Tap to open |
| **Close** | N/A | Tap overlay |
| **Animation** | None | Smooth slide |

## Best Practices

### For Users
1. **Quick Access**: Tap button when you need to switch instruments
2. **Close After**: Drawer closes automatically after selection
3. **Badge**: Check badge to see how many instruments you have
4. **Overlay**: Tap dark area to close drawer quickly

### For Developers
1. **Z-Index**: Maintain proper layering (FAB: 998, Overlay: 999, Drawer: 1000)
2. **Animations**: Use CSS transforms for smooth performance
3. **Touch Targets**: Keep FAB at 56x56px minimum
4. **Accessibility**: Ensure keyboard and screen reader support

## Technical Details

### CSS Classes
- `.mobile-instruments-fab` - Floating button
- `.fab-badge` - Count badge
- `.mobile-sidebar-overlay` - Dark backdrop
- `.instruments-sidebar.mobile-open` - Open drawer state

### State Management
- `showMobileSidebar` - Controls drawer visibility
- Closes on: overlay click, instrument selection, instrument addition

### Breakpoint
- **Mobile**: ≤768px (floating button visible)
- **Desktop**: >768px (static sidebar visible)

## Summary

The floating button + drawer pattern provides:
- ✅ More screen space for analysis
- ✅ Less scrolling required
- ✅ Faster access to content
- ✅ Familiar mobile UI pattern
- ✅ Smooth animations
- ✅ Better user experience

Users can now focus on analysis without the instruments list taking up valuable screen space!
