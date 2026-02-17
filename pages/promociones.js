// pages/promociones.js
// ================================================
// PROMOCIONES PAGE — List, create & send promos
// ================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PromoForm from '../components/PromoForm';
import StatusBadge from '../components/StatusBadge';
import { Plus, Send, Users, Clock, Image } from 'lucide-react';
import { formatDate } from '../lib/dates';

// Correct plural labels for Spanish
const filtroLabels = {
  todas: 'Todas',
  borrador: 'Borradores',
  programada: 'Programadas',
  enviada: 'Enviadas',
};

export default function Promociones() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [sending, setSending] = useState(null);

  useEffect(() => {
    fetchPromos();
  }, [filtro]);

  async function fetchPromos() {
    setLoading(true);
    try {
      const params = filtro !== 'todas' ? `?estado=${filtro}` : '';
      const res = await fetch(`/api/promociones${params}`);
      const data = await res.json();
      setPromos(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function crearPromo(data, mode) {
    const res = await fetch('/api/promociones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error creating promo');
    const promo = await res.json();

    if (mode === 'ahora') {
      await fetch('/api/promociones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, estado: 'programada' }),
      });

      await fetch('/api/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar', promo_id: promo.id }),
      });
    }

    fetchPromos();
  }

  async function enviarPromo(promoId) {
    setSending(promoId);
    try {
      // Find the promo to check its current estado
      const promo = promos.find((p) => p.id === promoId);

      // Only change estado to programada if it's not already enviada
      if (promo && promo.estado !== 'enviada') {
        await fetch('/api/promociones', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: promoId, estado: 'programada' }),
        });
      }

      const res = await fetch('/api/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar', promo_id: promoId }),
      });
      const result = await res.json();

      if (result.success) {
        fetchPromos();
      } else {
        alert('Error al enviar la promoción');
      }
    } catch (err) {
      alert('Error al enviar');
    } finally {
      setSending(null);
    }
  }

  const audienciaLabel = {
    todos: 'Todos',
    vip: 'VIP',
    recientes: 'Recientes',
    custom: 'Custom',
  };

  // Helper to get image URL from promo
  function getPromoImageUrl(promo) {
    // 1. Check imagen_url field first (our imgbb upload flow)
    if (promo.imagen_url && typeof promo.imagen_url === 'string' && promo.imagen_url.startsWith('http')) {
      return promo.imagen_url;
    }
    // 2. Airtable attachment array (legacy/fallback)
    if (promo.imagen && Array.isArray(promo.imagen) && promo.imagen.length > 0) {
      return promo.imagen[0].url || promo.imagen[0].thumbnails?.large?.url || null;
    }
    // 3. Direct URL string in imagen field
    if (promo.imagen && typeof promo.imagen === 'string' && promo.imagen.startsWith('http')) {
      return promo.imagen;
    }
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Promociones</h2>
            <p className="text-sm text-gray-500 mt-1">Crea y envía promociones a tus clientes</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nueva Promoción
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(filtroLabels).map((estado) => (
            <button
              key={estado}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filtro === estado
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setFiltro(estado)}
            >
              {filtroLabels[estado]}
            </button>
          ))}
        </div>

        {/* Promos list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : promos.length === 0 ? (
          <div className="card text-center py-12">
            <MegaphoneIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500 mt-3">No hay promociones</p>
            <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>
              Crear primera promoción
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {promos.map((promo) => {
              const imageUrl = getPromoImageUrl(promo);

              return (
                <div key={promo.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Image thumbnail */}
                    {imageUrl && (
                      <div className="shrink-0">
                        <img
                          src={imageUrl}
                          alt={promo.titulo}
                          className="w-full sm:w-20 sm:h-20 h-32 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{promo.titulo}</h3>
                        <StatusBadge status={promo.estado} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{promo.mensaje}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {audienciaLabel[promo.audiencia] || promo.audiencia}
                        </span>
                        {imageUrl && (
                          <span className="flex items-center gap-1">
                            <Image className="h-3.5 w-3.5" />
                            Con imagen
                          </span>
                        )}
                        {promo.total_enviados > 0 && (
                          <span className="flex items-center gap-1">
                            <Send className="h-3.5 w-3.5" />
                            {promo.total_enviados} enviados
                          </span>
                        )}
                        {promo.fecha_envio_programada && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(promo.fecha_envio_programada)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(promo.estado === 'borrador' || promo.estado === 'programada') && (
                        <button
                          className="btn-primary text-sm"
                          onClick={() => enviarPromo(promo.id)}
                          disabled={sending === promo.id}
                        >
                          {sending === promo.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Enviar
                            </>
                          )}
                        </button>
                      )}
                      {promo.estado === 'enviada' && (
                        <button
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                          onClick={() => enviarPromo(promo.id)}
                          disabled={sending === promo.id}
                        >
                          {sending === promo.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Reenviar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <PromoForm onSubmit={crearPromo} onClose={() => setShowForm(false)} />}
    </Layout>
  );
}

function MegaphoneIcon({ className }) {
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
        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
      />
    </svg>
  );
}
