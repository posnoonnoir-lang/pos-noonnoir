/**
 * Simple semaphore for limiting concurrent async operations.
 * Prevents connection pool exhaustion when running many parallel queries.
 */
export class Semaphore {
    private queue: (() => void)[] = []
    private running = 0

    constructor(private maxConcurrent: number) { }

    async acquire(): Promise<void> {
        if (this.running < this.maxConcurrent) {
            this.running++
            return
        }
        return new Promise<void>((resolve) => {
            this.queue.push(() => {
                this.running++
                resolve()
            })
        })
    }

    release(): void {
        this.running--
        const next = this.queue.shift()
        if (next) next()
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        await this.acquire()
        try {
            return await fn()
        } finally {
            this.release()
        }
    }
}

/**
 * Run multiple async functions with limited concurrency.
 * Default: max 3 concurrent operations (safe for pool_size=5).
 */
export async function parallelLimit<T>(
    fns: (() => Promise<T>)[],
    maxConcurrent = 3
): Promise<T[]> {
    const sem = new Semaphore(maxConcurrent)
    return Promise.all(fns.map(fn => sem.run(fn)))
}
