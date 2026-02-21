// pages/contactos.js
// ================================================
// CONTACTOS PAGE — View, search, filter contacts
// Toggle opt-in promos, manage VIP tags
// ================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  Search,
  Users,
  Bell,
  BellOff,
  Star,
  StarOff,
  Phone,
  Calendar,
  MessageSquare,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDate } from '../lib/dates';

const FILTROS = {
  todos: 'Todos',
  activos: 'Activos',
  vip: 'VIP',
  opt_in: 'Aceptan promos',
  opt_out: 'No aceptan promos',
};

export default function Contactos() {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [updating, setUpdating] = useState(null); // track which contact is being updated
  const [sortField, setSortField] = useState('ultima_interaccion');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchContactos();
  }, []);

  async function fetchContactos() {
    setLoading(true);
    try {
      const res = await fetch('/api/contactos');
      const data = await res.json();
      setContactos(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOptIn(contacto) {
    setUpdating(contacto.id);
    try {
      const res = await fetch('/api/contactos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contacto.id,
          opt_in_promos: !contacto.opt_in_promos,
        }),
      });
      if (res.ok) {
        setContactos((prev) =>
          prev.map((c) =>
            c.id === contacto.id ? { ...c, opt_in_promos: !c.opt_in_promos } : c
          )
        );
        // Update selected contact if open
        if (selectedContacto?.id === contacto.id) {
          setSelectedContacto((prev) => ({
            ...prev,
            opt_in_promos: !prev.opt_in_promos,
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling opt-in:', err);
    } finally {
      setUpdating(null);
    }
  }

  async function toggleVIP(contacto) {
    setUpdating(contacto.id);
    const currentTags = contacto.tags || '';
    const isVIP = currentTags.toLowerCase().includes('vip');
    let newTags;

    if (isVIP) {
      // Remove VIP tag
      newTags = currentTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.toLowerCase() !== 'vip')
        .join(', ');
    } else {
      // Add VIP tag
      newTags = currentTags ? `${currentTags}, VIP` : 'VIP';
    }

    try {
      const res = await fetch('/api/contactos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contacto.id, tags: newTags }),
      });
      if (res.ok) {
        setContactos((prev) =>
          prev.map((c) => (c.id === contacto.id ? { ...c, tags: newTags } : c))
        );
        if (selectedContacto?.id === contacto.id) {
          setSelectedContacto((prev) => ({ ...prev, tags: newTags }));
        }
      }
    } catch (err) {
      console.error('Error toggling VIP:', err);
    } finally {
      setUpdating(null);
    }
  }

  async function updateNotas(contactoId, notas) {
    try {
      await fetch('/api/contactos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contactoId, notas }),
      });
      setContactos((prev) =>
        prev.map((c) => (c.id === contactoId ? { ...c, notas } : c))
      );
    } catch (err) {
      console.error('Error updating notas:', err);
    }
  }

  // Helper to check VIP
  function isVIP(contacto) {
    return (contacto.tags || '').toLowerCase().includes('vip');
  }

  // Filter & search
  const contactosFiltrados = contactos
    .filter((c) => {
      if (filtro === 'activos') return c.estado === 'activo';
      if (filtro === 'vip') return isVIP(c);
      if (filtro === 'opt_in') return c.opt_in_promos;
      if (filtro === 'opt_out') return !c.opt_in_promos;
      return true;
    })
    .filter((c) => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.telefono || '').includes(q) ||
        (c.tags || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  // Stats
  const stats = {
    total: contactos.length,
    activos: contactos.filter((c) => c.estado === 'activo').length,
    vip: contactos.filter((c) => isVIP(c)).length,
    optIn: contactos.filter((c) => c.opt_in_promos).length,
  };

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contactos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tus contactos y sus preferencias de comunicación
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Total" value={stats.total} />
          <MiniStat label="Activos" value={stats.activos} color="green" />
          <MiniStat label="VIP" value={stats.vip} color="yellow" />
          <MiniStat label="Aceptan promos" value={stats.optIn} color="purple" />
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Buscar por nombre, teléfono o tag..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(FILTROS).map(([key, label]) => (
              <button
                key={key}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  filtro === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setFiltro(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
            </div>
          ) : contactosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500 mt-3">No se encontraron contactos</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('nombre')}
                    >
                      Contacto <SortIcon field="nombre" />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Teléfono
                    </th>
                    <th
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('total_reservas')}
                    >
                      Reservas <SortIcon field="total_reservas" />
                    </th>
                    <th
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('ultima_interaccion')}
                    >
                      Última interacción <SortIcon field="ultima_interaccion" />
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      VIP
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Promos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contactosFiltrados.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedContacto(c)}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isVIP(c)
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {(c.nombre || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {c.nombre || 'Sin nombre'}
                              {isVIP(c) && (
                                <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  ⭐ VIP
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 md:hidden">{c.telefono}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600">{c.telefono}</p>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-600">{c.total_reservas || 0}</p>
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell">
                        <p className="text-sm text-gray-500">
                          {c.ultima_interaccion ? formatDate(c.ultima_interaccion) : '—'}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVIP(c);
                          }}
                          disabled={updating === c.id}
                          className={`p-1.5 rounded-lg transition-all ${
                            isVIP(c)
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-gray-300 hover:bg-gray-100 hover:text-gray-400'
                          }`}
                          title={isVIP(c) ? 'Quitar VIP' : 'Marcar como VIP'}
                        >
                          {isVIP(c) ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOptIn(c);
                          }}
                          disabled={updating === c.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                            c.opt_in_promos
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={
                            c.opt_in_promos
                              ? 'Desactivar promociones'
                              : 'Activar promociones'
                          }
                        >
                          {c.opt_in_promos ? (
                            <>
                              <Bell className="h-3 w-3" />
                              Sí
                            </>
                          ) : (
                            <>
                              <BellOff className="h-3 w-3" />
                              No
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && contactosFiltrados.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Mostrando {contactosFiltrados.length} de {contactos.length} contactos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContacto && (
        <ContactoDetail
          contacto={selectedContacto}
          onClose={() => setSelectedContacto(null)}
          onToggleOptIn={toggleOptIn}
          onToggleVIP={toggleVIP}
          onUpdateNotas={updateNotas}
          isVIP={isVIP(selectedContacto)}
          updating={updating}
        />
      )}
    </Layout>
  );
}

/* ─── Mini stat card ─── */
function MiniStat({ label, value, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color] || colorMap.brand}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

/* ─── Contact Detail Modal ─── */
function ContactoDetail({
  contacto,
  onClose,
  onToggleOptIn,
  onToggleVIP,
  onUpdateNotas,
  isVIP: contactoIsVIP,
  updating,
}) {
  const [notas, setNotas] = useState(contacto.notas || '');
  const [notasChanged, setNotasChanged] = useState(false);
  const [savingNotas, setSavingNotas] = useState(false);

  function handleNotasChange(e) {
    setNotas(e.target.value);
    setNotasChanged(true);
  }

  async function handleSaveNotas() {
    setSavingNotas(true);
    await onUpdateNotas(contacto.id, notas);
    setNotasChanged(false);
    setSavingNotas(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                contactoIsVIP
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {(contacto.nombre || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {contacto.nombre || 'Sin nombre'}
              </h3>
              <p className="text-xs text-gray-500">{contacto.telefono}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info rows */}
        <div className="space-y-3 mb-5">
          <DetailRow
            icon={Phone}
            label="Teléfono"
            value={contacto.telefono || '—'}
          />
          <DetailRow
            icon={Calendar}
            label="Primera interacción"
            value={contacto.primera_interaccion ? formatDate(contacto.primera_interaccion) : '—'}
          />
          <DetailRow
            icon={Calendar}
            label="Última interacción"
            value={contacto.ultima_interaccion ? formatDate(contacto.ultima_interaccion) : '—'}
          />
          <DetailRow
            icon={MessageSquare}
            label="Total reservas"
            value={contacto.total_reservas || 0}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                contacto.estado === 'activo'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {contacto.estado || 'desconocido'}
            </span>
          </div>
          {contacto.tags && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tags</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {contacto.tags.split(',').map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-gray-100 pt-4 mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Preferencias
          </h4>

          {/* Opt-in toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Recibir promociones</p>
              <p className="text-xs text-gray-400">
                {contacto.opt_in_promos
                  ? 'Este contacto recibirá tus promos por WhatsApp'
                  : 'Este contacto NO recibirá promos'}
              </p>
            </div>
            <Toggle
              enabled={contacto.opt_in_promos}
              onChange={() => onToggleOptIn(contacto)}
              disabled={updating === contacto.id}
            />
          </div>

          {/* VIP toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Cliente VIP</p>
              <p className="text-xs text-gray-400">
                {contactoIsVIP
                  ? 'Marcado como cliente especial'
                  : 'Marcar para trato preferencial'}
              </p>
            </div>
            <Toggle
              enabled={contactoIsVIP}
              onChange={() => onToggleVIP(contacto)}
              disabled={updating === contacto.id}
              color="amber"
            />
          </div>
        </div>

        {/* Notas */}
        <div className="border-t border-gray-100 pt-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Notas internas
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="Agrega notas sobre este contacto..."
            value={notas}
            onChange={handleNotasChange}
          />
          {notasChanged && (
            <button
              className="btn-primary text-sm mt-2 w-full"
              onClick={handleSaveNotas}
              disabled={savingNotas}
            >
              {savingNotas ? 'Guardando...' : 'Guardar notas'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable detail row ─── */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

/* ─── Toggle component ─── */
function Toggle({ enabled, onChange, disabled, color = 'brand' }) {
  const bgColor = enabled
    ? color === 'amber'
      ? 'bg-amber-500'
      : 'bg-brand-600'
    : 'bg-gray-200';

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${bgColor} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
