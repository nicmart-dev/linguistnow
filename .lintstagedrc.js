module.exports = {
  "*.{ts,tsx}": [
    "oxlint --fix --no-error-on-unmatched-pattern",
    "eslint --fix --no-warn-ignored",
    "prettier --write",
  ],
  "*.{js,mjs,cjs}": [
    "oxlint --fix --no-error-on-unmatched-pattern",
    "eslint --fix --no-warn-ignored",
    "prettier --write",
  ],
  "*.{json,md}": ["prettier --write"],
  "*.{yml,yaml}": ["node scripts/validate-yaml.mjs"],
};
