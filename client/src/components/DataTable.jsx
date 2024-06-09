import { useEffect, useRef } from 'react'

/* Import DataTables and extensions */
import DataTables from 'datatables.net-dt'
import 'datatables.net-responsive-dt'

/* DataTables is a powerful Javascript library for adding interaction features 
to HTML tables, with simplicity a core design principle for the project as a whole */

export function DataTable({ ...props }) {
    const tableRef = useRef(null)

    useEffect(() => {
        const dt = new DataTables(tableRef.current, {
            ...props,
            responsive: true,
        })
        return () => {
            dt.destroy()
        }
    }, [props])

    return <table ref={tableRef}></table>
}

export default DataTable
