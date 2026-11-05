module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.js', '**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['src/index.js'],
};
