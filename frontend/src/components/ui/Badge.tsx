
const styles: Record<string, string> = {
  pending:      'bg-yellow-100 text-yellow-800',
  approved:     'bg-green-100 text-green-800',
  rejected:     'bg-red-100 text-red-800',
  draft:        'bg-dew text-forest border border-mist',
  active:       'bg-green-100 text-green-800',
  under_review: 'bg-blue-100 text-blue-800',
  completed:    'bg-indigo-100 text-indigo-800',
  archived:     'bg-dew text-sage',
  critical:     'bg-rose-100 text-rose-800',
  high:         'bg-red-100 text-red-800',
  medium:       'bg-yellow-100 text-yellow-800',
  low:          'bg-green-100 text-green-800',
  overdue:      'bg-orange-100 text-orange-800',
  open:         'bg-blue-100 text-blue-800',
  resolved:     'bg-green-100 text-green-800',
  planned:      'bg-dew text-forest border border-mist',
  in_progress:  'bg-blue-100 text-blue-800',
}

export function Badge({ value }: { value: string }) {
  const key = value.toLowerCase().replace(/\s+/g, '_')
  const cls = styles[key] ?? 'bg-dew text-sage'
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-medium whitespace-nowrap ${cls}`}>
      {value}
    </span>
  )
}
