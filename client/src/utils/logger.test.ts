import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock import.meta.env
vi.stubGlobal('import.meta', {
    env: {
        DEV: true,
        MODE: 'development',
    },
})

describe('logger', () => {
    let consoleSpy: {
        log: ReturnType<typeof vi.spyOn>
        warn: ReturnType<typeof vi.spyOn>
        error: ReturnType<typeof vi.spyOn>
        info: ReturnType<typeof vi.spyOn>
        debug: ReturnType<typeof vi.spyOn>
    }

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
            info: vi.spyOn(console, 'info').mockImplementation(() => {}),
            debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        }
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should export a logger object with all methods', async () => {
        const { logger } = await import('./logger')
        expect(logger).toBeDefined()
        expect(typeof logger.log).toBe('function')
        expect(typeof logger.warn).toBe('function')
        expect(typeof logger.error).toBe('function')
        expect(typeof logger.info).toBe('function')
        expect(typeof logger.debug).toBe('function')
    })

    it('should call console.error for error method (always logs)', async () => {
        const { logger } = await import('./logger')
        logger.error('test error')
        expect(consoleSpy.error).toHaveBeenCalledWith('test error')
    })

    it('should call console methods in development mode', async () => {
        const { logger } = await import('./logger')
        logger.log('test log')
        logger.warn('test warn')
        logger.info('test info')
        logger.debug('test debug')

        // In dev mode, all should be called
        expect(consoleSpy.log).toHaveBeenCalledWith('test log')
        expect(consoleSpy.warn).toHaveBeenCalledWith('test warn')
        expect(consoleSpy.info).toHaveBeenCalledWith('test info')
        expect(consoleSpy.debug).toHaveBeenCalledWith('test debug')
    })
})

