export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}
      className="animate-spin rounded-full border-2 border-mist border-t-forest mx-auto" />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  )
}
