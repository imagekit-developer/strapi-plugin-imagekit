import type { JestConfigWithTsJest } from 'ts-jest';
import { defaults as tsjPreset } from 'ts-jest/presets';

const config: JestConfigWithTsJest = {
  testMatch: ['**/tests/**/?(*.)+(spec|test).(t|j)s'],
  transform: {
    ...tsjPreset.transform,
  },
  preset: 'ts-jest',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  collectCoverageFrom: ['server/src/**/*.{js,jsx,ts,tsx}'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
};

export default config;
