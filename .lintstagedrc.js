module.exports = {
  "*.{ts,tsx}": ["oxlint --fix", "eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs}": ["oxlint --fix", "eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"],
};
