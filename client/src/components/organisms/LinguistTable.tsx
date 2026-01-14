import DataTable from './DataTable'
import { useColumns } from '@/data-table/columns'
import type { LinguistWithAvailability } from '@linguistnow/shared'

/* Display table of available linguists using DataTables library 
and handle localization of columns and availability field. */
interface LinguistTableProps {
    linguists: LinguistWithAvailability[]
}

// Legacy availability format for backwards compatibility
interface LegacyAvailability {
    result?: boolean
}

const LinguistTable = ({ linguists }: LinguistTableProps) => {
    const columns = useColumns()

    // Map linguists to table format
    const tableData = linguists.map((linguist) => {
        // Handle legacy format compatibility
        let availabilityStatus:
            | 'available'
            | 'unavailable'
            | 'limited'
            | 'setup-incomplete' = 'setup-incomplete'
        let freeHours: number | undefined

        if (!linguist.setupStatus.isComplete) {
            availabilityStatus = 'setup-incomplete'
        } else if (linguist.availability) {
            const availability = linguist.availability
            if ('isAvailable' in availability) {
                // New format from search API
                if (availability.isAvailable) {
                    availabilityStatus = 'available'
                } else if (availability.totalFreeHours > 0) {
                    availabilityStatus = 'limited'
                } else {
                    availabilityStatus = 'unavailable'
                }
                freeHours = availability.totalFreeHours
            } else if (Array.isArray(availability)) {
                // Legacy format
                const legacyAvailability =
                    availability as unknown as LegacyAvailability[]
                if (legacyAvailability[0]?.result !== undefined) {
                    availabilityStatus = legacyAvailability[0].result
                        ? 'available'
                        : 'unavailable'
                }
            }
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
