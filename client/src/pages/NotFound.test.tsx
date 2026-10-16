import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '@/i18n'
import NotFound from './NotFound'

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <I18nextProvider i18n={i18nInstance}>{component}</I18nextProvider>
    )
}

describe('NotFound page', () => {
    it('renders the 404 / Not Found heading', () => {
        renderWithProviders(<NotFound />)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeDefined()
        expect(heading.textContent).toContain('404 | Not Found')
    })

    it('has appropriate styling classes for HyperUI centered simple error page', () => {
        const { container } = renderWithProviders(<NotFound />)
        const outerDiv = container.querySelector('div')
        expect(outerDiv).toBeDefined()
        expect(outerDiv?.className).toContain('grid')
        expect(outerDiv?.className).toContain('h-screen')
        expect(outerDiv?.className).toContain('place-content-center')

        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading.className).toContain('tracking-widest')
        expect(heading.className).toContain('uppercase')
    })
})
