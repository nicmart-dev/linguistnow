import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
    it('renders button with text', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeDefined()
    })

    it('applies variant classes', () => {
        const { container } = render(<Button variant="outline">Outline</Button>)
        const button = container.querySelector('button')
        expect(button?.className).toContain('border')
    })
})
