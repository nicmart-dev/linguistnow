import { FormattedMessage } from 'react-intl' // To show localized strings

// Defining the columns array
export const columns = [
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
        header: () => <FormattedMessage id="accountSettings.name" />,
    },
    {
        accessorKey: 'Email',
        header: () => <FormattedMessage id="accountSettings.email" />,
    },
    {
        accessorKey: 'availability',
        header: () => (
            <div className="text-right">
                <FormattedMessage id="dashboard.availability" />
            </div>
        ),
        cell: ({ row }) => {
            console.log('Row:', row)
            const isAvailable = row.getValue('availability')
            const formatted = isAvailable[0].result ? (
                <FormattedMessage id="dashboard.available" />
            ) : (
                <FormattedMessage id="dashboard.notAvailable" />
            )

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
]
