import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    retries: 1,
    timeout: 30000,
    globalTeardown: './tests/global-teardown-pw.ts',
    use: {
        baseURL: 'http://localhost:3001',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
        },
    ],
})
