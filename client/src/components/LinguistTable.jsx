import DataTable from './DataTable.jsx'
import { columns } from '../data-table/columns.jsx' // get localized column headers

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

    return <DataTable data={linguists} columns={columns} />
}

export default LinguistTable
