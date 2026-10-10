/** One headline number with a label and a short explanation. */
export function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card stat-tile">
      <span className="stat-tile__label">{label}</span>
      <span className="stat-tile__value">{value}</span>
      <span className="stat-tile__sub">{sub}</span>
    </div>
  )
}
