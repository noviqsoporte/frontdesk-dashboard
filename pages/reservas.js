import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Calendar from '../components/Calendar';
import ReservaForm from '../components/ReservaForm';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Eye } from 'lucide-react';
import { formatDate, formatTime, toISODate } from '../lib/dates';

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set('fecha', selectedDate);
      if (filtroEstado !== 'todas') params.set('estado', filtroEstado);
      params.set('mes', String(currentMonth.getMonth() + 1));
      params.set('año', String(currentMonth.getFullYear()));

      const res = await fetch(`/api/reservas?${params}`);
      const data = await res.json();
      setReservas(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filtroEstado, currentMonth]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  async function crearReserva(data) {
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    fetchReservas();
  }

  async function cambiarEstado(id, nuevoEstado) {
    await fetch('/api/reservas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: nuevoEstado }),
    });
    fetchReservas();
  }

  const reservasFiltradas = busqueda
    ? reservas.filter(
        (r) =>
          r.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.telefono?.includes(busqueda)
      )
    : reservas;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reservas</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDate ? formatDate(selectedDate) : 'Todas las reservas del mes'}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Calendar
              reservas={reservas}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(selectedDate === date ? null : date)}
            />
          </div>

          {/* Reservas table */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="Buscar por nombre o teléfono..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <select
                  className="select w-auto"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todas">Todos los estados</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                  <option value="no_show">No Show</option>
                </select>
                {selectedDate && (
                  <button className="btn-ghost text-xs" onClick={() => setSelectedDate(null)}>
                    Limpiar fecha
                  </button>
                )}
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
                </div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-3">No hay reservas</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                          Cliente
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">
                          Fecha
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                          Hora
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                          Personas
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                          Estado
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reservasFiltradas.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedReserva(r)}
                        >
                          <td className="px-6 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {r.nombre_cliente}
                              {r.notas_especiales && (
                                <span
                                  className="ml-1.5 inline-block text-amber-500 text-xs"
                                  title={r.notas_especiales}
                                >
                                  📝
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 sm:hidden">{r.fecha}</p>
                          </td>
                          <td className="px-6 py-3 hidden sm:table-cell">
                            <p className="text-sm text-gray-600">{r.fecha}</p>
                          </td>
                          <td className="px-6 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {formatTime(r.hora)}
                            </p>
                          </td>
                          <td className="px-6 py-3 hidden md:table-cell">
                            <p className="text-sm text-gray-600">{r.num_personas}</p>
                          </td>
                          <td className="px-6 py-3">
                            <StatusBadge status={r.estado} />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="btn-ghost text-xs text-brand-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReserva(r);
                                }}
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {r.estado !== 'confirmada' && (
                                <button
                                  className="btn-ghost text-xs text-brand-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cambiarEstado(r.id, 'confirmada');
                                  }}
                                  title="Confirmar"
                                >
                                  ↩
                                </button>
                              )}
                              {r.estado !== 'completada' && (
                                <button
                                  className="btn-ghost text-xs text-emerald-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cambiarEstado(r.id, 'completada');
                                  }}
                                  title="Marcar completada"
                                >
                                  ✓
                                </button>
                              )}
                              {r.estado !== 'cancelada' && (
                                <button
                                  className="btn-ghost text-xs text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cambiarEstado(r.id, 'cancelada');
                                  }}
                                  title="Cancelar"
                                >
                                  ✗
                                </button>
                              )}
                              {r.estado !== 'no_show' && (
                                <button
                                  className="btn-ghost text-xs text-amber-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cambiarEstado(r.id, 'no_show');
                                  }}
                                  title="No Show"
                                >
                                  NS
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <ReservaForm
          onSubmit={crearReserva}
          onClose={() => setShowForm(false)}
          initialDate={selectedDate || toISODate(new Date())}
        />
      )}

      {selectedReserva && (
        <ReservaDetail
          reserva={selectedReserva}
          onClose={() => setSelectedReserva(null)}
          onCambiarEstado={(id, estado) => {
            cambiarEstado(id, estado);
            setSelectedReserva(null);
          }}
        />
      )}
    </Layout>
  );
}

/* ─── Reservation Detail Modal ─── */
function ReservaDetail({ reserva, onClose, onCambiarEstado }) {
  if (!reserva) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Reserva</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <DetailRow label="Cliente" value={reserva.nombre_cliente} />
          <DetailRow label="Teléfono" value={reserva.telefono || '—'} />
          <DetailRow label="Fecha" value={formatDate(reserva.fecha)} />
          <DetailRow label="Hora" value={formatTime(reserva.hora)} />
          <DetailRow label="Personas" value={reserva.num_personas} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado</span>
            <StatusBadge status={reserva.estado} />
          </div>

          {reserva.notas_especiales && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Notas especiales</p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-900 whitespace-pre-wrap">
                  {reserva.notas_especiales}
                </p>
              </div>
            </div>
          )}

          {reserva.creada_por && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Creada por: <span className="text-gray-600">{reserva.creada_por}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
          {reserva.estado !== 'confirmada' && (
            <button
              className="btn-secondary flex-1 text-sm"
              onClick={() => onCambiarEstado(reserva.id, 'confirmada')}
            >
              ↩ Confirmar
            </button>
          )}
          {reserva.estado !== 'completada' && (
            <button
              className="btn-primary flex-1 text-sm"
              onClick={() => onCambiarEstado(reserva.id, 'completada')}
            >
              ✓ Completada
            </button>
          )}
          {reserva.estado !== 'cancelada' && (
            <button
              className="btn-danger flex-1 text-sm"
              onClick={() => onCambiarEstado(reserva.id, 'cancelada')}
            >
              ✗ Cancelar
            </button>
          )}
          {reserva.estado !== 'no_show' && (
            <button
              className="btn-secondary flex-1 text-sm"
              onClick={() => onCambiarEstado(reserva.id, 'no_show')}
            >
              No Show
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
