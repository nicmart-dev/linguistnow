import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
    it('renders skeleton loader', () => {
        render(<Skeleton />)
        const skeleton = screen.getByRole('status')
        expect(skeleton).toBeDefined()
    })

    it('displays loading text for screen readers', () => {
        render(<Skeleton />)
        const loadingText = screen.getByText('Loading...')
        expect(loadingText).toBeDefined()
        expect(loadingText.className).toContain('sr-only')
    })

    it('has animate-pulse class for animation', () => {
        render(<Skeleton />)
        const skeleton = screen.getByRole('status')
        expect(skeleton.className).toContain('animate-pulse')
    })
})
