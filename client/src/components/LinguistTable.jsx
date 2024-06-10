import DataTable from './DataTable.jsx'
import { columns } from '../data-table/columns.jsx' // get localized column headers
import { useIntl } from 'react-intl'

/* Display table of available linguists using DataTables library 
and handle localization of columns and availability field. */
const LinguistTable = ({ linguists }) => {
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

    const intl = useIntl()

    const availabilityToText = (linguists) => {
        return linguists.map((linguist) => {
            const isAvailable = linguist.availability[0].result
            const textToDisplay = isAvailable
                ? intl.formatMessage({ id: 'dashboard.available' })
                : intl.formatMessage({ id: 'dashboard.notAvailable' })
            console.log('Text to display:', textToDisplay)
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
