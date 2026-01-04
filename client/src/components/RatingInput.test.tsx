import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import RatingInput from './RatingInput'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('axios')
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}))

describe('RatingInput', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render 5 stars', () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        expect(stars).toHaveLength(5)
    })

    it('should display current rating', () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                rating={3}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const ratingText = screen.getByText('(3.0)')
        expect(ratingText).toBeDefined()
    })

    it('should highlight stars up to current rating', () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                rating={3}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        // First 3 stars should be filled (yellow)
        expect(stars[0].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-yellow-400'
        )
        expect(stars[1].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-yellow-400'
        )
        expect(stars[2].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-yellow-400'
        )
        // Last 2 stars should be unfilled (gray)
        expect(stars[3].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-gray-200'
        )
        expect(stars[4].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-gray-200'
        )
    })

    it('should update rating on star click', async () => {
        const onChange = vi.fn()
        vi.mocked(axios.patch).mockResolvedValue({
            data: { rating: 4 },
        })

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')

        await act(async () => {
            await userEvent.click(stars[3]) // Click 4th star (rating = 4)
        })

        await waitFor(() => {
            expect(axios.patch).toHaveBeenCalledWith(
                expect.stringContaining(
                    `/api/linguists/${encodeURIComponent('test@example.com')}/rating`
                ),
                { rating: 4 }
            )
        })
    })

    it('should call onRatingChange callback after successful update', async () => {
        const onChange = vi.fn()
        vi.mocked(axios.patch).mockResolvedValue({
            data: { rating: 5 },
        })

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        await userEvent.click(stars[4]) // Click 5th star

        await waitFor(() => {
            expect(onChange).toHaveBeenCalledWith(5)
        })
    })

    it('should show success toast on successful update', async () => {
        const onChange = vi.fn()
        vi.mocked(axios.patch).mockResolvedValue({
            data: { rating: 3 },
        })

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        await userEvent.click(stars[2]) // Click 3rd star

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled()
        })
    })

    it('should show error toast on failed update', async () => {
        const onChange = vi.fn()
        vi.mocked(axios.patch).mockRejectedValue({
            response: {
                data: {
                    details: 'Failed to update rating',
                },
            },
        })

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')

        await act(async () => {
            await userEvent.click(stars[2]) // Click 3rd star
        })

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                'Failed to update rating. Please try again.'
            )
        })
    })

    it('should be disabled when disabled prop is true', () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                rating={3}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
                disabled={true}
            />
        )

        const stars = screen.getAllByRole('button')
        stars.forEach((star) => {
            expect(star).toHaveProperty('disabled', true)
        })
    })

    it('should not update rating when disabled', async () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
                disabled={true}
            />
        )

        const stars = screen.getAllByRole('button')
        await userEvent.click(stars[3])

        expect(axios.patch).not.toHaveBeenCalled()
        expect(onChange).not.toHaveBeenCalled()
    })

    it('should show hover state on mouse enter', () => {
        const onChange = vi.fn()

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        fireEvent.mouseEnter(stars[3]) // Hover over 4th star

        // The 4th star should be highlighted (hovered)
        expect(stars[3].querySelector('svg')?.getAttribute('class')).toContain(
            'fill-yellow-400'
        )
    })

    it('should handle different sizes', () => {
        const onChange = vi.fn()

        const { rerender } = render(
            <RatingInput
                rating={3}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
                size="sm"
            />
        )

        let stars = screen.getAllByRole('button')
        expect(stars[0].querySelector('svg')?.getAttribute('class')).toContain(
            'h-4'
        )
        expect(stars[0].querySelector('svg')?.getAttribute('class')).toContain(
            'w-4'
        )

        rerender(
            <RatingInput
                rating={3}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
                size="lg"
            />
        )

        stars = screen.getAllByRole('button')
        expect(stars[0].querySelector('svg')?.getAttribute('class')).toContain(
            'h-6'
        )
        expect(stars[0].querySelector('svg')?.getAttribute('class')).toContain(
            'w-6'
        )
    })

    it('should prevent multiple simultaneous updates', async () => {
        const onChange = vi.fn()
        // Make the request take some time
        vi.mocked(axios.patch).mockImplementation(
            () =>
                new Promise((resolve) => {
                    setTimeout(() => resolve({ data: { rating: 4 } }), 100)
                })
        )

        render(
            <RatingInput
                rating={2}
                linguistEmail="test@example.com"
                onRatingChange={onChange}
            />
        )

        const stars = screen.getAllByRole('button')
        await userEvent.click(stars[3]) // Click 4th star
        await userEvent.click(stars[2]) // Try to click 3rd star immediately

        // Should only make one API call
        await waitFor(() => {
            expect(axios.patch).toHaveBeenCalledTimes(1)
        })
    })
})
