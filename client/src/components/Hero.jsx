import React from 'react'
import heroImage from '../assets/images/hero-image.jpg'
import { Link } from 'react-router-dom'

const Hero = () => {
    return (
        <section
            className="mt-4 w-full bg-center bg-cover"
            style={{ backgroundImage: `url(${heroImage})` }}
        >
            <div className="flex items-center justify-center w-full h-full bg-gray-900 bg-opacity-50 py-12">
                <div className="text-center container px-4 max-w-4xl mx-auto">
                    <span className="text-gray-200 font-semibold uppercase tracking-widest">
                        Welcome!
                    </span>
                    <h2 className="mt-8 mb-6 text-4xl lg:text-5xl font-bold text-gray-100">
                        Let's make it easy to work together
                    </h2>
                    <p className="max-w-3xl mx-auto mb-10 text-lg text-gray-300">
                        Just log in to your Google account, select your
                        calendars, and we'll take care of the rest.
                    </p>
                    <Link
                        to={'/login'}
                        className="inline-block w-full md:w-auto mb-4 md:mr-6 py-5 px-8 text-sm font-bold uppercase border-2 border-transparent bg-gray-200 rounded hover:bg-gray-100 text-gray-800 transition duration-200"
                    >
                        Set your availability
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Hero
