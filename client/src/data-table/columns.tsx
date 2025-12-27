import { FormattedMessage } from 'react-intl' // To show localized strings
import { ArrowUpDown } from 'lucide-react'
import { Button } from '../components/Button' // used for sorting
import type { ColumnDef } from '@tanstack/react-table'

// Define the linguist data type based on the structure used in LinguistTable
interface LinguistRow {
    availability: string // Converted from array to string in availabilityToText
    Picture?: string
    Name: string
    Email: string
    Role?: string
    [key: string]: unknown // Allow other Airtable fields
}

// Defining the columns array
export const columns: ColumnDef<LinguistRow>[] = [
    {
        accessorKey: 'availability',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    <FormattedMessage id="dashboard.availability" />
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: 'Picture',
        header: () => <FormattedMessage id="accountSettings.picture" />,
        cell: ({ row }) => {
            const pictureUrl = row.getValue('Picture') as string | undefined
            // Use a default placeholder if Picture is missing or invalid
            const src =
                pictureUrl &&
                typeof pictureUrl === 'string' &&
                pictureUrl.trim()
                    ? pictureUrl.trim()
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUI5QkE1Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDQuNSAxNS4xNyA0LjUgMTdWMTlIMTkuNVYxN0MxOS41IDE1LjE3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzlCOUJBNSIvPgo8L3N2Zz4K'

            return (
                <img
                    src={src}
                    alt="user profile avatar"
                    className="w-12 h-12 rounded-full object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        // Fallback to a simple data URI if the image fails to load
                        e.currentTarget.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUI5QkE1Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDQuNSAxNS4xNyA0LjUgMTdWMTlIMTkuNVYxN0MxOS41IDE1LjE3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzlCOUJBNSIvPgo8L3N2Zz4K'
                    }}
                />
            )
        },
    },
    {
        accessorKey: 'Name',
        header: () => <FormattedMessage id="dashboard.name" />,
    },
    {
        accessorKey: 'Email',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    <FormattedMessage id="dashboard.email" />
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
]

