import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { LanguageContext } from '@/i18n/LanguageProvider'
import i18nInstance from '@/i18n'
import { Navbar } from '@/components/organisms'
import { fetchLinguistList } from '@/auth-users/utils'

vi.mock('@/auth-users/utils', () => ({
    fetchLinguistList: vi.fn(),
    fetchUserList: vi.fn(),
}))

const mockSwitchLanguage = vi.fn()

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <I18nextProvider i18n={i18nInstance}>
                <LanguageContext.Provider
                    value={{ switchLanguage: mockSwitchLanguage }}
                >
                    {component}
                </LanguageContext.Provider>
            </I18nextProvider>
        </BrowserRouter>
    )
}

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(fetchLinguistList).mockResolvedValue([
            {
                id: 'alice@example.com',
                email: 'alice@example.com',
                name: 'Alice Linguist',
                role: 'Linguist',
                googleCalendarId: '',
            },
            {
                id: 'bob@example.com',
                email: 'bob@example.com',
                name: 'Bob Linguist',
                role: 'Linguist',
                googleCalendarId: '',
            },
        ])
    })

    it('renders logo', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        expect(screen.getByText('LINGUISTNOW')).toBeDefined()
    })

    it('renders home link', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        expect(screen.getByRole('link', { name: 'Home' })).toBeDefined()
    })

    it('shows dashboard link for Project Manager', () => {
        renderWithProviders(
            <Navbar userDetails={{ role: 'Project Manager' }} />
        )
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined()
    })

    it('hides dashboard link for Linguist', () => {
        renderWithProviders(<Navbar userDetails={{ role: 'Linguist' }} />)
        expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
    })

    it('shows settings link for non-Project Manager', () => {
        renderWithProviders(<Navbar userDetails={{ role: 'Linguist' }} />)
        const settingsLink = document.querySelector('a[href="/settings"]')
        expect(settingsLink).toBeDefined()
    })

    it('shows logout link when user is logged in', () => {
        renderWithProviders(<Navbar userDetails={{ role: 'Linguist' }} />)
        const logoutLink = document.querySelector('a[href="/logout"]')
        expect(logoutLink).toBeDefined()
    })

    it('hides logout link when user is not logged in', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        const logoutLink = document.querySelector('a[href="/logout"]')
        expect(logoutLink).toBeNull()
    })

    it('toggles language menu', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        const languageToggle = document.querySelector(
            'label[for="language-toggle"]'
        )
        if (languageToggle) {
            fireEvent.click(languageToggle)
        }
        expect(screen.getByText('English')).toBeDefined()
    })

    it('calls switchLanguage when language selected', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        const langToggle = document.querySelector(
            'label[for="language-toggle"]'
        )
        if (langToggle) {
            fireEvent.click(langToggle)
        }
        fireEvent.click(screen.getByText('Français'))
        expect(mockSwitchLanguage).toHaveBeenCalledWith('fr')
    })

    it('toggles mobile menu', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        // Find the hamburger menu button by its SVG title
        const menuButton = screen.getByTitle('menu')?.closest('button')
        if (menuButton) {
            fireEvent.click(menuButton)
        }
        const menu = document.getElementById('menu')
        expect(menu).toBeDefined()
    })

    it('shows impersonate linguist button for Project Manager when onImpersonate is provided', () => {
        const mockOnImpersonate = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Project Manager' }}
                isPM={true}
                onImpersonate={mockOnImpersonate}
            />
        )
        expect(screen.getByTestId('navbar-impersonate-button')).toBeDefined()
    })

    it('hides impersonate linguist button for Linguist', () => {
        const mockOnImpersonate = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Linguist' }}
                isPM={false}
                onImpersonate={mockOnImpersonate}
            />
        )
        expect(screen.queryByTestId('navbar-impersonate-button')).toBeNull()
    })

    it('renders impersonation banner and calls onStopImpersonation when clicked', () => {
        const mockStop = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{
                    role: 'Linguist',
                    name: 'Alice Translator',
                    email: 'alice@example.com',
                }}
                impersonatedUser={{
                    role: 'Linguist',
                    name: 'Alice Translator',
                    email: 'alice@example.com',
                }}
                isPM={true}
                onStopImpersonation={mockStop}
            />
        )
        const banner = screen.getByTestId('impersonation-banner')
        expect(banner).toBeDefined()
        expect(banner.textContent).toContain('Alice Translator')
        expect(banner.textContent).toContain('alice@example.com')

        const stopButton = screen.getByRole('button', {
            name: /Stop Impersonating/i,
        })
        fireEvent.click(stopButton)
        expect(mockStop).toHaveBeenCalledTimes(1)
    })

    it('does not render impersonation banner if user is not a Project Manager', () => {
        renderWithProviders(
            <Navbar
                userDetails={{
                    role: 'Linguist',
                    name: 'Alice Translator',
                    email: 'alice@example.com',
                }}
                impersonatedUser={{
                    role: 'Linguist',
                    name: 'Alice Translator',
                    email: 'alice@example.com',
                }}
                isPM={false}
            />
        )
        expect(screen.queryByTestId('impersonation-banner')).toBeNull()
    })

    it('shows dashboard link for Project Manager even while impersonating a linguist', () => {
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Linguist' }}
                impersonatedUser={{
                    role: 'Linguist',
                    name: 'Alice Translator',
                    email: 'alice@example.com',
                }}
                isPM={true}
            />
        )
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined()
    })

    it('opens linguist switcher popover, fetches linguist list and filters linguists', async () => {
        const mockOnImpersonate = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Project Manager' }}
                isPM={true}
                onImpersonate={mockOnImpersonate}
            />
        )

        const impersonateBtn = screen.getByTestId('navbar-impersonate-button')
        fireEvent.click(impersonateBtn)

        expect(fetchLinguistList).toHaveBeenCalled()
        const aliceOption = await screen.findByText('Alice Linguist')
        expect(aliceOption).toBeDefined()
        expect(screen.getByText('Bob Linguist')).toBeDefined()

        const searchInput = screen.getByPlaceholderText('Search linguists...')
        fireEvent.change(searchInput, { target: { value: 'Alice' } })

        expect(screen.getByText('Alice Linguist')).toBeDefined()
        expect(screen.queryByText('Bob Linguist')).toBeNull()
    })

    it('calls onImpersonate when a linguist is selected from the popover', async () => {
        const mockOnImpersonate = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Project Manager' }}
                isPM={true}
                onImpersonate={mockOnImpersonate}
            />
        )

        const impersonateBtn = screen.getByTestId('navbar-impersonate-button')
        fireEvent.click(impersonateBtn)

        const aliceOption = await screen.findByText('Alice Linguist')
        fireEvent.click(aliceOption)

        expect(mockOnImpersonate).toHaveBeenCalledWith('alice@example.com')
        expect(document.getElementById('impersonate-menu')).toBeNull()
    })

    it('closes impersonation popover when Escape key is pressed', async () => {
        const mockOnImpersonate = vi.fn()
        renderWithProviders(
            <Navbar
                userDetails={{ role: 'Project Manager' }}
                isPM={true}
                onImpersonate={mockOnImpersonate}
            />
        )

        const impersonateBtn = screen.getByTestId('navbar-impersonate-button')
        fireEvent.click(impersonateBtn)

        await screen.findByText('Alice Linguist')
        expect(document.getElementById('impersonate-menu')).not.toBeNull()

        fireEvent.keyDown(window, { key: 'Escape' })
        expect(document.getElementById('impersonate-menu')).toBeNull()
    })
})
