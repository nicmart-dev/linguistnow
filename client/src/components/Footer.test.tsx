import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import Footer from './Footer'

const messages = {
    'footer.aboutTitle': 'About',
    'footer.aboutText': 'About LinguistNow',
    'footer.privacyTitle': 'Privacy Policy',
    'footer.socialTitle': 'Social',
}

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <IntlProvider locale="en" messages={messages}>
                {component}
            </IntlProvider>
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
