import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const localesDir = path.join(__dirname, 'locales')
const enFile = path.join(localesDir, 'en.json')
const otherLocales = [
    'fr',
    'es',
    'de',
    'it',
    'pt',
    'zh-cn',
    'ja',
    'ko',
    'ar',
    'ru',
]

/**
 * Recursively get all keys from an object with dot notation
 * @param obj - The object to extract keys from
 * @param prefix - The prefix for nested keys (e.g., "dashboard.filters")
 * @returns Array of all keys in dot notation
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = []
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (
            typeof obj[key] === 'object' &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
        ) {
            keys.push(
                ...getAllKeys(obj[key] as Record<string, unknown>, fullKey)
            )
        } else {
            keys.push(fullKey)
        }
    }
    return keys
}

/**
 * Get value at nested path in an object
 * @param obj - The object to get value from
 * @param path - Dot-notation path (e.g., "dashboard.filters.title")
 * @returns The value at the path, or undefined
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path
        .split('.')
        .reduce<unknown>(
            (current, key) =>
                current && typeof current === 'object' && key in current
                    ? (current as Record<string, unknown>)[key]
                    : undefined,
            obj
        )
}

describe('Translation files consistency', () => {
    // Read English file as the source of truth
    const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8')) as Record<
        string,
        unknown
    >
    const enKeys = getAllKeys(enContent).sort()

    it('should have English file as reference', () => {
        expect(enKeys.length).toBeGreaterThan(0)
        expect(enContent).toBeDefined()
    })

    describe.each(otherLocales)('locale: %s', (locale) => {
        const localeFile = path.join(localesDir, `${locale}.json`)

        it(`should have exactly the same keys as en.json`, () => {
            const localeContent = JSON.parse(
                fs.readFileSync(localeFile, 'utf8')
            ) as Record<string, unknown>
            const localeKeys = getAllKeys(localeContent).sort()

            // Check for missing keys
            const missingKeys = enKeys.filter(
                (key) => !localeKeys.includes(key)
            )
            if (missingKeys.length > 0) {
                const missingDetails = missingKeys
                    .map((key) => {
                        const value = getNestedValue(enContent, key)
                        return `  - ${key}: "${value}"`
                    })
                    .join('\n')
                throw new Error(
                    `${locale}.json is missing ${missingKeys.length} key(s):\n${missingDetails}`
                )
            }

            // Check for extra keys (keys in locale but not in English)
            const extraKeys = localeKeys.filter((key) => !enKeys.includes(key))
            if (extraKeys.length > 0) {
                const extraDetails = extraKeys
                    .map((key) => {
                        const value = getNestedValue(localeContent, key)
                        return `  - ${key}: "${value}"`
                    })
                    .join('\n')
                throw new Error(
                    `${locale}.json has ${extraKeys.length} extra key(s) not in en.json:\n${extraDetails}`
                )
            }

            // If we get here, all keys match
            expect(localeKeys).toEqual(enKeys)
        })

        it(`should have valid JSON structure`, () => {
            const content = fs.readFileSync(localeFile, 'utf8')
            expect(() => JSON.parse(content)).not.toThrow()
        })
    })

    it('should have all expected locale files', () => {
        const expectedFiles = [
            'en.json',
            ...otherLocales.map((locale) => `${locale}.json`),
        ]

        expectedFiles.forEach((file) => {
            const filePath = path.join(localesDir, file)
            expect(fs.existsSync(filePath)).toBe(true)
        })
    })
})
