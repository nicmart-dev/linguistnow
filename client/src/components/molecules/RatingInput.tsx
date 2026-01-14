import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios, { isAxiosError } from 'axios'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RatingInputProps {
    rating?: number
    linguistEmail: string
    onRatingChange?: (newRating: number) => void
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
}

/**
 * Interactive star rating component for rating linguists.
 * Persists ratings to the backend API and provides visual feedback.
 * @param rating - Initial rating value (1-5)
 * @param linguistEmail - Email of the linguist being rated
 * @param onRatingChange - Callback fired when rating is successfully updated
 * @param disabled - Whether the rating input is disabled
 * @param size - Size variant: 'sm', 'md', or 'lg'
 */
const RatingInput: React.FC<RatingInputProps> = ({
    rating: initialRating,
    linguistEmail,
    onRatingChange,
    disabled = false,
    size = 'md',
}) => {
    const { t } = useTranslation()
    const [rating, setRating] = useState<number | undefined>(initialRating)
    const [hoveredRating, setHoveredRating] = useState<number | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    }

    const handleRatingClick = async (newRating: number) => {
        if (disabled || isUpdating) return

        setIsUpdating(true)
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/linguists/${encodeURIComponent(linguistEmail)}/rating`,
                { rating: newRating }
            )

            const ratingValue =
                typeof response.data === 'object' &&
                response.data !== null &&
                'rating' in response.data
                    ? (response.data as { rating: number }).rating
                    : undefined
            if (ratingValue !== undefined) {
                setRating(ratingValue)
                if (onRatingChange) {
                    onRatingChange(ratingValue)
                }
            }
            toast.success(
                t(
                    'dashboard.ratingInput.saveSuccess',
                    'Rating updated successfully'
                )
            )
        } catch (error) {
            console.error('Error updating rating:', error)

            // Extract detailed error message from server response
            let errorMessage = t(
                'dashboard.ratingInput.saveError',
                'Failed to update rating. Please try again.'
            )

            if (isAxiosError(error)) {
                const responseData: unknown = error.response?.data
                if (responseData && typeof responseData === 'object') {
                    const errorData = responseData as {
                        details?: string
                        message?: string
                        code?: string
                        invalidField?: string
                    }
                    // Server returns error.details or error.message
                    errorMessage =
                        errorData.details || errorData.message || errorMessage

                    // Log full error details for debugging
                    console.error('Rating update error details:', {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: responseData,
                        code: errorData.code,
                        invalidField: errorData.invalidField,
                    })
                } else {
                    errorMessage = error.message || errorMessage
                }
            } else if (error instanceof Error) {
                errorMessage = error.message
            }

            toast.error(errorMessage)
        } finally {
            setIsUpdating(false)
        }
    }

    const displayRating = hoveredRating ?? rating ?? 0

    return (
        <div
            className="flex items-center gap-1"
            title={t('dashboard.ratingInput.tooltip')}
        >
            {Array.from({ length: 5 }, (_, i) => {
                const starValue = i + 1
                const isFilled = starValue <= displayRating

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => {
                            void handleRatingClick(starValue)
                        }}
                        onMouseEnter={() => {
                            if (!disabled) {
                                setHoveredRating(starValue)
                            }
                        }}
                        onMouseLeave={() => {
                            setHoveredRating(null)
                        }}
                        disabled={disabled || isUpdating}
                        className={cn(
                            'transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded',
                            disabled || isUpdating
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer hover:scale-110'
                        )}
                        aria-label={t('dashboard.ratingInput.setRating', {
                            rating: starValue,
                        })}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isFilled
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-300'
                            )}
                        />
                    </button>
                )
            })}
            {rating && (
                <span className="text-sm text-gray-600 ml-1">
                    ({rating.toFixed(1)})
                </span>
            )}
        </div>
    )
}

export default RatingInput
