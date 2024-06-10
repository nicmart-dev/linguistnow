import { FormattedMessage } from 'react-intl' // To show localized strings
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '../components/Button' // used for sorting

// Defining the columns array
export const columns = [
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
        // cell: ({ row }) => {
        //     const isAvailable = row.getValue('availability')
        //     const formatted = isAvailable[0].result ? (
        //         <FormattedMessage id="dashboard.available" />
        //     ) : (
        //         <FormattedMessage id="dashboard.notAvailable" />
        //     )

        //     return formatted
        // },
    },
    {
        accessorKey: 'Picture',
        header: () => <FormattedMessage id="accountSettings.picture" />,
        cell: ({ row }) => {
            return (
                <img
                    src={row.getValue('Picture')}
                    alt="user profile avatar"
                    className="w-12 h-12"
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