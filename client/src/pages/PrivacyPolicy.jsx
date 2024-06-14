import Hero from '../components/Hero'
import { FormattedMessage } from 'react-intl'

const PrivacyPolicy = () => {
    return (
        <>
            <Hero />
            <main className="container mx-auto px-3 mb-5">
                <div className="max-w-3xl text-lg text-black mt-4">
                    <h1>Privacy Policy</h1>
                    <p>Effective Date: 14 June 2024</p>

                    <section className="my-4">
                        <h2>1. Introduction</h2>
                        <p>
                            This Privacy Policy explains how we collect, use,
                            disclose, and safeguard your information when you
                            use our application. We are committed to protecting
                            your personal data and your right to privacy. If you
                            have any questions or concerns about this policy, or
                            our practices with regards to your personal
                            information, please contact us at nicmart@gmail.com.
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>2. Information We Collect</h2>
                        <p>
                            We collect personal information that you voluntarily
                            provide to us when you register on the application,
                            express an interest in obtaining information about
                            us or our products and services, when you
                            participate in activities on the application, or
                            otherwise when you contact us.
                        </p>
                        <p>
                            The personal information we collect may include the
                            following:
                            <ul>
                                <li className="mb-2">
                                    Name and Contact Data: We collect your name,
                                    email address, and profile picture when you
                                    log in to your Google Account.
                                </li>
                                <li className="mb-2">
                                    Google Calendar Access: To enable the
                                    application's functionality, we request
                                    access to your Google Calendar. We ask for
                                    permission to view your calendar events
                                    solely to get a list of calendar IDs and
                                    check your availability using Google's
                                    Freebusy API. We do not read or store the
                                    details of your calendar events.
                                </li>
                            </ul>
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect or receive:
                            <ul>
                                <li className="mb-2">
                                    To facilitate account creation and logon
                                    process.
                                </li>
                                <li className="mb-2">
                                    To check against the provided list of
                                    calendars in Google Calendar if you are free
                                    or busy at a given date and time.
                                </li>
                            </ul>
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>4. Sharing Your Information</h2>
                        <p>
                            We may process or share your data that we hold based
                            on the following legal basis:
                            <ul className="list-disc ml-6">
                                <li className="mb-2">
                                    Consent: We may process your data if you
                                    have given us specific consent to use your
                                    personal information for a specific purpose.
                                </li>
                                <li className="mb-2">
                                    Legitimate Interests: We may process your
                                    data when it is reasonably necessary to
                                    achieve our legitimate business interests.
                                </li>
                                <li className="mb-2">
                                    Performance of a Contract: Where we have
                                    entered into a contract with you, we may
                                    process your personal information to fulfill
                                    the terms of our contract.
                                </li>
                                <li className="mb-2">
                                    Legal Obligations: We may disclose your
                                    information where we are legally required to
                                    do so in order to comply with applicable
                                    law, governmental requests, a judicial
                                    proceeding, court order, or legal process.
                                </li>
                            </ul>
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>5. Security of Your Information</h2>
                        <p>
                            We use administrative, technical, and physical
                            security measures to help protect your personal
                            information. While we have taken reasonable steps to
                            secure the personal information you provide to us,
                            please be aware that despite our efforts, no
                            security measures are perfect or impenetrable, and
                            no method of data transmission can be guaranteed
                            against any interception or other type of misuse.
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>6. Your Privacy Rights</h2>
                        <p>
                            You have certain rights under applicable data
                            protection laws, including the right to access,
                            correct, update, or delete the personal information
                            we have about you. If you wish to exercise any of
                            these rights, please contact us at
                            nicmart@gmail.com.
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>7. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time
                            in order to reflect, for example, changes to our
                            practices or for other operational, legal, or
                            regulatory reasons. We will notify you of any
                            changes by posting the new Privacy Policy on this
                            page. You are advised to review this Privacy Policy
                            periodically for any changes.
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy,
                            please contact us by email at nicmart@gmail.com.
                        </p>
                    </section>
                </div>
            </main>
        </>
    )
}

export default PrivacyPolicy
