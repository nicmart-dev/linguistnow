module.exports = {
  "*.{ts,tsx}": [
    "oxlint --fix --no-error-on-unmatched-pattern",
    "eslint --fix",
    "prettier --write",
  ],
  "*.{js,mjs,cjs}": [
    "oxlint --fix --no-error-on-unmatched-pattern",
    "eslint --fix",
    "prettier --write",
  ],
  "*.{json,md}": ["prettier --write"],
};
