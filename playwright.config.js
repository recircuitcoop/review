import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'node server.js', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
