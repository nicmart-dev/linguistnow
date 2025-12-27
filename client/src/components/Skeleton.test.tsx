import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from '../i18n'
import Skeleton from './Skeleton'

const renderWithI18n = (component: React.ReactElement) => {
    return render(
        <I18nextProvider i18n={i18nInstance}>
            {component}
        </I18nextProvider>
    )
}

describe('Skeleton', () => {
    it('renders skeleton loader', () => {
        renderWithI18n(<Skeleton />)
        const skeleton = screen.getByRole('status')
        expect(skeleton).toBeDefined()
    })

    it('displays loading text for screen readers', () => {
        renderWithI18n(<Skeleton />)
        const loadingText = screen.getByText('Loading...')
        expect(loadingText).toBeDefined()
        expect(loadingText.className).toContain('sr-only')
    })

    it('has animate-pulse class for animation', () => {
        renderWithI18n(<Skeleton />)
        const skeleton = screen.getByRole('status')
        expect(skeleton.className).toContain('animate-pulse')
    })
})
