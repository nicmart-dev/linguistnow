import xIcon from '../assets/icons/socials/x.svg'
import FacebookIcon from '../assets/icons/socials/facebook.svg'
import InstagramIcon from '../assets/icons/socials/instagram.svg'
import LinkedInIcon from '../assets/icons/socials/linkedin.svg'

const Footer = () => (
    <footer className="container mx-auto bg-white py-8 border-t border-gray-400">
        <div className="container flex px-3 py-8">
            <div className="w-full mx-auto flex flex-wrap">
                <div className="flex w-full lg:w-1/2">
                    <div className="px-3 md:px-0">
                        <h3 className="font-bold text-gray-900">About</h3>
                        <p className="py-4">
                            LinguistNow simplifies the hassle of finding
                            available linguists for translation projects.
                            Whether you're a project manager in a translation
                            agency or a linguist seeking new opportunities,
                            LinguistNow provides the tools you need to
                            streamline your workflow and connect with the right
                            people at the right time.
                        </p>
                    </div>
                </div>
                <div className="flex w-full lg:w-1/2 lg:justify-end lg:text-right mt-6 md:mt-0">
                    <div className="px-3 md:px-0">
                        <h3 className="text-left font-bold text-gray-900">
                            Social
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
                                    alt="X Icon"
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
                                    alt="Facebook Icon"
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
                                    alt="Instagram Icon"
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
                                    alt="LinkedIn Icon"
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

export default Footer
