# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2025-12-31)

### ⚠ BREAKING CHANGES

- **server:** /api/calendars/free endpoint deprecated, use /api/calendars/availability
- **security:** Tokens are now stored in HashiCorp Vault instead of Airtable.
  Users must deploy Vault and configure VAULT_TOKEN before the app will function.

## Backend Changes

- Add vaultClient utility for Express to read/write tokens to Vault
- Update authController to store tokens in Vault on OAuth exchange/refresh
- Update calendarController to pass userEmail instead of accessToken to n8n
- Add new GET /api/calendars/list/{userEmail} endpoint for calendar fetching
- Add tokenRefreshController with /api/tokens/refresh-all endpoint
- Add tokenRoutes to expose refresh endpoint
- Update env.ts with VAULT_ADDR, VAULT_TOKEN, VAULT_SECRET_PATH variables
- Handle missing .env file gracefully in Docker environments

## Frontend Changes

- Remove client-side token handling from Login.tsx and Dashboard.tsx
- Remove token validation/refresh logic (now handled server-side)
- Update CalendarSelector to fetch calendars via backend API
- Pass userEmail to backend instead of accessToken
- Remove deprecated isAccessTokenValid/refreshAccessToken utilities

## n8n Workflow Changes

- Update workflow to use n8n-nodes-hashi-vault community node
- Add Fetch Token from Vault node using dynamic path per user
- Update Check when busy node to use token from Vault node output
- Add Token_Refresh_Schedule.json for monthly proactive token refresh

## Docker & Deployment

- Add Vault service to docker-compose.yml (local dev, all-in-one)
- Create docker-compose.vault.yml for standalone Vault deployment
- Rename docker-compose.portainer.yml to docker-compose.prod.yml
- Update docker-compose.prod.yml to connect to external shared Vault
- Add vault/config/vault.hcl and vault/init.sh for Vault initialization

## Documentation

- Add docs/n8n-vault-integration-guide.md for Vault setup and n8n configuration
- Simplify n8n workflow setup (just install node, create credential, import)
- Add docs/deploy-local-docker.md for local Docker development
- Update docs/deploy-app-to-production.md with Vault/n8n as prerequisites
- Update docs/install-instructions.md (reorder Vault before n8n)
- Update docs/google-authentication.md with Vault token flow
- Update docs/integration-of-google-calendar-api.md with Vault sequence
- Update docs/n8n-workflow-integration.md to reference community node
- Clarify dev vs production Vault setup in documentation
- Add VAULT_ADDR to all CLI commands for Synology/Docker compatibility

## Tests

- Add vaultClient.test.ts with mocked node-vault
- Add tokenRefreshController.test.ts for refresh-all endpoint
- Update authController.test.ts for Vault integration
- Update calendarController.test.ts for userEmail handling

## Localization

- Update missingCredentials messages in all 11 locale files
- Add calendarSelector error messages for tokenNotFound/tokenExpired

### ✨ Features

- Add OpenAPI/Swagger documentation for API endpoints ([c1a7d23](https://github.com/nicmart-dev/linguistnow/commit/c1a7d232b37180bf1cc264c0cf4dc95434f1c5c0))
- **ci:** implement semantic-release for automatic versioning ([ebcdf0f](https://github.com/nicmart-dev/linguistnow/commit/ebcdf0f0037fc60799d2c28b256d73e93be1017b))
- **client:** add 8 new supported languages ([8e3c1c4](https://github.com/nicmart-dev/linguistnow/commit/8e3c1c42c724f715e807235a11db21f956bdd47f))
- **client:** add PWA support with updated app icons ([309eb21](https://github.com/nicmart-dev/linguistnow/commit/309eb2185ba7f6f0562f0ab578081e43e5fcc68b))
- **client:** consolidate error messages and add conditional logging ([e5a2cb7](https://github.com/nicmart-dev/linguistnow/commit/e5a2cb7ed16af51ee73ce01c37b84e649511104c))
- **security:** migrate token storage to HashiCorp Vault ([89eb478](https://github.com/nicmart-dev/linguistnow/commit/89eb478d92850e865f978f679a0681898269543c))

### 🐛 Bug Fixes

- address terminal warnings and update dependencies ([2be0dcc](https://github.com/nicmart-dev/linguistnow/commit/2be0dccf45e27bd4b6b7c4c6a56e7d1163342aa8))
- **ci:** update Node.js to v22 for semantic-release v25 ([a2c8981](https://github.com/nicmart-dev/linguistnow/commit/a2c898133abf4b9ac380876089f25c85e5019c8a))
- **client:** fix CSS [@apply](https://github.com/apply) and convert utils to ES modules for Vite ([320139f](https://github.com/nicmart-dev/linguistnow/commit/320139f88d6d26e075599120c03fe8978efd2279))
- **client:** improve navbar layout and mobile experience ([994a8eb](https://github.com/nicmart-dev/linguistnow/commit/994a8eb6e4fff3abcc3608597ec9d565b8f982b6))
- **client:** persist authentication across page refreshes ([ad7c069](https://github.com/nicmart-dev/linguistnow/commit/ad7c0694be5729641334619d091baaa9a4b3b366))
- **client:** remove unused TypeScript type imports from DataTable ([1ef00b8](https://github.com/nicmart-dev/linguistnow/commit/1ef00b869180931c183db79d285035e9fe4c37b3))
- **client:** resolve linting errors and update tests for i18next ([8515df9](https://github.com/nicmart-dev/linguistnow/commit/8515df914065cf39769b556dcb9ad53a12fc3d8e))
- **client:** scroll to top on route navigation ([e828ff2](https://github.com/nicmart-dev/linguistnow/commit/e828ff2e49b53ea2e2377ea3c64870031d5f30c6))
- resolve Google OAuth redirect_uri_mismatch error ([b6dee97](https://github.com/nicmart-dev/linguistnow/commit/b6dee97847d3b1d6ef492d15496551f57853f162))
- restore Hero background image display after Tailwind 4.x upgrade ([7b912fa](https://github.com/nicmart-dev/linguistnow/commit/7b912fa053c9b4dbf5b99ecfd0cd29a5647a8f48))
- **security:** move token refresh to server, remove client secret from frontend ([e5ba839](https://github.com/nicmart-dev/linguistnow/commit/e5ba839d4b1d09636f71d880e8aca98d010f4dcf))
- **security:** prevent Airtable formula injection and fix CodeQL alerts ([ad1334e](https://github.com/nicmart-dev/linguistnow/commit/ad1334ea0574d1f31f30f829c9f054e5ab9f67fe))
- **security:** prevent reflected XSS in user deletion endpoint ([783947d](https://github.com/nicmart-dev/linguistnow/commit/783947d60440fc8759f96f66fef3005de85ddf8c)), closes [#1](https://github.com/nicmart-dev/linguistnow/issues/1)
- **security:** restrict CORS to whitelist of allowed origins ([3d81755](https://github.com/nicmart-dev/linguistnow/commit/3d81755972e503c97dbd0b81d6b058df4e145865)), closes [#2](https://github.com/nicmart-dev/linguistnow/issues/2)
- **server:** implement lazy env initialization to prevent startup errors ([1fb6d97](https://github.com/nicmart-dev/linguistnow/commit/1fb6d9764d5c6cfc32c1709f4d9c6b5dbfa7381c))
- **server:** use env vars for Google OAuth ([0527bf4](https://github.com/nicmart-dev/linguistnow/commit/0527bf4d01891f9fa53531692bc50df7f3b626fa))
- update Tailwind CSS to v4 syntax and add missing client start script ([636bd7f](https://github.com/nicmart-dev/linguistnow/commit/636bd7ff3dbd16ada39234cc4fd5403ab4a9d647))

### ⚡ Performance Improvements

- reduce Dashboard re-renders with batched state updates ([8b1597e](https://github.com/nicmart-dev/linguistnow/commit/8b1597edf3691da3562b7e0585facd7304820866))

### ♻️ Code Refactoring

- **server:** move availability calculation from n8n to Express ([7740238](https://github.com/nicmart-dev/linguistnow/commit/7740238db3becb687835f45b0883443709ca3b26))
