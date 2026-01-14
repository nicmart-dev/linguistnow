import React from 'react'
import Hero from '@/components/organisms/Hero'
import { useTranslation } from 'react-i18next'

const PrivacyPolicy = () => {
    const { t } = useTranslation()
    return (
        <>
            <Hero />
            <main className="container mx-auto px-3 mb-5">
                <div className="max-w-3xl text-lg text-black mt-4">
                    <h1>
                        {t('privacyPolicy.title')}
                    </h1>
                    <p>
                        {t('privacyPolicy.effectiveDate')}
                    </p>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.introductionTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.introductionText')}
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.infoWeCollectTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.infoWeCollectText1')}
                        </p>
                        <p>
                            {t('privacyPolicy.infoWeCollectText2')}
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                {t('privacyPolicy.nameContactData')}
                            </li>
                            <li className="mb-2">
                                {t('privacyPolicy.calendarAccess')}
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.useOfInfoTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.useOfInfoText1')}
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                {t('privacyPolicy.useOfInfoItem1')}
                            </li>
                            <li className="mb-2">
                                {t('privacyPolicy.useOfInfoItem2')}
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.sharingInfoTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.sharingInfoText1')}
                        </p>
                        <ul className="list-disc ml-6">
                            <li className="mb-2">
                                {t('privacyPolicy.sharingInfoItem1')}
                            </li>
                            <li className="mb-2">
                                {t('privacyPolicy.sharingInfoItem2')}
                            </li>
                            <li className="mb-2">
                                {t('privacyPolicy.sharingInfoItem3')}
                            </li>
                            <li className="mb-2">
                                {t('privacyPolicy.sharingInfoItem4')}
                            </li>
                        </ul>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.securityTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.securityText')}
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.rightsTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.rightsText')}
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.changesTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.changesText')}
                        </p>
                    </section>

                    <section className="my-4">
                        <h2>
                            {t('privacyPolicy.contactTitle')}
                        </h2>
                        <p>
                            {t('privacyPolicy.contactText')}
                        </p>
                    </section>
                </div>
            </main>
        </>
    )
}

export default PrivacyPolicy
