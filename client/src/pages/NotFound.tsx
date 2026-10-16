import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 404 / Error page component displaying a simple centered not-found message.
 * Follows the HyperUI simple error page specification.
 */
export const NotFound = () => {
    const { t } = useTranslation()

    return (
        <div className="grid h-screen px-4 bg-white place-content-center dark:bg-gray-900">
            <h1 className="tracking-widest text-gray-500 uppercase dark:text-gray-400">
                {t('notFound.title', '404 | Not Found')}
            </h1>
        </div>
    )
}

export default NotFound
