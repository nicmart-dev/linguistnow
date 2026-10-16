import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '@/i18n'
import AccountSettings from './AccountSettings'

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@react-oauth/google', () => ({ googleLogout: vi.fn() }))

vi.mock('@/components/organisms/Hero', () => ({
    default: () => <div data-testid="hero" />,
}))

vi.mock('@/components/organisms/AvailabilitySettings', () => ({
    default: () => <div data-testid="availability" />,
}))

vi.mock('@/components/organisms/LinguistProfileSettings', () => ({
    LinguistProfileSettings: () => <div data-testid="profile" />,
}))

// Minimal CalendarSelector: exposes a button that triggers onSave
vi.mock('@/components/organisms/CalendarSelector', () => ({
    default: ({ onSave }: { onSave: (ids: string[]) => void }) => (
        <button onClick={() => onSave(['cal1'])}>save-calendars</button>
    ),
}))

const linguist = { Name: 'Lin', Email: 'lin@example.com', Role: 'Linguist' }
const pm = { Name: 'Pat', Email: 'pat@example.com', Role: 'Project Manager' }

const renderPage = (userDetails: Record<string, string>) =>
    render(
        <MemoryRouter>
            <I18nextProvider i18n={i18nInstance}>
                <AccountSettings
                    userDetails={userDetails}
                    setUserDetails={vi.fn()}
                />
            </I18nextProvider>
        </MemoryRouter>
    )

const mockFetch = (ok: boolean) => {
    global.fetch = vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        statusText: ok ? 'OK' : 'Error',
        json: () => Promise.resolve({}),
    }) as unknown as typeof fetch
}

describe('AccountSettings setup-complete alert', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        global.fetch = originalFetch
        vi.restoreAllMocks()
    })

    it('is hidden initially', () => {
        renderPage(linguist)
        expect(screen.queryByText('Setup complete!')).toBeNull()
    })

    it('shows after a successful save', async () => {
        mockFetch(true)
        renderPage(linguist)
        fireEvent.click(screen.getByText('save-calendars'))
        expect(await screen.findByText('Setup complete!')).toBeDefined()
    })

    it('is hidden after a subsequent failed save', async () => {
        mockFetch(true)
        renderPage(linguist)
        fireEvent.click(screen.getByText('save-calendars'))
        await screen.findByText('Setup complete!')

        mockFetch(false)
        fireEvent.click(screen.getByText('save-calendars'))
        await waitFor(() =>
            expect(screen.queryByText('Setup complete!')).toBeNull()
        )
    })

    it('is not shown for non-Linguists', async () => {
        mockFetch(true)
        renderPage(pm)
        fireEvent.click(screen.getByText('save-calendars'))
        await waitFor(() => expect(global.fetch).toHaveBeenCalled())
        expect(screen.queryByText('Setup complete!')).toBeNull()
    })

    it('Done opens Google Calendar', async () => {
        mockFetch(true)
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
        renderPage(linguist)
        fireEvent.click(screen.getByText('save-calendars'))
        fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
        expect(openSpy).toHaveBeenCalledWith(
            'https://calendar.google.com/',
            '_blank'
        )
    })
})
