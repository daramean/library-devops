module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  roots: ['<rootDir>'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  setupFiles: ['<rootDir>/jest.setup.js'],
};
