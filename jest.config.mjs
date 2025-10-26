export default {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|@react-navigation|expo|@expo|expo-router|expo-modules-core|react-native-worklets)/)'
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/__tests__/**'],

  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'jest-junit.xml' }]
  ],
  collectCoverage: !!process.env.CI,
  coverageDirectory: 'coverage',
  
};
