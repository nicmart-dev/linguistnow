import { describe, it, expect } from 'vitest'
import { getCurrencies, getCurrencySymbol, SUPPORTED_CURRENCIES } from '@linguistnow/shared'

const CURRENCIES = getCurrencies()

describe('currency utilities', () => {
    describe('CURRENCIES', () => {
        it('should have 14 currencies (RUB removed)', () => {
            expect(CURRENCIES).toHaveLength(14)
            expect(SUPPORTED_CURRENCIES).toHaveLength(14)
        })

        it('should have required properties for each currency', () => {
            CURRENCIES.forEach((currency) => {
                expect(currency).toHaveProperty('code')
                expect(currency).toHaveProperty('symbol')
                expect(currency).toHaveProperty('name')
                expect(typeof currency.code).toBe('string')
                expect(typeof currency.symbol).toBe('string')
                expect(typeof currency.name).toBe('string')
            })
        })

        it('should have unique currency codes', () => {
            const codes = CURRENCIES.map((c) => c.code)
            const uniqueCodes = new Set(codes)
            expect(uniqueCodes.size).toBe(codes.length)
        })

        it('should include major currencies', () => {
            const codes = CURRENCIES.map((c) => c.code)
            expect(codes).toContain('USD')
            expect(codes).toContain('EUR')
            expect(codes).toContain('GBP')
            expect(codes).toContain('JPY')
        })

        it('should not include RUB (removed)', () => {
            const codes = CURRENCIES.map((c) => c.code)
            expect(codes).not.toContain('RUB')
        })

        it('should have correct USD currency', () => {
            const usd = CURRENCIES.find((c) => c.code === 'USD')
            expect(usd).toBeDefined()
            expect(usd?.symbol).toBe('$')
            expect(usd?.name).toBe('US Dollar')
        })

        it('should have correct EUR currency', () => {
            const eur = CURRENCIES.find((c) => c.code === 'EUR')
            expect(eur).toBeDefined()
            expect(eur?.symbol).toBe('€')
            expect(eur?.name).toBe('Euro')
        })
    })

    describe('getCurrencySymbol', () => {
        it('should return symbol for valid currency code', () => {
            expect(getCurrencySymbol('USD')).toBe('$')
            expect(getCurrencySymbol('EUR')).toBe('€')
            expect(getCurrencySymbol('GBP')).toBe('£')
            expect(getCurrencySymbol('JPY')).toBe('¥')
        })

        it('should be case-insensitive', () => {
            expect(getCurrencySymbol('usd')).toBe('$')
            expect(getCurrencySymbol('UsD')).toBe('$')
            expect(getCurrencySymbol('EUR')).toBe('€')
            expect(getCurrencySymbol('eur')).toBe('€')
        })

        it('should return empty string for undefined', () => {
            expect(getCurrencySymbol(undefined)).toBe('')
        })

        it('should return empty string for empty string', () => {
            expect(getCurrencySymbol('')).toBe('')
        })

        it('should return code itself for unknown currency', () => {
            expect(getCurrencySymbol('XYZ')).toBe('XYZ')
            expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN')
        })

        it('should handle all supported currencies', () => {
            CURRENCIES.forEach((currency) => {
                expect(getCurrencySymbol(currency.code)).toBe(currency.symbol)
            })
        })
    })
})
