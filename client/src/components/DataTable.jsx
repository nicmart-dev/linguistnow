import { useEffect, useRef } from 'react'

/* Import DataTables and extensions */
import jszip from 'jszip' // For Excel export
import DataTables from 'datatables.net-zf'
import 'datatables.net-buttons-zf'
import 'datatables.net-buttons/js/buttons.html5.mjs'
import DateTime from 'datatables.net-datetime'
import 'datatables.net-responsive-zf'
import $ from 'jquery'

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
