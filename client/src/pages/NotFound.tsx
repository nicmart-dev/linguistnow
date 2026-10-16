import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/**
 * 404 / Error page component displaying a simple centered not-found message
 * and a link to return to the home page.
 * Follows the HyperUI error page pattern.
 */
export const NotFound = () => {
    const { t } = useTranslation()

    return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 bg-white text-center dark:bg-gray-900">
            <h1 className="tracking-widest text-gray-500 uppercase dark:text-gray-400">
                {t('notFound.title', '404 | Not Found')}
            </h1>
            <Button asChild className="mt-6">
                <Link to="/">{t('notFound.goHome', 'Go Back Home')}</Link>
            </Button>
        </div>
    )
}

export default NotFound
