import React from 'react'
import Hero from '../components/Hero'
import { FormattedMessage } from 'react-intl'

const PrivacyPolicy = () => {
    return (
        <>
            <Hero
                title={<FormattedMessage id="privacyPolicy.title" />}
                subtitle={<FormattedMessage id="privacyPolicy.subtitle" />}
            />
            <main className="container mx-auto px-3 mb-5">
                <div className="max-w-3xl text-lg text-black mt-4">
                    <h1>
                        <FormattedMessage id="privacyPolicy.title" />
                    </h1>
                    <p>
                        <FormattedMessage id="privacyPolicy.effectiveDate" />
                    </p>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.introductionTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.introductionText" />
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.infoWeCollectTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.infoWeCollectText1" />
                        </p>
                        <p>
                            <FormattedMessage id="privacyPolicy.infoWeCollectText2" />
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.nameContactData" />
                            </li>
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.calendarAccess" />
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.useOfInfoTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.useOfInfoText1" />
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.useOfInfoItem1" />
                            </li>
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.useOfInfoItem2" />
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.sharingInfoTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.sharingInfoText1" />
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.sharingInfoItem1" />
                            </li>
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.sharingInfoItem2" />
                            </li>
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.sharingInfoItem3" />
                            </li>
                            <li className="mb-2">
                                <FormattedMessage id="privacyPolicy.sharingInfoItem4" />
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.securityTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.securityText" />
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.rightsTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.rightsText" />
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.changesTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.changesText" />
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            <FormattedMessage id="privacyPolicy.contactTitle" />
                        </h2>
                        <p>
                            <FormattedMessage id="privacyPolicy.contactText" />
                        </p>
                    </section>
                </div>
            </main>
        </>
    )
}

export default PrivacyPolicy
