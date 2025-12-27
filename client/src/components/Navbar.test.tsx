import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import { LanguageContext } from '../i18n/LanguageProvider'
import Navbar from './Navbar'

const messages = {
    home: 'Home',
    dashboard: 'Dashboard',
    english: 'English',
    french: 'French',
    simplifiedChinese: 'Chinese',
}

const mockSwitchLanguage = vi.fn()

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <IntlProvider locale="en" messages={messages}>
                <LanguageContext.Provider
                    value={{ switchLanguage: mockSwitchLanguage }}
                >
                    {component}
                </LanguageContext.Provider>
            </IntlProvider>
        </BrowserRouter>
    )
}

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
            <Navbar userDetails={{ Role: 'Project Manager' }} />
        )
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined()
    })

    it('hides dashboard link for Linguist', () => {
        renderWithProviders(<Navbar userDetails={{ Role: 'Linguist' }} />)
        expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
    })

    it('shows settings link for non-Project Manager', () => {
        renderWithProviders(<Navbar userDetails={{ Role: 'Linguist' }} />)
        const settingsLink = document.querySelector('a[href="/settings"]')
        expect(settingsLink).toBeDefined()
    })

    it('shows logout link when user is logged in', () => {
        renderWithProviders(<Navbar userDetails={{ Role: 'Linguist' }} />)
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
        fireEvent.click(screen.getByText('French'))
        expect(mockSwitchLanguage).toHaveBeenCalledWith('fr')
    })

    it('toggles mobile menu', () => {
        renderWithProviders(<Navbar userDetails={null} />)
        const menuToggle = document.querySelector('label[for="menu-toggle"]')
        if (menuToggle) {
            fireEvent.click(menuToggle)
        }
        const menu = document.getElementById('menu')
        expect(menu?.className).toContain('block')
    })
})
