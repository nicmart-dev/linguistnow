# Progressive Web App (PWA) Installation

The application is configured as a Progressive Web App (PWA) using **Vite** and the `vite-plugin-pwa` plugin, allowing users to install it as a responsive app on their devices.

## Table of Contents

- [PWA Configuration](#pwa-configuration)
- [Installing the App](#installing-the-app)
- [Icon Generation](#icon-generation)

## PWA Configuration

The PWA is configured in `client/vite.config.ts` with:

- **Service Worker**: Automatically generated and registered for offline support
- **Manifest**: Configured with LinguistNow branding and app metadata
- **Auto-Update**: Service worker automatically updates when new versions are available
- **Caching Strategy**: Implements smart caching for fonts and static assets

## Installing the App

Users can install LinguistNow as a PWA on their devices:

1. **Desktop (Chrome/Edge)**:
   - Look for the install icon in the address bar
   - Or use the browser menu: "Install LinguistNow..."

2. **Mobile (iOS Safari)**:
   - Tap the Share button
   - Select "Add to Home Screen"

3. **Mobile (Android Chrome)**:
   - Tap the menu (three dots)
   - Select "Install app" or "Add to Home screen"

## Icon Generation

✅ **Icons have been generated!** The LinguistNow-branded icons are now in place.

### Required Icon Sizes

The app requires icons in multiple sizes for PWA installation:

- `favicon.ico` - 64x64, 32x32, 24x24, 16x16
- `logo192.png` - 192x192 (maskable)
- `logo512.png` - 512x512 (maskable)

### Steps to Replace Icons

1. Update the source SVG file `client/public/icon.svg` with your new design
2. Convert the SVG to the required formats using an online tool:
   - **Favicon.io** (https://favicon.io) - Upload the SVG and download all sizes
   - **RealFaviconGenerator** (https://realfavicongenerator.net) - Upload SVG and generate all formats
3. Replace the following files in `client/public/`:
   - `favicon.ico` (replace existing icon)
   - `logo192.png` (replace existing icon)
   - `logo512.png` (replace existing icon)
4. Clear browser cache and rebuild:
   ```bash
   cd client
   pnpm run build
   ```
5. Test PWA installation to verify new icons appear correctly
