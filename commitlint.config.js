module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed types
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'perf', 'ci', 'build'],
    ],

    // Custom subject pattern is not supported by commitlint core rules. Use only supported rules.

    // Custom error messages are not supported directly in commitlint rules.
  },
};
