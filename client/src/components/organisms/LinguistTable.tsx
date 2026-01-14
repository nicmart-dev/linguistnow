import DataTable from './DataTable'
import { useColumns } from '@/data-table/columns'
import type { LinguistWithAvailability } from '@linguistnow/shared'

interface LinguistTableProps {
    linguists: LinguistWithAvailability[]
}

/**
 * Displays a table of linguists with their availability status.
 * Maps linguist data to table format with availability status indicators.
 * @param linguists - Array of linguist data with availability information
 */
const LinguistTable = ({ linguists }: LinguistTableProps) => {
    const columns = useColumns()

    // Map linguists to table format with computed availability status
    const tableData = linguists.map((linguist) => {
        let availabilityStatus:
            | 'available'
            | 'unavailable'
            | 'limited'
            | 'setup-incomplete' = 'setup-incomplete'
        let freeHours: number | undefined

        if (!linguist.setupStatus.isComplete) {
            availabilityStatus = 'setup-incomplete'
        } else if (linguist.availability) {
            if (linguist.availability.isAvailable) {
                availabilityStatus = 'available'
            } else if (linguist.availability.totalFreeHours > 0) {
                availabilityStatus = 'limited'
            } else {
                availabilityStatus = 'unavailable'
            }
            freeHours = linguist.availability.totalFreeHours
        }

        return {
            ...linguist,
            availabilityStatus,
            freeHours,
        }
    })

    return <DataTable data={tableData} columns={columns} />
}

export default LinguistTable
