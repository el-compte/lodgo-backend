module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed types
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'perf', 'ci', 'build'],
    ],

    // Enforce ticket ID at the END of the subject
    'subject-pattern': [
      2,
      'always',
      '^.+ #[A-Z]+-[0-9]+$',
    ],

    // Custom error message (DX improvement)
    'subject-pattern-error': [
      'Commit message must end with a ticket ID, e.g. "#BOOK-123"',
    ],
  },
};
