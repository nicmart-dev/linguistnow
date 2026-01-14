import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ScrollToTop } from '@/components/organisms'

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

    it('scrolls to top on route change', () => {
        const { rerender } = render(
            <MemoryRouter initialEntries={['/page1']}>
                <ScrollToTop />
            </MemoryRouter>
        )

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0)

        // Simulate route change by re-rendering with new route
        rerender(
            <MemoryRouter initialEntries={['/page2']}>
                <ScrollToTop />
            </MemoryRouter>
        )

        // scrollTo should be called again
        expect(window.scrollTo).toHaveBeenCalledTimes(2)
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
