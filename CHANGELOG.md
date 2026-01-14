# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2](https://github.com/nicmart-dev/linguistnow/compare/v1.3.1...v1.3.2) (2026-01-14)

### 🐛 Bug Fixes

- **client:** resolve TypeScript errors in Dashboard component ([80ada81](https://github.com/nicmart-dev/linguistnow/commit/80ada813ecd3c8ff11aec11b9967760e227129c8))

## [1.3.1](https://github.com/nicmart-dev/linguistnow/compare/v1.3.0...v1.3.1) (2026-01-04)

### 🐛 Bug Fixes

- **server:** quote YAML descriptions in Swagger docs to prevent parsing errors ([4421813](https://github.com/nicmart-dev/linguistnow/commit/4421813410baf6cbf087c3df3989145e7076007e))

## [1.3.0](https://github.com/nicmart-dev/linguistnow/compare/v1.2.0...v1.3.0) (2026-01-04)

### ✨ Features

- **client,server:** overhaul PM dashboard with advanced filtering and booking ([70e1d46](https://github.com/nicmart-dev/linguistnow/commit/70e1d461f087ca583db349c960ef0574c2eed567))
- **client:** add currency support with multi-currency display ([d1e4853](https://github.com/nicmart-dev/linguistnow/commit/d1e4853634124511ab1a4fea296b81cb3d5816c4))
- **client:** add date preset utilities for quick date range selection ([9777cee](https://github.com/nicmart-dev/linguistnow/commit/9777cee0af57baa985933b249701938ee202d228))
- **client:** add linguist settings components for profile management ([b39655e](https://github.com/nicmart-dev/linguistnow/commit/b39655ec50e1e5f6411055ca1483bccb61c82b2f))
- **server:** add automatic token refresh for Google Calendar API ([c3ccd3c](https://github.com/nicmart-dev/linguistnow/commit/c3ccd3c5b5d7096d87473e1af752bd2da0f56646))
- **server:** add linguists API with profile management ([b1581d7](https://github.com/nicmart-dev/linguistnow/commit/b1581d7ec5e1c35e1bdc681e83e7f6db7c11df76))
- **shared:** enhance API types and add date locale utilities ([a3fe9c6](https://github.com/nicmart-dev/linguistnow/commit/a3fe9c650e8db2956e2988bea8679f284e5e01bb))

## [1.2.0](https://github.com/nicmart-dev/linguistnow/compare/v1.1.0...v1.2.0) (2026-01-03)

### ✨ Features

- **client:** add availability preferences settings component ([5caf677](https://github.com/nicmart-dev/linguistnow/commit/5caf677307fbfee1145bc2829c87ebce09506293))
- **client:** add toast notifications for calendar selection changes ([bc451a7](https://github.com/nicmart-dev/linguistnow/commit/bc451a77d9f3ca0d1b599851b499bc7e8589a1b3))
- **client:** improve calendar selector UX and session management ([42c721e](https://github.com/nicmart-dev/linguistnow/commit/42c721e3a70c7b89159fa120a413b091243b1ef5))
- **client:** integrate availability settings into account settings ([31a5c4c](https://github.com/nicmart-dev/linguistnow/commit/31a5c4c6ffd27c9ace9af24aff0f1b1f55f74f25))
- **client:** reorder days of week based on locale first day ([6137715](https://github.com/nicmart-dev/linguistnow/commit/613771511b77c1aa063ad69281dc5a3608c8d6eb))
- **i18n:** add RTL support for Arabic language ([5abb17f](https://github.com/nicmart-dev/linguistnow/commit/5abb17f9873afeefa97ba52fec69e46d5d890be9))
- **i18n:** add translations for availability settings ([88cbe22](https://github.com/nicmart-dev/linguistnow/commit/88cbe2237b77425c30bdd5ff4e3c39c3f24ff9a1))
- **server:** implement availability preferences and token validation ([1f5a758](https://github.com/nicmart-dev/linguistnow/commit/1f5a7583bb3b8c77d551568bb77d453b4800ea97))
- **shared:** add availability preferences types ([cd24e5d](https://github.com/nicmart-dev/linguistnow/commit/cd24e5db7096f961467bb8c0df0f4bdafee29ee2))

## [1.1.0](https://github.com/nicmart-dev/linguistnow/compare/v1.0.5...v1.1.0) (2026-01-03)

### ⚠ BREAKING CHANGES

- DELETE /api/users/:id now uses email address instead of Airtable record ID

### ✨ Features

- user cleanup and self-deletion ([eaa8505](https://github.com/nicmart-dev/linguistnow/commit/eaa8505d33998d36545677563c51ca64d2ab18f1))

## [1.0.5](https://github.com/nicmart-dev/linguistnow/compare/v1.0.4...v1.0.5) (2026-01-03)

### 🐛 Bug Fixes

- **security:** resolve CVE-2025-15284 in qs package ([23986f6](https://github.com/nicmart-dev/linguistnow/commit/23986f67549c5d049357b69781007cecf015aeb4)), closes [#55](https://github.com/nicmart-dev/linguistnow/issues/55)

## [1.0.4](https://github.com/nicmart-dev/linguistnow/compare/v1.0.3...v1.0.4) (2025-12-31)

### 🐛 Bug Fixes

- **server:** use correct swaggerOptions.url for dynamic spec loading ([868aab1](https://github.com/nicmart-dev/linguistnow/commit/868aab18d6b268299511c7b3e6e67cd84a3a2eda))

## [1.0.3](https://github.com/nicmart-dev/linguistnow/compare/v1.0.2...v1.0.3) (2025-12-31)

### 🐛 Bug Fixes

- **server:** fetch swagger spec dynamically to ensure correct version ([898f359](https://github.com/nicmart-dev/linguistnow/commit/898f35901c64ea5f9da14043c329d5d722d07d14))

## [1.0.2](https://github.com/nicmart-dev/linguistnow/compare/v1.0.1...v1.0.2) (2025-12-31)

### 🐛 Bug Fixes

- **server:** use semantic version in health endpoint instead of build ref ([841a0cc](https://github.com/nicmart-dev/linguistnow/commit/841a0ccdc07a6585783d38f54061e59c582a4a2f))

## [1.0.1](https://github.com/nicmart-dev/linguistnow/compare/v1.0.0...v1.0.1) (2025-12-31)

### 🐛 Bug Fixes

- **ci:** remove path filters from docker-publish workflow ([3ef8488](https://github.com/nicmart-dev/linguistnow/commit/3ef8488f717f48e1263cc6e3dbf0b6f5081f8dbe))

## [1.0.0](https://github.com/nicmart-dev/linguistnow/releases/tag/v1.0.0) (2025-12-31)

### ⚠ BREAKING CHANGES

- **server:** `/api/calendars/free` endpoint deprecated, use `/api/calendars/availability`
- **security:** Tokens are now stored in HashiCorp Vault instead of Airtable. Users must deploy Vault and configure `VAULT_TOKEN` before the app will function.

### ✨ Features

- **ci:** implement semantic-release for automatic versioning ([ebcdf0f](https://github.com/nicmart-dev/linguistnow/commit/ebcdf0f0037fc60799d2c28b256d73e93be1017b))
- **security:** migrate token storage to HashiCorp Vault ([89eb478](https://github.com/nicmart-dev/linguistnow/commit/89eb478d92850e865f978f679a0681898269543c))
- **client:** add PWA support with updated app icons ([309eb21](https://github.com/nicmart-dev/linguistnow/commit/309eb2185ba7f6f0562f0ab578081e43e5fcc68b))
- **client:** add 8 new supported languages ([8e3c1c4](https://github.com/nicmart-dev/linguistnow/commit/8e3c1c42c724f715e807235a11db21f956bdd47f))
- Add OpenAPI/Swagger documentation for API endpoints ([c1a7d23](https://github.com/nicmart-dev/linguistnow/commit/c1a7d232b37180bf1cc264c0cf4dc95434f1c5c0))

### 🐛 Bug Fixes

- **client:** persist authentication across page refreshes ([ad7c069](https://github.com/nicmart-dev/linguistnow/commit/ad7c0694be5729641334619d091baaa9a4b3b366))
- **client:** scroll to top on route navigation ([e828ff2](https://github.com/nicmart-dev/linguistnow/commit/e828ff2e49b53ea2e2377ea3c64870031d5f30c6))
- **client:** improve navbar layout and mobile experience ([994a8eb](https://github.com/nicmart-dev/linguistnow/commit/994a8eb6e4fff3abcc3608597ec9d565b8f982b6))
- **security:** prevent reflected XSS in user deletion endpoint ([783947d](https://github.com/nicmart-dev/linguistnow/commit/783947d60440fc8759f96f66fef3005de85ddf8c))
- **security:** restrict CORS to whitelist of allowed origins ([3d81755](https://github.com/nicmart-dev/linguistnow/commit/3d81755972e503c97dbd0b81d6b058df4e145865))
- **security:** prevent Airtable formula injection and fix CodeQL alerts ([ad1334e](https://github.com/nicmart-dev/linguistnow/commit/ad1334ea0574d1f31f30f829c9f054e5ab9f67fe))
- resolve Google OAuth redirect_uri_mismatch error ([b6dee97](https://github.com/nicmart-dev/linguistnow/commit/b6dee97847d3b1d6ef492d15496551f57853f162))

### ⚡ Performance Improvements

- reduce Dashboard re-renders with batched state updates ([8b1597e](https://github.com/nicmart-dev/linguistnow/commit/8b1597edf3691da3562b7e0585facd7304820866))
