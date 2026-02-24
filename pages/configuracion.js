// pages/configuracion.js
// ================================================
// CONFIGURACIÓN PAGE — Business settings
// ================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  Settings,
  Save,
  Phone,
  Clock,
  Globe,
  CalendarOff,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function Configuracion() {
  const [config, setConfig] = useState(null);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Blocked date form
  const [newFecha, setNewFecha] = useState('');
  const [newMotivo, setNewMotivo] = useState('');
  const [addingFecha, setAddingFecha] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [configRes, fechasRes] = await Promise.all([
        fetch('/api/configuracion'),
        fetch('/api/configuracion/fechas-bloqueadas'),
      ]);
      const configData = await configRes.json();
      const fechasData = await fechasRes.json();
      setConfig(configData);
      setFechasBloqueadas(fechasData);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: config.id,
          nombre_negocio: config.nombre_negocio,
          horarios: config.horarios,
          servicios: config.servicios,
          telefono_whatsapp: config.telefono_whatsapp,
          telefono_humano: config.telefono_humano,
          url_menu: config.url_menu,
          aceptan_reserva: config.aceptan_reserva,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  async function addFechaBloqueada() {
    if (!newFecha) return;
    setAddingFecha(true);
    try {
      const res = await fetch('/api/configuracion/fechas-bloqueadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: newFecha, motivo: newMotivo }),
      });
      if (!res.ok) throw new Error('Error');
      const record = await res.json();
      setFechasBloqueadas([...fechasBloqueadas, record].sort((a, b) => a.fecha?.localeCompare(b.fecha)));
      setNewFecha('');
      setNewMotivo('');
    } catch (err) {
      alert('Error al agregar fecha bloqueada');
    } finally {
      setAddingFecha(false);
    }
  }

  async function removeFechaBloqueada(id) {
    try {
      await fetch('/api/configuracion/fechas-bloqueadas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setFechasBloqueadas(fechasBloqueadas.filter((f) => f.id !== id));
    } catch (err) {
      alert('Error al eliminar');
    }
  }

  function updateField(field, value) {
    setConfig({ ...config, [field]: value });
    setSaved(false);
  }

  // Format date for display
  function formatFecha(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Check if a blocked date is in the past
  function isPast(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T12:00:00');
    return d < today;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </Layout>
    );
  }

  if (error && !config) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-gray-600">{error}</p>
          <button className="btn-primary text-sm" onClick={fetchData}>
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  // Split blocked dates into upcoming and past
  const fechasUpcoming = fechasBloqueadas.filter((f) => !isPast(f.fecha));
  const fechasPast = fechasBloqueadas.filter((f) => isPast(f.fecha));

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
            <p className="text-sm text-gray-500 mt-1">Ajustes generales de tu negocio</p>
          </div>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>

        {/* Success/Error alerts */}
        {saved && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700">Cambios guardados correctamente</p>
          </div>
        )}
        {error && config && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ─── Información Básica ─── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-lg bg-brand-50 p-2">
              <Settings className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Información del Negocio</h3>
              <p className="text-xs text-gray-500">Datos básicos que usa el recepcionista virtual</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="label">Nombre del negocio</label>
              <input
                type="text"
                className="input"
                value={config?.nombre_negocio || ''}
                onChange={(e) => updateField('nombre_negocio', e.target.value)}
                placeholder="El Mesón del Molino"
              />
            </div>

            {/* Horarios */}
            <div>
              <label className="label">Horarios</label>
              <textarea
                className="input"
                rows={3}
                value={config?.horarios || ''}
                onChange={(e) => updateField('horarios', e.target.value)}
                placeholder="Lunes a Viernes: 8:00 AM - 10:00 PM&#10;Sábado y Domingo: 9:00 AM - 11:00 PM"
              />
              <p className="text-xs text-gray-400 mt-1">
                El recepcionista virtual usa esta info para responder a los clientes
              </p>
            </div>

            {/* Servicios */}
            <div>
              <label className="label">Servicios / Descripción</label>
              <textarea
                className="input"
                rows={2}
                value={config?.servicios || ''}
                onChange={(e) => updateField('servicios', e.target.value)}
                placeholder="Espacio cálido con comida tradicional mexicana..."
              />
            </div>

            {/* Teléfonos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Phone className="inline h-3.5 w-3.5 mr-1" />
                  WhatsApp del bot
                </label>
                <input
                  type="text"
                  className="input"
                  value={config?.telefono_whatsapp || ''}
                  onChange={(e) => updateField('telefono_whatsapp', e.target.value)}
                  placeholder="525573898570"
                />
              </div>
              <div>
                <label className="label">
                  <Phone className="inline h-3.5 w-3.5 mr-1" />
                  Teléfono humano
                </label>
                <input
                  type="text"
                  className="input"
                  value={config?.telefono_humano || ''}
                  onChange={(e) => updateField('telefono_humano', e.target.value)}
                  placeholder="5215579701379"
                />
              </div>
            </div>

            {/* URL Menú */}
            <div>
              <label className="label">
                <Globe className="inline h-3.5 w-3.5 mr-1" />
                URL del menú
              </label>
              <input
                type="url"
                className="input"
                value={config?.url_menu || ''}
                onChange={(e) => updateField('url_menu', e.target.value)}
                placeholder="https://ejemplo.com/menu"
              />
            </div>
          </div>
        </div>

        {/* ─── Reservas Toggle ─── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-lg bg-emerald-50 p-2">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Reservas</h3>
              <p className="text-xs text-gray-500">Controla si el bot acepta reservas</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Aceptar reservas</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {config?.aceptan_reserva
                  ? 'El bot está aceptando reservas de clientes'
                  : 'El bot NO está aceptando reservas actualmente'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!config?.aceptan_reserva}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                config?.aceptan_reserva ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
              onClick={() => updateField('aceptan_reserva', !config?.aceptan_reserva)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config?.aceptan_reserva ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!config?.aceptan_reserva && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Las reservas están desactivadas. El bot informará a los clientes que no se aceptan reservas por el momento.
              </p>
            </div>
          )}
        </div>

        {/* ─── Fechas Bloqueadas ─── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-lg bg-red-50 p-2">
              <CalendarOff className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Fechas Bloqueadas</h3>
              <p className="text-xs text-gray-500">
                Días específicos en los que no se aceptan reservas (festivos, eventos privados, etc.)
              </p>
            </div>
          </div>

          {/* Add new blocked date */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="date"
              className="input sm:w-44"
              value={newFecha}
              onChange={(e) => setNewFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              type="text"
              className="input flex-1"
              placeholder="Motivo (ej: Navidad, Evento privado...)"
              value={newMotivo}
              onChange={(e) => setNewMotivo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFechaBloqueada()}
            />
            <button
              className="btn-primary shrink-0"
              onClick={addFechaBloqueada}
              disabled={!newFecha || addingFecha}
            >
              {addingFecha ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Agregar
            </button>
          </div>

          {/* Upcoming blocked dates */}
          {fechasUpcoming.length > 0 ? (
            <div className="space-y-2">
              {fechasUpcoming.map((fecha) => (
                <div
                  key={fecha.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-50 p-1.5">
                      <CalendarOff className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatFecha(fecha.fecha)}
                      </p>
                      {fecha.motivo && (
                        <p className="text-xs text-gray-500">{fecha.motivo}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => removeFechaBloqueada(fecha.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-200">
              <CalendarOff className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400 mt-2">No hay fechas bloqueadas próximas</p>
              <p className="text-xs text-gray-400 mt-1">
                Agrega días festivos o especiales donde no aceptes reservas
              </p>
            </div>
          )}

          {/* Past blocked dates (collapsed) */}
          {fechasPast.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">
                {fechasPast.length} fecha{fechasPast.length !== 1 ? 's' : ''} pasada{fechasPast.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {fechasPast.map((fecha) => (
                  <div
                    key={fecha.id}
                    className="flex items-center justify-between rounded-lg px-4 py-2 opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-500">
                        {formatFecha(fecha.fecha)}
                        {fecha.motivo && ` — ${fecha.motivo}`}
                      </p>
                    </div>
                    <button
                      className="rounded-lg p-1 text-gray-300 hover:text-red-400 transition-colors"
                      onClick={() => removeFechaBloqueada(fecha.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
