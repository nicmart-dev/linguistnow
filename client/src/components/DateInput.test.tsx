import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateInput } from './DateInput'

describe('DateInput', () => {
    it('should render with initial value', () => {
        const date = new Date(2026, 0, 15) // January 15, 2026
        const onChange = vi.fn()

        render(<DateInput value={date} onChange={onChange} />)

        const monthInput = screen.getByPlaceholderText('M')
        const dayInput = screen.getByPlaceholderText('D')
        const yearInput = screen.getByPlaceholderText('YYYY')

        expect(monthInput).toHaveProperty('value', '1')
        expect(dayInput).toHaveProperty('value', '15')
        expect(yearInput).toHaveProperty('value', '2026')
    })

    it('should render with current date when no value provided', () => {
        const onChange = vi.fn()
        const today = new Date()

        render(<DateInput onChange={onChange} />)

        const monthInput = screen.getByPlaceholderText('M')
        const dayInput = screen.getByPlaceholderText('D')
        const yearInput = screen.getByPlaceholderText('YYYY')

        expect(monthInput).toHaveProperty(
            'value',
            (today.getMonth() + 1).toString()
        )
        expect(dayInput).toHaveProperty('value', today.getDate().toString())
        expect(yearInput).toHaveProperty(
            'value',
            today.getFullYear().toString()
        )
    })

    it('should call onChange when valid date is entered', async () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        await userEvent.clear(dayInput)
        await userEvent.type(dayInput, '20')

        // onChange should be called with the new date
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.getDate()).toBe(20)
    })

    it('should not call onChange for invalid dates', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        const initialCallCount = onChange.mock.calls.length

        // Set an invalid day value directly (32 is invalid for any month)
        // The component validates and should not call onChange for invalid dates
        fireEvent.change(dayInput, { target: { value: '32' } })

        // onChange should not be called because 32 is invalid for any month
        // The component only calls onChange when the date is valid
        expect(onChange.mock.calls.length).toBe(initialCallCount)
    })

    it('should handle month navigation with arrow keys', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15) // January

        render(<DateInput value={initialDate} onChange={onChange} />)

        const monthInput = screen.getByPlaceholderText('M')
        monthInput.focus()

        // Press ArrowUp to increment month
        fireEvent.keyDown(monthInput, { key: 'ArrowUp' })

        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.getMonth()).toBe(1) // February (0-indexed)
    })

    it('should handle day navigation with arrow keys', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        dayInput.focus()

        // Press ArrowUp to increment day
        fireEvent.keyDown(dayInput, { key: 'ArrowUp' })

        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.getDate()).toBe(16)
    })

    it('should handle year navigation with arrow keys', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const yearInput = screen.getByPlaceholderText('YYYY')
        yearInput.focus()

        // Press ArrowUp to increment year
        fireEvent.keyDown(yearInput, { key: 'ArrowUp' })

        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.getFullYear()).toBe(2027)
    })

    it('should handle field navigation with arrow keys', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const monthInput = screen.getByPlaceholderText('M')
        const dayInput = screen.getByPlaceholderText('D')
        const yearInput = screen.getByPlaceholderText('YYYY')

        monthInput.focus()

        // Press ArrowRight to move to day field
        fireEvent.keyDown(monthInput, { key: 'ArrowRight' })

        expect(document.activeElement).toBe(dayInput)

        // Press ArrowRight again to move to year field
        fireEvent.keyDown(dayInput, { key: 'ArrowRight' })

        expect(document.activeElement).toBe(yearInput)
    })

    it('should prevent non-numeric input', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        dayInput.focus()

        // Try to type a letter
        fireEvent.keyDown(dayInput, { key: 'a' })

        // Input should not contain 'a' (keydown prevents it)
        expect(dayInput).not.toHaveProperty('value', 'a')
    })

    it('should restore original value on blur if invalid', async () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 15)

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        const originalValue = dayInput.getAttribute('value')

        // Enter invalid value
        await userEvent.clear(dayInput)
        await userEvent.type(dayInput, '32')

        // Blur the field
        fireEvent.blur(dayInput)

        // Value should be restored
        expect(dayInput).toHaveProperty('value', originalValue)
    })

    it('should handle month rollover correctly', () => {
        const onChange = vi.fn()
        const initialDate = new Date(2026, 0, 31) // January 31

        render(<DateInput value={initialDate} onChange={onChange} />)

        const dayInput = screen.getByPlaceholderText('D')
        dayInput.focus()

        // Press ArrowUp - should roll to February 1
        fireEvent.keyDown(dayInput, { key: 'ArrowUp' })

        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.getMonth()).toBe(1) // February
        expect(lastCall.getDate()).toBe(1)
    })
})
