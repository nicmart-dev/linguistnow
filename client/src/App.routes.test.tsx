import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App 404 routing', () => {
    it('renders NotFound component when navigating to an unknown route', async () => {
        window.history.pushState({}, 'Test', '/unknown-route')

        render(
            <App
                setUserDetails={vi.fn()}
                userDetails={null}
                isRestoringAuth={false}
                setIsRestoringAuth={vi.fn()}
                googleClientId="test-client-id"
            />
        )

        const heading = await screen.findByRole('heading', { level: 1 })
        expect(heading.textContent).toContain('404 | Not Found')
    })

    it('renders NotFound component when navigating explicitly to /404', async () => {
        window.history.pushState({}, 'Test', '/404')

        render(
            <App
                setUserDetails={vi.fn()}
                userDetails={null}
                isRestoringAuth={false}
                setIsRestoringAuth={vi.fn()}
                googleClientId="test-client-id"
            />
        )

        const heading = await screen.findByRole('heading', { level: 1 })
        expect(heading.textContent).toContain('404 | Not Found')
    })
})
