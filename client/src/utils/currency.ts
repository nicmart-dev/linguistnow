/**
 * Currency definitions with code, symbol, and name
 * ISO 4217 currency codes
 */
export interface Currency {
    code: string
    symbol: string
    name: string
}

export const CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
]

/**
 * Get currency symbol from currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€') or the code itself if not found
 */
export function getCurrencySymbol(currencyCode?: string): string {
    if (!currencyCode) return ''
    const currency = CURRENCIES.find(
        (c) => c.code === currencyCode.toUpperCase()
    )
    return currency?.symbol || currencyCode
}
