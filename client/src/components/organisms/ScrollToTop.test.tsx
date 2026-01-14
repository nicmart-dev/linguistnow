import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { ScrollToTop } from '@/components/organisms'

// Helper component to trigger navigation within the same router
const NavigationTrigger = ({
    onNavigate,
}: {
    onNavigate: (navigate: ReturnType<typeof useNavigate>) => void
}) => {
    const navigate = useNavigate()
    // Expose navigate function to parent via callback
    onNavigate(navigate)
    return null
}

describe('ScrollToTop', () => {
    beforeEach(() => {
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    })

    it('scrolls to top on mount', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
            </MemoryRouter>
        )

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('scrolls to top on route change', async () => {
        let navigate: ReturnType<typeof useNavigate>

        render(
            <MemoryRouter initialEntries={['/page1']}>
                <ScrollToTop />
                <NavigationTrigger onNavigate={(nav) => (navigate = nav)} />
            </MemoryRouter>
        )

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
        const initialCallCount = vi.mocked(window.scrollTo).mock.calls.length

        // Navigate to a new route within the same router instance
        await act(async () => {
            await navigate('/page2')
        })

        // scrollTo should be called again after route change
        expect(window.scrollTo).toHaveBeenCalledTimes(initialCallCount + 1)
    })

    it('returns null (renders nothing)', () => {
        const { container } = render(
            <MemoryRouter>
                <ScrollToTop />
            </MemoryRouter>
        )

        expect(container.innerHTML).toBe('')
    })
})
