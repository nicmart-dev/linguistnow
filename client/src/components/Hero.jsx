import React from 'react'
import heroImage1 from '../assets/images/hero-image1.jpg'
import heroImage2 from '../assets/images/hero-image2.jpg'
import heroImage3 from '../assets/images/hero-image3.jpg'
import heroImage4 from '../assets/images/hero-image4.jpg'
import googleIcon from '../assets/icons/google.svg'
import { useLocation } from 'react-router-dom' // to check the current route
import { FormattedMessage } from 'react-intl' // to localize text displayed

const Hero = ({ cta, userName }) => {
    const location = useLocation()

    // Define different content based on the route
    let title, subtitle, description, backgroundImage, ctaButtonText, ctaIcon

    if (location.pathname === '/login') {
        title = "Let's make it easy to work together."
        subtitle = 'Great to see you!'
        description = ''
        backgroundImage = heroImage2
        ctaButtonText = 'signInWithGoogle'
        ctaIcon = googleIcon
    } else if (location.pathname === '/dashboard') {
        title = 'Find an available linguist.'
        subtitle = `Hey ${userName}!`
        description = ''
        backgroundImage = heroImage3
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else if (location.pathname === '/settings') {
        title = 'Manage your calendars.'
        subtitle = `Welcome ${userName}!`
        description = ''
        backgroundImage = heroImage1
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else if (location.pathname === '/logout') {
        title = 'Time to spread your wings!'
        subtitle = 'Goodbye!'
        description = ''
        backgroundImage = heroImage4
        ctaButtonText = '' // No CTA button on this page
        ctaIcon = null
    } else {
        /* Empty page */
        title = ''
        subtitle = ''
        description = ''
        backgroundImage = heroImage2
        ctaButtonText = ''
        ctaIcon = null
    }
    return (
        <section
            className="mt-4 w-full bg-center bg-cover"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="flex items-center justify-center w-full h-full bg-gray-900 bg-opacity-50 py-6">
                <div className="text-center container px-4 max-w-4xl mx-auto">
                    <span className="text-gray-200 font-semibold uppercase tracking-widest">
                        {subtitle}
                    </span>
                    <h2 className="mt-8 mb-6 text-4xl lg:text-5xl font-bold text-gray-100">
                        {title}
                    </h2>
                    <p className="max-w-3xl mx-auto mb-5 text-lg text-gray-300">
                        {description}
                    </p>
                    {/* Show CTA button only when icon and text defined */}
                    {ctaIcon && ctaButtonText && (
                        <button
                            onClick={cta}
                            className="inline-flex justify-center items-center w-full mb-4 md:w-auto py-5 px-8 text-sm font-bold uppercase border-2 border-transparent bg-gray-200 rounded hover:bg-gray-100 text-gray-800 transition duration-200"
                        >
                            <img
                                className="h-6 w-6 inline-block mr-4"
                                src={ctaIcon}
                                alt="call to action"
                            />
                            <FormattedMessage id={ctaButtonText} />
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}

export default Hero
