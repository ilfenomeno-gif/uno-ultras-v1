import { defineConfig } from '@playwright/test';

const isCi = Boolean(process.env['CI']);
const useRealInfra = isCi || process.env['E2E_USE_REAL_INFRA'] === 'true';

const serverEnv: Record<string, string> = useRealInfra
  ? {
      NODE_ENV: 'production',
      WS_PORT: '3001',
      CORS_ORIGIN: 'http://localhost:5174',
      POSTGRES_HOST: process.env['POSTGRES_HOST'] ?? '127.0.0.1',
      POSTGRES_PORT: process.env['POSTGRES_PORT'] ?? '5432',
      POSTGRES_USER: process.env['POSTGRES_USER'] ?? 'uno',
      POSTGRES_PASSWORD: process.env['POSTGRES_PASSWORD'] ?? 'uno_dev_password',
      POSTGRES_DB: process.env['POSTGRES_DB'] ?? 'uno_ultra',
      REDIS_HOST: process.env['REDIS_HOST'] ?? '127.0.0.1',
      REDIS_PORT: process.env['REDIS_PORT'] ?? '6379',
      REDIS_PASSWORD: process.env['REDIS_PASSWORD'] ?? '',
      JWT_SECRET: 'ci_playwright_e2e_jwt_secret_min_32_chars!!',
    }
  : {
      NODE_ENV: 'test',
      WS_PORT: '3001',
      CORS_ORIGIN: 'http://localhost:5174',
      POSTGRES_HOST: '127.0.0.1',
      POSTGRES_PORT: '15432',
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: '16379',
      JWT_SECRET: 'ci_playwright_e2e_jwt_secret_min_32_chars!!',
    };

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  workers: 1,
  retries: isCi ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node server/dist/index.js',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      timeout: 30_000,
      env: serverEnv,
    },
    {
      command: 'npm run dev --workspace=client -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_API_TARGET: 'http://localhost:3001',
        VITE_API_URL: '/api',
        VITE_WS_URL: 'ws://localhost:3001',
      },
    },
  ],
});
