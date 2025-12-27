import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from './Table'

describe('Table', () => {
    it('renders table element', () => {
        render(
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Content</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
        const table = screen.getByRole('table')
        expect(table).toBeDefined()
    })

    it('applies custom className to Table', () => {
        const { container } = render(
            <Table className="custom-table">
                <TableBody>
                    <TableRow>
                        <TableCell>Content</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
        const table = container.querySelector('table')
        expect(table?.className).toContain('custom-table')
    })

    it('renders TableHeader with rows', () => {
        render(
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Header</TableHead>
                    </TableRow>
                </TableHeader>
            </Table>
        )
        const header = screen.getByRole('columnheader', { name: 'Header' })
        expect(header).toBeDefined()
    })

    it('renders TableBody with cells', () => {
        render(
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Cell Content</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
        const cell = screen.getByRole('cell', { name: 'Cell Content' })
        expect(cell).toBeDefined()
    })

    it('renders TableFooter', () => {
        render(
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Content</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Footer</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        )
        const footer = screen.getByText('Footer')
        expect(footer).toBeDefined()
    })

    it('renders TableCaption', () => {
        render(
            <Table>
                <TableCaption>Table description</TableCaption>
                <TableBody>
                    <TableRow>
                        <TableCell>Content</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
        const caption = screen.getByText('Table description')
        expect(caption).toBeDefined()
    })

    it('forwards ref to Table', () => {
        const ref = { current: null }
        render(
            <Table ref={ref}>
                <TableBody>
                    <TableRow>
                        <TableCell>Content</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
        expect(ref.current).toBeInstanceOf(HTMLTableElement)
    })
})
