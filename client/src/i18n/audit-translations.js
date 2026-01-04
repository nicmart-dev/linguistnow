// Script to audit translation files and find missing keys
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

// Recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
    const keys = []
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (
            typeof obj[key] === 'object' &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
        ) {
            keys.push(...getAllKeys(obj[key], fullKey))
        } else {
            keys.push(fullKey)
        }
    }
    return keys
}

// Get value at nested path
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Read English file as reference
const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'))
const enKeys = getAllKeys(enContent).sort()

console.log(`\n📋 Translation Audit Report`)
console.log(`Total keys in en.json: ${enKeys.length}\n`)

// Check each locale file
let allComplete = true
for (const locale of otherLocales) {
    const localeFile = path.join(localesDir, `${locale}.json`)
    const localeContent = JSON.parse(fs.readFileSync(localeFile, 'utf8'))
    const localeKeys = getAllKeys(localeContent).sort()

    const missingKeys = enKeys.filter((key) => !localeKeys.includes(key))

    if (missingKeys.length > 0) {
        allComplete = false
        console.log(`\n❌ ${locale}.json: ${missingKeys.length} missing keys`)
        missingKeys.forEach((key) => {
            const value = getNestedValue(enContent, key)
            console.log(`   - ${key}: "${value}"`)
        })
    } else {
        console.log(`✅ ${locale}.json: All keys present`)
    }
}

if (allComplete) {
    console.log(`\n🎉 All locale files are complete!\n`)
} else {
    console.log(`\n⚠️  Some locale files are missing translations.\n`)
    process.exit(1)
}
