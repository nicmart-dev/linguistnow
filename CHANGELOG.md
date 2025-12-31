# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
