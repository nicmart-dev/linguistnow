import React, { useState, useEffect } from 'react'
import DataTable from './DataTable.jsx'
import { useIntl } from 'react-intl'

const columns = [
    { data: 'Name', titleId: 'accountSettings.name' },
    { data: 'Email', titleId: 'accountSettings.email' },
    { data: 'availability', titleId: 'dashboard.availability' },
]

const LinguistTable = ({ linguists }) => {
    const intl = useIntl()

    // Refresh table columns with matching localized strings
    const localizeColumns = () => {
        return columns.map((column) => ({
            ...column,
            title: intl.formatMessage({ id: column.titleId }),
        }))
    }

    /* TODO: update table state with linguists array with Available/Not available status before rendering table
   {linguist.availability[0].result ? (
intl.formatMessage({ id: dashboard.available })
    ) : (
intl.formatMessage({ id: dashboard.notAvailable })
    )}
*/

    const [table, setTable] = useState(localizeColumns) // store table data in state

    /* Refresh table data if language change */
    useEffect(() => {
        setTable(localizeColumns)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intl])

    console.log('Linguists table list:', linguists)
    /* Sample format of linguists array:
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
    {
        // Other users
    }
]
    
    */

    return <DataTable data={linguists} columns={table} />
}

export default LinguistTable
