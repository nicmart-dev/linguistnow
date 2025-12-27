const { execSync } = require('child_process');

/**
 * Filter out files that only have whitespace changes
 * This prevents lint-staged from processing files with only line ending or whitespace differences
 */
function filterWhitespaceOnly(files) {
  return files.filter((file) => {
    try {
      // Check if file has non-whitespace changes
      // Using --ignore-all-space and --ignore-blank-lines to detect real changes
      execSync(
        `git diff --ignore-all-space --ignore-blank-lines --exit-code -- "${file}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      // Exit code 0 means no real changes (only whitespace) - filter it out
      return false;
    } catch (error) {
      // Exit code 1 means there are real changes (non-whitespace) - keep it
      if (error.status === 1) {
        return true;
      }
      // For staged files, check against HEAD
      try {
        execSync(
          `git diff --cached --ignore-all-space --ignore-blank-lines --exit-code -- "${file}"`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        // Only whitespace in staged changes - filter it out
        return false;
      } catch (stagedError) {
        if (stagedError.status === 1) {
          // Has real staged changes - keep it
          return true;
        }
        // If file is new or can't determine, include it to be safe
        return true;
      }
    }
  });
}

module.exports = {
  '*.{ts,tsx}': (files) => {
    const filtered = filterWhitespaceOnly(files);
    if (filtered.length === 0) return [];
    // Return command strings - lint-staged will append the filtered files
    return [
      `eslint --fix ${filtered.map((f) => `"${f}"`).join(' ')}`,
      `prettier --write ${filtered.map((f) => `"${f}"`).join(' ')}`,
    ];
  },
  '*.{json,md,js}': (files) => {
    const filtered = filterWhitespaceOnly(files);
    if (filtered.length === 0) return [];
    return [`prettier --write ${filtered.map((f) => `"${f}"`).join(' ')}`];
  },
};

