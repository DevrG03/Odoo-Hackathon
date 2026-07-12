import { type ReactNode } from 'react'

export interface Column<T> {
  header: string
  accessor: keyof T | string
  render?: (row: T) => ReactNode
  numeric?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, data, emptyMessage = 'No records found.', onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.accessor)}
                className="text-left text-[10px] font-semibold uppercase tracking-[0.6px] text-sage px-3 pb-2.5 border-b border-mist">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-sage">{emptyMessage}</td></tr>
          ) : data.map((row, i) => (
            <tr key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-dew hover:bg-dew transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
              {columns.map((col, j) => (
                <td key={String(col.accessor)}
                  className={`px-3 py-2.5 ${j === 0 ? 'font-medium text-charcoal' : 'text-[#3d5248]'} ${col.numeric ? 'tabular-nums' : ''}`}>
                  {col.render ? col.render(row) : String(row[col.accessor as keyof T] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
