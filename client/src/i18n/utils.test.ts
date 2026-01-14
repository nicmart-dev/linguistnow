import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getLocale, isRTL, getDirection, saveLocale } from './utils'

describe('getLocale', () => {
    const originalLanguage = navigator.language
    let storage: Record<string, string> = {}

    const createMockLocalStorage = () => ({
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            storage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            const { [key]: _removed, ...rest } = storage
            void _removed // Mark as intentionally unused
            storage = rest
        }),
        clear: vi.fn(() => {
            storage = {}
        }),
    })

    beforeEach(() => {
        storage = {}
        Object.defineProperty(window, 'localStorage', {
            value: createMockLocalStorage(),
            writable: true,
            configurable: true,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        storage = {}
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

    it('should return saved locale from localStorage', () => {
        storage['linguistnow-language'] = 'de'
        expect(getLocale()).toBe('de')
    })

    it('should ignore invalid saved locale', () => {
        storage['linguistnow-language'] = 'invalid-locale'
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'fr',
        })
        expect(getLocale()).toBe('fr')
    })
})

describe('isRTL', () => {
    it('should return true for Arabic', () => {
        expect(isRTL('ar')).toBe(true)
    })

    it('should return false for English', () => {
        expect(isRTL('en')).toBe(false)
    })

    it('should return false for French', () => {
        expect(isRTL('fr')).toBe(false)
    })

    it('should return false for Chinese', () => {
        expect(isRTL('zh-cn')).toBe(false)
    })
})

describe('getDirection', () => {
    it('should return rtl for Arabic', () => {
        expect(getDirection('ar')).toBe('rtl')
    })

    it('should return ltr for English', () => {
        expect(getDirection('en')).toBe('ltr')
    })

    it('should return ltr for French', () => {
        expect(getDirection('fr')).toBe('ltr')
    })
})

describe('saveLocale', () => {
    let storage: Record<string, string> = {}

    beforeEach(() => {
        storage = {}
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => storage[key] ?? null),
                setItem: vi.fn((key: string, value: string) => {
                    storage[key] = value
                }),
                removeItem: vi.fn((key: string) => {
                    const { [key]: _, ...rest } = storage
                    void _
                    storage = rest
                }),
                clear: vi.fn(() => {
                    storage = {}
                }),
            },
            writable: true,
            configurable: true,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        storage = {}
    })

    it('should save locale to localStorage', () => {
        saveLocale('fr')
        expect(storage['linguistnow-language']).toBe('fr')
    })

    it('should overwrite existing locale', () => {
        storage['linguistnow-language'] = 'en'
        saveLocale('de')
        expect(storage['linguistnow-language']).toBe('de')
    })
})
