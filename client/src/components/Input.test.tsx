import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
    it('renders input element', () => {
        render(<Input placeholder="Enter text" />)
        const input = screen.getByPlaceholderText('Enter text')
        expect(input).toBeDefined()
    })

    it('applies custom className', () => {
        const { container } = render(<Input className="custom-class" />)
        const input = container.querySelector('input')
        expect(input?.className).toContain('custom-class')
    })

    it('handles text input type', () => {
        render(<Input type="text" data-testid="text-input" />)
        const input = screen.getByTestId('text-input')
        expect(input).toHaveAttribute('type', 'text')
    })

    it('handles password input type', () => {
        render(<Input type="password" data-testid="password-input" />)
        const input = screen.getByTestId('password-input')
        expect(input).toHaveAttribute('type', 'password')
    })

    it('handles user input', () => {
        render(<Input data-testid="input" />)
        const input = screen.getByTestId('input')
        fireEvent.change(input, { target: { value: 'Hello' } })
        expect(input.value).toBe('Hello')
    })

    it('forwards ref correctly', () => {
        const ref = { current: null }
        render(<Input ref={ref} />)
        expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('applies disabled state', () => {
        render(<Input disabled data-testid="disabled-input" />)
        const input = screen.getByTestId('disabled-input')
        expect(input).toBeDisabled()
    })
})
