import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getLocale } from './utils'

describe('getLocale', () => {
    const originalLanguage = navigator.language
    const storage: Record<string, string> = {}
    const mockLocalStorage = {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            storage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            delete storage[key]
        }),
        clear: vi.fn(() => {
            Object.keys(storage).forEach((key) => delete storage[key])
        }),
    }

    beforeEach(() => {
        Object.keys(storage).forEach((key) => delete storage[key])
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        Object.keys(storage).forEach((key) => delete storage[key])
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: originalLanguage,
        })
    })

    it('should return "en" for English language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'en',
        })
        expect(getLocale()).toBe('en')
    })

    it('should return "en" for English-US language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'en-US',
        })
        expect(getLocale()).toBe('en')
    })

    it('should return "fr" for French language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'fr',
        })
        expect(getLocale()).toBe('fr')
    })

    it('should return "fr" for French-Canada language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'fr-CA',
        })
        expect(getLocale()).toBe('fr')
    })

    it('should return "zh-cn" for Chinese language (zh maps to zh-cn)', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'zh-CN',
        })
        // zh-CN splits to "zh" which maps to "zh-cn"
        expect(getLocale()).toBe('zh-cn')
    })

    it('should return "de" for German language (now supported)', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'de',
        })
        // German is now supported
        expect(getLocale()).toBe('de')
    })

    it('should return "en" for unsupported language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'nl', // Dutch is not supported
        })
        expect(getLocale()).toBe('en')
    })

    it('should handle language with underscore', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'fr_FR',
        })
        expect(getLocale()).toBe('fr')
    })
})
