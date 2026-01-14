import React from 'react'
import heroImage1 from '@/assets/images/hero-image1.jpg'
import heroImage2 from '@/assets/images/hero-image2.jpg'
import heroImage3 from '@/assets/images/hero-image3.jpg'
import heroImage4 from '@/assets/images/hero-image4.jpg'
import googleIcon from '@/assets/icons/google.svg'
import { useLocation } from 'react-router-dom' // to check the current route
import { useTranslation } from 'react-i18next' // to localize text displayed

interface HeroProps {
    cta?: () => void
    userName?: string
}

/**
 * Hero banner component that displays route-specific content.
 * Shows different backgrounds, titles, and CTAs based on current route.
 * @param cta - Optional click handler for the call-to-action button
 * @param userName - Optional user name to display in personalized greetings
 */
const Hero = ({ cta, userName }: HeroProps) => {
    const { t } = useTranslation()
    const location = useLocation()

    // Define different content based on the route
    let title, subtitle, backgroundImage, ctaButtonText, ctaIcon

    if (location.pathname === '/login') {
        title = 'hero.login.title'
        subtitle = 'hero.login.subtitle'
        backgroundImage = heroImage2
        ctaButtonText = 'auth.signInWithGoogle'
        ctaIcon = googleIcon
    } else if (location.pathname === '/dashboard') {
        title = 'hero.dashboard.title'
        subtitle = 'hero.dashboard.subtitle'
        backgroundImage = heroImage3
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else if (location.pathname === '/settings') {
        title = 'hero.settings.title'
        subtitle = 'hero.settings.subtitle'
        backgroundImage = heroImage1
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else if (location.pathname === '/logout') {
        title = 'hero.logout.title'
        subtitle = 'hero.logout.subtitle'
        backgroundImage = heroImage4
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else if (location.pathname === '/privacy') {
        title = 'hero.privacy.title'
        subtitle = 'hero.privacy.subtitle'
        backgroundImage = heroImage2
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else {
        /* Empty page */
        title = ''
        subtitle = ''
        backgroundImage = heroImage2
        ctaButtonText = ''
        ctaIcon = null
    }
    return (
        <section
            className="mt-4 w-full bg-center bg-cover min-h-[200px] md:min-h-[250px]"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="flex items-center justify-center w-full min-h-[200px] md:min-h-[250px] bg-gray-900/50 py-4">
                <div className="text-center container px-4 max-w-3xl mx-auto">
                    <span className="text-gray-200 font-semibold uppercase tracking-widest">
                        {t(subtitle, { userName: userName || '' })}
                    </span>
                    <h2 className="mt-8 mb-6 text-4xl lg:text-5xl font-bold text-gray-100">
                        {t(title)}
                    </h2>

                    {/* Show CTA button only when icon and text defined */}
                    {ctaIcon && ctaButtonText && (
                        <button
                            onClick={cta}
                            className="inline-flex justify-center items-center w-full mb-4 md:w-auto py-5 px-8 text-sm font-bold uppercase border-2 border-transparent bg-gray-200 rounded hover:bg-gray-100 text-gray-800 transition duration-200"
                        >
                            <img
                                className="h-6 w-6 inline-block mr-4"
                                src={ctaIcon}
                                alt={t('hero.alt.callToAction')}
                            />
                            {t(ctaButtonText)}
                        </button>
                    )}
                    {/* Show description text but only on pages with cta, ie. login */}
                    {cta && location.pathname === '/login' && (
                        <p className="max-w-3xl mx-auto mb-10 text-lg text-gray-300">
                            {t('auth.loginDescription')}
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default Hero
