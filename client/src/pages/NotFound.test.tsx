import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '@/i18n'
import NotFound from './NotFound'

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <I18nextProvider i18n={i18nInstance}>{component}</I18nextProvider>
        </BrowserRouter>
    )
}

describe('NotFound page', () => {
    it('renders the 404 / Not Found heading', () => {
        renderWithProviders(<NotFound />)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeDefined()
        expect(heading.textContent).toContain('404 | Not Found')
    })

    it('renders the Go Back Home button linking to root', () => {
        renderWithProviders(<NotFound />)
        const homeLink = screen.getByRole('link', { name: /Go Back Home/i })
        expect(homeLink).toBeDefined()
        expect(homeLink.getAttribute('href')).toBe('/')
    })

    it('has appropriate styling classes for centered layout and typography', () => {
        const { container } = renderWithProviders(<NotFound />)
        const outerDiv = container.querySelector('div')
        expect(outerDiv).toBeDefined()
        expect(outerDiv?.className).toContain('flex')
        expect(outerDiv?.className).toContain('flex-1')
        expect(outerDiv?.className).toContain('items-center')
        expect(outerDiv?.className).toContain('justify-center')

        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading.className).toContain('tracking-widest')
        expect(heading.className).toContain('uppercase')
    })
})
