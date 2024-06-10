import React, { useState, useEffect } from 'react'
import DataTable from './DataTable.jsx'
import { useIntl } from 'react-intl'

const columns = [
    // TODO fix for TanStack table library { accessorKey: 'Picture', header: 'accountSettings.picture' },
    { accessorKey: 'Name', headerId: 'accountSettings.name' },
    { accessorKey: 'Email', headerId: 'accountSettings.email' },
    { accessorKey: 'availability', headerId: 'dashboard.availability' },
]

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

    const localizeColumns = () => {
        return columns.map((column) => ({
            ...column,
            header: intl.formatMessage({ id: column.headerId }),
        }))
    }

    /* Make some changes to the data before we turn it into a table */
    const cleanDataForTable = (linguist) => {
        // Parse availability boolean to string Available or "Not available" in strings.json
        const availabilityId = linguist.availability[0].result
            ? 'dashboard.available'
            : 'dashboard.notAvailable'
        return {
            ...linguist,
            availability: intl.formatMessage({ id: availabilityId }),
            // turn profile picture url to img element to display it
            Picture: `<img src="${linguist.Picture}" alt="Linguist Picture" style="width: 50px; height: 50px;" />`,
        }
    }

    const processRows = (linguists) => {
        return linguists.map(cleanDataForTable)
    }

    const [localizedColumns, setLocalizedColumns] = useState(localizeColumns)
    const [localizedRows, setLocalizedRows] = useState(processRows(linguists))

    useEffect(() => {
        setLocalizedColumns(localizeColumns)
        setLocalizedRows(processRows(linguists))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intl, linguists])

    console.log('Linguists table list:', localizedRows) // for testing purposes

    return <DataTable data={localizedRows} columns={localizedColumns} />
}

export default LinguistTable
