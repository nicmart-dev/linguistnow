import DataTable from './DataTable'
import { useColumns } from '../data-table/columns'
import type { LinguistWithAvailability } from '@linguistnow/shared'

/* Display table of available linguists using DataTables library 
and handle localization of columns and availability field. */
interface LinguistTableProps {
    linguists: LinguistWithAvailability[]
    errors?: unknown[]
}

const LinguistTable = ({
    linguists,
    errors: _errors = [],
}: LinguistTableProps) => {
    const columns = useColumns()

    // Map linguists to table format
    const tableData = linguists.map(
        (linguist: LinguistWithAvailability | any) => {
            // Handle legacy format compatibility
            let availabilityStatus:
                | 'available'
                | 'unavailable'
                | 'limited'
                | 'setup-incomplete' = 'setup-incomplete'
            let freeHours: number | undefined

            if (linguist.setupStatus && !linguist.setupStatus.isComplete) {
                availabilityStatus = 'setup-incomplete'
            } else if (linguist.availability) {
                if (
                    typeof linguist.availability === 'object' &&
                    'isAvailable' in linguist.availability
                ) {
                    // New format from search API
                    if (linguist.availability.isAvailable) {
                        availabilityStatus = 'available'
                    } else if (linguist.availability.totalFreeHours > 0) {
                        availabilityStatus = 'limited'
                    } else {
                        availabilityStatus = 'unavailable'
                    }
                    freeHours = linguist.availability.totalFreeHours
                } else if (
                    Array.isArray(linguist.availability) &&
                    linguist.availability[0]?.result !== undefined
                ) {
                    // Legacy format
                    availabilityStatus = linguist.availability[0].result
                        ? 'available'
                        : 'unavailable'
                }
            }

            return {
                ...linguist,
                availabilityStatus,
                freeHours,
            }
        }
    )

    return <DataTable data={tableData} columns={columns} />
}

export default LinguistTable
