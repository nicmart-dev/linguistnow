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

    const localizeColumns = () => {
        return columns.map((column) => ({
            ...column,
            title: intl.formatMessage({ id: column.titleId }),
        }))
    }

    const initialAvailabilityCheck = (linguist) => {
        const availabilityId = linguist.availability[0].result
            ? 'dashboard.available'
            : 'dashboard.notAvailable'
        return {
            ...linguist,
            availability: intl.formatMessage({ id: availabilityId }),
        }
    }

    const processRows = (linguists) => {
        return linguists.map(initialAvailabilityCheck)
    }

    const [localizedColumns, setLocalizedColumns] = useState(localizeColumns)
    const [localizedRows, setLocalizedRows] = useState(processRows(linguists))

    useEffect(() => {
        setLocalizedColumns(localizeColumns)
        setLocalizedRows(processRows(linguists))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intl, linguists])

    console.log('Linguists table list:', localizedRows)
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

    return <DataTable data={localizedRows} columns={localizedColumns} />
}

export default LinguistTable
