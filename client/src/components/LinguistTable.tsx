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
            "Picture": "https://lh3.googleusercontent.com/a/ACg8ocKHlwJUpk6cYZAH2WfJBUmyvWEP3UOeIlzxGvFwhomNAU1bLQ=s96-c",
            "Email": "pokemontest734@gmail.com",
            "Name": "Pokemon Test2",
            "availability": [
                {
                    "result": true
                }
            ]
            (...) // other user details
        },
    ]     */

    const { t } = useTranslation()

    const availabilityToText = (linguists) => {
        return linguists.map((linguist) => {
            const isAvailable = linguist.availability[0].result
            const textToDisplay = isAvailable
                ? t('dashboard.available')
                : t('dashboard.notAvailable')
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
