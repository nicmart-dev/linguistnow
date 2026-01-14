import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom' // Add this line for using Link
import xIcon from '@/assets/icons/socials/x.svg'
import FacebookIcon from '@/assets/icons/socials/facebook.svg'
import InstagramIcon from '@/assets/icons/socials/instagram.svg'
import LinkedInIcon from '@/assets/icons/socials/linkedin.svg'

/**
 * Site footer component with about section, privacy link, and social media links.
 * Displays company information and navigation to social media profiles.
 */
const Footer = () => {
    const { t } = useTranslation()
    return (
        <footer className="container mx-auto bg-white py-8 border-t border-gray-400">
            <div className="container flex px-3 py-8">
                <div className="w-full mx-auto flex flex-wrap">
                    <div className="flex w-full lg:w-3/5">
                        <div className="px-3 md:px-0">
                            <h3 className="font-bold text-gray-900">
                                {t('footer.aboutTitle')}
                            </h3>
                            <p className="py-4">{t('footer.aboutText')}</p>
                            <p className="py-2">
                                <Link to="/privacy" className="hover:underline">
                                    {t('footer.privacyTitle')}
                                </Link>
                            </p>
                        </div>
                    </div>
                    <div className="flex w-full lg:w-2/5 lg:justify-end lg:text-right mt-6 md:mt-0">
                        <div className="px-3 md:px-0">
                            <h3 className="text-left font-bold text-gray-900">
                                {t('footer.socialTitle')}
                            </h3>
                            <div className="w-full flex items-center py-4 mt-0 text-gray-900">
                                <a
                                    href="https://x.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mx-2"
                                >
                                    <img
                                        src={xIcon}
                                        alt={t('footer.alt.xIcon')}
                                        className="w-6 h-6 fill-current"
                                    />
                                </a>
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mx-2"
                                >
                                    <img
                                        src={FacebookIcon}
                                        alt={t('footer.alt.facebookIcon')}
                                        className="w-6 h-6 fill-current"
                                    />
                                </a>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mx-2"
                                >
                                    <img
                                        src={InstagramIcon}
                                        alt={t('footer.alt.instagramIcon')}
                                        className="w-6 h-6 fill-current"
                                    />
                                </a>
                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mx-2"
                                >
                                    <img
                                        src={LinkedInIcon}
                                        alt={t('footer.alt.linkedinIcon')}
                                        className="w-6 h-6 fill-current"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
