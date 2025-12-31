import DataTable from './DataTable'
import { useColumns } from '../data-table/columns' // get localized column headers
import { useTranslation } from 'react-i18next'

/* Display table of available linguists using DataTables library 
and handle localization of columns and availability field. */
const LinguistTable = ({ linguists, errors = [] }) => {
    const columns = useColumns()
    /* Sample linguists prop format:
    [
        {
            "Role": "Linguist",
            "Picture": "https://lh3.googleusercontent.com/...",
            "Email": "user@example.com",
            "Name": "User Name",
            "availability": {
                "isAvailable": true,
                "freeSlots": [...],
                "totalFreeHours": 40,
                "workingDays": 5,
                "hoursPerDay": { "2024-01-15": 8, ... }
            }
        },
    ]     */

    const { t } = useTranslation()

    const availabilityToText = (linguists) => {
        return linguists.map((linguist) => {
            // Handle both new format (object with isAvailable) and legacy format (array with result)
            let isAvailable = false
            let needsLogin = false
            if (linguist.availability) {
                if (
                    typeof linguist.availability === 'object' &&
                    'isAvailable' in linguist.availability
                ) {
                    // New Express format: { isAvailable: boolean, needsLogin?: boolean, ... }
                    isAvailable = linguist.availability.isAvailable
                    needsLogin = linguist.availability.needsLogin === true
                } else if (
                    Array.isArray(linguist.availability) &&
                    linguist.availability[0]?.result !== undefined
                ) {
                    // Legacy n8n format: [{ result: boolean }]
                    isAvailable = linguist.availability[0].result
                }
            }

            let textToDisplay: string
            if (needsLogin) {
                textToDisplay = t('dashboard.needsLogin')
            } else if (isAvailable) {
                textToDisplay = t('dashboard.available')
            } else {
                textToDisplay = t('dashboard.notAvailable')
            }

            return {
                ...linguist,
                availability: textToDisplay,
            }
        })
    }
    const linguistsWithAvailText = availabilityToText(linguists)

    return <DataTable data={linguistsWithAvailText} columns={columns} />
}

export default LinguistTable
