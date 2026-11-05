module.exports = {
  env: {
    node: true,
    es2023: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
    'no-underscore-dangle': 'off',
    'no-return-await': 'error',
    'prefer-const': 'warn',
  },
};
