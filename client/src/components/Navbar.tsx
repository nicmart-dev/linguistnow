import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageContext } from '../i18n/LanguageProvider'

interface NavbarProps {
    userDetails: { Role: string } | null
}

const Navbar = ({ userDetails }: NavbarProps) => {
    const { t } = useTranslation()
    const languageContext = useContext(LanguageContext)
    const switchLanguage = languageContext?.switchLanguage
    const [menuOpen, setMenuOpen] = useState(false) // track if menu is open or not
    const [langOpen, setLangOpen] = useState(false) // track if language toggle is open or not

    return (
        <nav
            id="header"
            className="w-full z-30 sticky top-0 py-1 bg-white shadow-sm"
        >
            <div className="w-full container mx-auto flex flex-wrap items-center mt-0 px-6 py-3">
                {/* Left section - Menu toggle and navigation (desktop) */}
                <div className="flex-1 flex items-center order-1">
                    {/* Menu toggle button only displayed on mobile */}
                    <button
                        type="button"
                        className="cursor-pointer md:hidden block"
                        onClick={() => {
                            setMenuOpen(!menuOpen)
                            if (langOpen) {
                                setLangOpen(false)
                            }
                        }}
                    >
                        <svg
                            className="fill-current text-gray-900"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                        >
                            <title>{t('nav.menuIcon')}</title>
                            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
                        </svg>
                    </button>
                    {/* Desktop navigation - visible on md and up */}
                    <nav className="hidden md:block">
                        <ul className="flex items-center text-base text-gray-700">
                            <li>
                                <Link
                                    className="inline-block no-underline hover:text-black hover:underline py-2 px-4"
                                    to="/"
                                >
                                    {t('nav.home')}
                                </Link>
                            </li>
                            {userDetails &&
                                userDetails.Role === 'Project Manager' && (
                                    <li>
                                        <Link
                                            className="inline-block no-underline hover:text-black hover:underline py-2 px-4"
                                            to="/dashboard"
                                        >
                                            {t('nav.dashboard')}
                                        </Link>
                                    </li>
                                )}
                        </ul>
                    </nav>
                </div>
                {/* Site logo - always centered */}
                <div className="order-2 shrink-0">
                    <Link
                        className="flex items-center tracking-wide no-underline hover:no-underline font-bold text-gray-800 text-xl "
                        to="/"
                    >
                        <svg
                            className="fill-current text-gray-800 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.547 4.505a8.25 8.25 0 1 0 11.672 8.214l-.46-.46a2.252 2.252 0 0 1-.422-.586l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.211.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.654-.261a2.25 2.25 0 0 1-1.384-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.279-2.132Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        LINGUISTNOW
                    </Link>
                </div>

                {/* Right section - User settings and icons */}
                <div
                    className="flex-1 flex items-center justify-end order-3"
                    id="nav-content"
                >
                    {(!userDetails ||
                        userDetails.Role !== 'Project Manager') && (
                        <Link
                            to="/settings"
                            className="inline-block no-underline hover:text-black"
                        >
                            <svg
                                className="fill-current hover:text-black"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                            >
                                <circle fill="none" cx="12" cy="7" r="3" />
                                <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 10c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3S13.654 10 12 10zM21 21v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1H21z" />
                            </svg>
                        </Link>
                    )}
                    {/* Button to toggle language menu so user can select a language to localize UI */}
                    <label
                        htmlFor="language-toggle"
                        className="pl-3 cursor-pointer block"
                    >
                        <svg
                            className="fill-current hover:text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <title>{t('nav.languageIcon')}</title>

                            <path
                                fillRule="evenodd"
                                d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3A.75.75 0 0 1 9 2.25ZM15.75 9a.75.75 0 0 1 .68.433l5.25 11.25a.75.75 0 1 1-1.36.634l-1.198-2.567h-6.744l-1.198 2.567a.75.75 0 0 1-1.36-.634l5.25-11.25A.75.75 0 0 1 15.75 9Zm-2.672 8.25h5.344l-2.672-5.726-2.672 5.726Z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </label>
                    {/* When clicking on language toggle, collapse regular menu if still open */}
                    <input
                        className="hidden"
                        type="checkbox"
                        id="language-toggle"
                        checked={langOpen}
                        onChange={() => {
                            setLangOpen(!langOpen)
                            if (menuOpen) {
                                setMenuOpen(false)
                            }
                        }}
                    />

                    {/* Button to route to logout page but only displayed when logged in */}
                    {userDetails && (
                        <Link
                            to="/logout"
                            className="pl-3 inline-block no-underline hover:text-black"
                        >
                            <svg
                                className="fill-current hover:text-black"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </Link>
                    )}
                </div>
                {/* Language selection menu - compact grid popover */}
                {langOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                                setLangOpen(false)
                            }}
                        />
                        <div
                            className="absolute right-4 top-16 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                            id="lang-menu"
                        >
                            <div className="grid grid-cols-3 gap-2 min-w-[280px]">
                                {[
                                    {
                                        code: 'en',
                                        label: t('languageSelection.english'),
                                    },
                                    {
                                        code: 'fr',
                                        label: t('languageSelection.french'),
                                    },
                                    {
                                        code: 'zh-cn',
                                        label: t(
                                            'languageSelection.simplifiedChinese'
                                        ),
                                    },
                                    {
                                        code: 'es',
                                        label: t('languageSelection.spanish'),
                                    },
                                    {
                                        code: 'de',
                                        label: t('languageSelection.german'),
                                    },
                                    {
                                        code: 'it',
                                        label: t('languageSelection.italian'),
                                    },
                                    {
                                        code: 'pt',
                                        label: t(
                                            'languageSelection.portuguese'
                                        ),
                                    },
                                    {
                                        code: 'ja',
                                        label: t('languageSelection.japanese'),
                                    },
                                    {
                                        code: 'ko',
                                        label: t('languageSelection.korean'),
                                    },
                                    {
                                        code: 'ar',
                                        label: t('languageSelection.arabic'),
                                    },
                                    {
                                        code: 'ru',
                                        label: t('languageSelection.russian'),
                                    },
                                ].map(({ code, label }) => (
                                    <button
                                        key={code}
                                        onClick={() => {
                                            switchLanguage?.(
                                                code as
                                                    | 'en'
                                                    | 'fr'
                                                    | 'zh-cn'
                                                    | 'es'
                                                    | 'de'
                                                    | 'it'
                                                    | 'pt'
                                                    | 'ja'
                                                    | 'ko'
                                                    | 'ar'
                                                    | 'ru'
                                            )
                                            setLangOpen(false)
                                        }}
                                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150 text-center whitespace-nowrap"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {/* Mobile navigation menu - popover style, shown when hamburger clicked */}
                {menuOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <div
                            className="fixed inset-0 z-40 md:hidden"
                            onClick={() => {
                                setMenuOpen(false)
                            }}
                        />
                        <div
                            className="absolute left-4 top-16 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 md:hidden min-w-[160px]"
                            id="menu"
                        >
                            <nav>
                                <ul className="flex flex-col text-base text-gray-700">
                                    <li>
                                        <Link
                                            onClick={() => {
                                                setMenuOpen(false)
                                            }}
                                            className="block no-underline hover:bg-gray-100 hover:text-black rounded-md py-2 px-4 transition-colors duration-150"
                                            to="/"
                                        >
                                            {t('nav.home')}
                                        </Link>
                                    </li>
                                    {userDetails &&
                                        userDetails.Role ===
                                            'Project Manager' && (
                                            <li>
                                                <Link
                                                    onClick={() => {
                                                        setMenuOpen(false)
                                                    }}
                                                    className="block no-underline hover:bg-gray-100 hover:text-black rounded-md py-2 px-4 transition-colors duration-150"
                                                    to="/dashboard"
                                                >
                                                    {t('nav.dashboard')}
                                                </Link>
                                            </li>
                                        )}
                                </ul>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar
