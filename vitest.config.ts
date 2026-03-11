import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

// Load env before anything else
config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        globalSetup: ['./tests/global-setup.ts'],
        include: ['tests/**/*.test.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        // Vitest 4: run sequentially to avoid exhausting DB connections
        fileParallelism: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/actions/**', 'src/lib/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
