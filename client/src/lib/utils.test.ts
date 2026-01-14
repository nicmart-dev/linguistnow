import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
    it('should merge class names correctly', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
        const showBar = true
        const hideBar = false
        expect(cn('foo', showBar && 'bar', 'baz')).toBe('foo bar baz')
        expect(cn('foo', hideBar && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle empty inputs', () => {
        expect(cn()).toBe('')
    })

    it('should handle arrays', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle objects', () => {
        expect(cn({ foo: true, bar: false })).toBe('foo')
    })
})
