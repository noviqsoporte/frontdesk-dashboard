const statusConfig = {
  // Reservas
  confirmada: { label: 'Confirmada', className: 'badge-green' },
  cancelada: { label: 'Cancelada', className: 'badge-red' },
  completada: { label: 'Completada', className: 'badge-blue' },
  no_show: { label: 'No Show', className: 'badge-yellow' },
  // Promos
  borrador: { label: 'Borrador', className: 'badge-gray' },
  programada: { label: 'Programada', className: 'badge-purple' },
  enviando: { label: 'Enviando...', className: 'badge-yellow' },
  enviada: { label: 'Enviada', className: 'badge-green' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray' };
  return <span className={config.className}>{config.label}</span>;
}
