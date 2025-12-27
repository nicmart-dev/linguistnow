import { describe, it, expect, afterEach } from 'vitest'
import { getLocale } from './utils'

describe('getLocale', () => {
    const originalLanguage = navigator.language

    afterEach(() => {
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

    it('should return "en" for Chinese language (zh not in supported list)', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'zh-CN',
        })
        // zh-CN splits to "zh" which is not in supported list, defaults to "en"
        expect(getLocale()).toBe('en')
    })

    it('should return "en" for unsupported language', () => {
        Object.defineProperty(navigator, 'language', {
            writable: true,
            value: 'de',
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
