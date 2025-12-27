import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '../i18n'
import Footer from './Footer'

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <I18nextProvider i18n={i18nInstance}>
                {component}
            </I18nextProvider>
        </BrowserRouter>
    )
}

describe('Footer', () => {
    it('renders footer element', () => {
        renderWithProviders(<Footer />)
        const footer = screen.getByRole('contentinfo')
        expect(footer).toBeDefined()
    })

    it('displays about section', () => {
        renderWithProviders(<Footer />)
        const aboutTitle = screen.getByText('About')
        expect(aboutTitle).toBeDefined()
    })

    it('displays privacy policy link', () => {
        renderWithProviders(<Footer />)
        const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' })
        expect(privacyLink).toBeDefined()
        expect(privacyLink).toHaveAttribute('href', '/privacy')
    })

    it('displays social media links', () => {
        renderWithProviders(<Footer />)
        const socialLinks = screen.getAllByRole('link')
        // Privacy link + 4 social links
        expect(socialLinks.length).toBeGreaterThanOrEqual(5)
    })

    it('has social links with external attributes', () => {
        renderWithProviders(<Footer />)
        const xLink = screen.getByRole('link', { name: /X Icon/i })
        expect(xLink).toHaveAttribute('target', '_blank')
        expect(xLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
})
