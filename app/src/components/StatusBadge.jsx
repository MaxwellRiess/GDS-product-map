const STATUS_STYLES = {
  live:       'bg-gds-green-light text-gds-green',
  beta:       'bg-gds-orange-light text-orange-800',
  alpha:      'bg-gds-purple-light text-gds-purple',
  discovery:  'bg-blue-100 text-gds-blue-dark',
  deprecated: 'bg-gds-red-light text-gds-red',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`status-badge ${style}`}>
      {status}
    </span>
  )
}
