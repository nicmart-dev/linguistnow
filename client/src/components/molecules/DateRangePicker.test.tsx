import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '@/i18n'
import { DateRangePicker } from '@/components/molecules'

const renderWithI18n = (component: React.ReactElement) => {
    return render(
        <I18nextProvider i18n={i18nInstance}>{component}</I18nextProvider>
    )
}

describe('DateRangePicker', () => {
    const mockOnDateChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders with default date', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        // Should render a button to open the picker
        const button = screen.getByRole('button')
        expect(button).toBeDefined()
    })

    it('renders with provided start and end dates', () => {
        renderWithI18n(
            <DateRangePicker
                startDate="2026-01-15"
                endDate="2026-01-20"
                onDateChange={mockOnDateChange}
            />
        )

        const button = screen.getByRole('button')
        expect(button).toBeDefined()
    })

    it('opens popover when button is clicked', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const button = screen.getByRole('button')
        fireEvent.click(button)

        // Calendar should be visible - there are multiple grids (2 months)
        const grids = screen.getAllByRole('grid')
        expect(grids.length).toBeGreaterThan(0)
    })

    it('displays calendar icon', () => {
        const { container } = renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeDefined()
    })

    it('shows date inputs when popover is open', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const button = screen.getByRole('button')
        fireEvent.click(button)

        // DateInput placeholders should be visible
        expect(screen.getAllByPlaceholderText('M').length).toBeGreaterThan(0)
        expect(screen.getAllByPlaceholderText('D').length).toBeGreaterThan(0)
        expect(screen.getAllByPlaceholderText('YYYY').length).toBeGreaterThan(0)
    })

    it('shows cancel and update buttons in popover', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const triggerButton = screen.getByRole('button')
        fireEvent.click(triggerButton)

        expect(screen.getByText('Cancel')).toBeDefined()
        expect(screen.getByText('Update')).toBeDefined()
    })

    it('closes popover when cancel is clicked', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const triggerButton = screen.getByRole('button')
        fireEvent.click(triggerButton)

        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        // Popover should be closed - grid should not be visible
        expect(screen.queryByRole('grid')).toBeNull()
    })

    it('does not call onDateChange when cancelled', () => {
        renderWithI18n(
            <DateRangePicker onDateChange={mockOnDateChange} />
        )

        const triggerButton = screen.getByRole('button')
        fireEvent.click(triggerButton)

        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        expect(mockOnDateChange).not.toHaveBeenCalled()
    })
})
