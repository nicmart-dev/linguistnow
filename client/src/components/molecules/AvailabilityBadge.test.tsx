import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'dashboard.availabilityBadge.available': 'Available',
                'dashboard.availabilityBadge.unavailable': 'Unavailable',
                'dashboard.availabilityBadge.limited': 'Limited',
                'dashboard.availabilityBadge.setupIncomplete': 'Setup Incomplete',
            }
            return translations[key] || key
        },
    }),
}))

import { AvailabilityBadge } from '@/components/molecules'

describe('AvailabilityBadge', () => {
    it('renders available status', () => {
        render(<AvailabilityBadge status="available" />)
        expect(screen.getByText('Available')).toBeDefined()
    })

    it('renders available status with free hours', () => {
        render(<AvailabilityBadge status="available" freeHours={8} />)
        expect(screen.getByText('Available')).toBeDefined()
        expect(screen.getByText('(8h)')).toBeDefined()
    })

    it('renders unavailable status', () => {
        render(<AvailabilityBadge status="unavailable" />)
        expect(screen.getByText('Unavailable')).toBeDefined()
    })

    it('renders limited status', () => {
        render(<AvailabilityBadge status="limited" />)
        expect(screen.getByText('Limited')).toBeDefined()
    })

    it('renders limited status with free hours', () => {
        render(<AvailabilityBadge status="limited" freeHours={4} />)
        expect(screen.getByText('Limited')).toBeDefined()
        expect(screen.getByText('(4h)')).toBeDefined()
    })

    it('renders setup-incomplete status', () => {
        render(<AvailabilityBadge status="setup-incomplete" />)
        expect(screen.getByText('Setup Incomplete')).toBeDefined()
    })

    it('renders setup-incomplete status with setup message as title', () => {
        const { container } = render(
            <AvailabilityBadge
                status="setup-incomplete"
                setupMessage="Please connect your calendar"
            />
        )
        const badge = container.querySelector('span[title]')
        expect(badge?.getAttribute('title')).toBe(
            'Please connect your calendar'
        )
    })

    it('applies correct styling for available status', () => {
        const { container } = render(<AvailabilityBadge status="available" />)
        const badge = container.querySelector('span')
        expect(badge?.className).toContain('bg-emerald-50')
        expect(badge?.className).toContain('text-emerald-600')
    })

    it('applies correct styling for unavailable status', () => {
        const { container } = render(<AvailabilityBadge status="unavailable" />)
        const badge = container.querySelector('span')
        expect(badge?.className).toContain('bg-red-50')
        expect(badge?.className).toContain('text-red-600')
    })

    it('applies correct styling for limited status', () => {
        const { container } = render(<AvailabilityBadge status="limited" />)
        const badge = container.querySelector('span')
        expect(badge?.className).toContain('bg-amber-50')
        expect(badge?.className).toContain('text-amber-600')
    })

    it('applies correct styling for setup-incomplete status', () => {
        const { container } = render(
            <AvailabilityBadge status="setup-incomplete" />
        )
        const badge = container.querySelector('span')
        expect(badge?.className).toContain('bg-gray-100')
        expect(badge?.className).toContain('text-gray-600')
    })

    it('renders SVG icon for each status', () => {
        const { container, rerender } = render(
            <AvailabilityBadge status="available" />
        )
        expect(container.querySelector('svg')).toBeDefined()

        rerender(<AvailabilityBadge status="unavailable" />)
        expect(container.querySelector('svg')).toBeDefined()

        rerender(<AvailabilityBadge status="limited" />)
        expect(container.querySelector('svg')).toBeDefined()

        rerender(<AvailabilityBadge status="setup-incomplete" />)
        expect(container.querySelector('svg')).toBeDefined()
    })
})
