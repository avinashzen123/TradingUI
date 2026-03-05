# PWA Setup Guide

Your trading app is now configured as a Progressive Web App (PWA)!

## What's Been Done

1. **Vite PWA Plugin**: Added `vite-plugin-pwa` for automatic PWA generation
2. **Service Worker**: Configured for offline support and background caching
3. **Web Manifest**: App can be installed on iOS and Android devices
4. **Caching Strategy**: 
   - API calls cached with NetworkFirst (24 hours)
   - Assets cached with CacheFirst (30 days)

## Next Steps

### 1. Create App Icons

Replace the placeholder icon files with actual PNG images:
- `public/icon-192x192.png` (192x192 pixels)
- `public/icon-512x512.png` (512x512 pixels)

You can use tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 2. Build and Deploy

```bash
npm run build
```

The build will generate:
- Service worker files
- Web manifest
- Optimized assets

### 3. Installation Instructions

**Android (Chrome/Edge):**
1. Visit your app URL
2. Tap the menu (⋮) → "Install app" or "Add to Home screen"
3. App will work offline and can run in background

**iOS (Safari):**
1. Visit your app URL
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name your app and tap "Add"

## Background Process Limitations

### Important Notes:

**Android**: 
- Background processes work well with service workers
- Can sync data when app is in background
- May be limited by battery optimization settings

**iOS**:
- iOS has strict background limitations for PWAs
- Background sync is limited (max 3 minutes)
- True background processes require a native app

### Workarounds for iOS:

1. **Use Background Sync API** (limited support):
```javascript
// Register background sync
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-data');
});
```

2. **Keep app in foreground**: Use wake lock API
3. **Push notifications**: For critical updates
4. **Consider Capacitor**: For native-like background capabilities

## Testing PWA

1. Run dev server: `npm run dev`
2. Open in browser
3. Check DevTools → Application → Service Workers
4. Test offline mode by toggling network in DevTools

## Deployment Checklist

- [ ] Replace placeholder icons with real images
- [ ] Update app name and description in `vite.config.js`
- [ ] Test installation on Android device
- [ ] Test installation on iOS device
- [ ] Verify offline functionality
- [ ] Test API caching behavior
- [ ] Configure HTTPS (required for PWA)

## Configuration

Edit `vite.config.js` to customize:
- App name and description
- Theme colors
- Caching strategies
- Icon paths
- Service worker behavior

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
