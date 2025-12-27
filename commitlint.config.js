module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
    'scope-enum': [
      2,
      'always', // When scope is present, it must be one of these values
      [
        'client',
        'server',
        'shared',
        'deps',
        'deps-dev',
        'config',
        'types',
        'tests',
        'docs',
        'ci',
        'docker',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'scope-empty': [1, 'never'], // Warn if scope is missing (scopes are optional but recommended)
    'subject-case': [
      2,
      'always',
      ['lower-case', 'sentence-case'], // Allow sentence-case for proper nouns
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'header-max-length': [2, 'always', 72], // Standard Git convention
    'body-leading-blank': [2, 'always'], // Require blank line after header
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'], // Require blank line before footer
    'footer-max-line-length': [2, 'always', 100],
  },
};
