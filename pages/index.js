import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import {
  CalendarDays,
  Users,
  Megaphone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  Send,
} from 'lucide-react';
import { formatDate, formatTime } from '../lib/dates';

export default function Home() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpis();
  }, []);

  async function fetchKpis() {
    try {
      const res = await fetch('/api/kpis');
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    } finally {
      setLoading(false);
    }
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

  // Calculate derived KPIs
  const totalMes = kpis?.reservas?.mes || 0;
  const completadas = kpis?.reservas?.porEstado?.completada || 0;
  const canceladas = kpis?.reservas?.porEstado?.cancelada || 0;
  const noShow = kpis?.reservas?.porEstado?.no_show || 0;
  const tasaCompletado = totalMes > 0 ? Math.round((completadas / totalMes) * 100) : 0;
  const tasaCancelacion =
    totalMes > 0 ? Math.round(((canceladas + noShow) / totalMes) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Resumen general de tu negocio</p>
        </div>

        {/* KPI Grid - Row 1: Reservas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Reservas hoy"
            value={kpis?.reservas?.hoy || 0}
            subtitle="Confirmadas"
            icon={CalendarDays}
            color="brand"
          />
          <KpiCard
            title="Esta semana"
            value={kpis?.reservas?.semana || 0}
            subtitle="Total reservas"
            icon={Clock}
            color="purple"
          />
          <KpiCard
            title="Este mes"
            value={totalMes}
            subtitle="Total reservas del mes"
            icon={CalendarDays}
            color="yellow"
          />
          <KpiCard
            title="Contactos"
            value={kpis?.contactos?.activos || 0}
            subtitle={`${kpis?.contactos?.optInPromos || 0} aceptan promos`}
            icon={Users}
            color="green"
          />
        </div>

        {/* KPI Grid - Row 2: Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Tasa de asistencia"
            value={`${tasaCompletado}%`}
            subtitle="Reservas completadas"
            icon={TrendingUp}
            color="green"
          />
          <KpiCard
            title="Cancelaciones + No Show"
            value={`${tasaCancelacion}%`}
            subtitle={`${canceladas} canceladas · ${noShow} no show`}
            icon={Percent}
            color={tasaCancelacion > 20 ? 'red' : 'yellow'}
          />
          <KpiCard
            title="Promos enviadas"
            value={kpis?.promos?.enviadasMes || 0}
            subtitle={`${kpis?.promos?.promosUnicas || 0} promo(s) distintas`}
            icon={Send}
            color="purple"
          />
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reservas por estado */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Reservas del mes por estado
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: 'confirmada',
                  label: 'Confirmadas',
                  icon: CheckCircle,
                  color: 'text-emerald-500',
                },
                {
                  key: 'completada',
                  label: 'Completadas',
                  icon: CheckCircle,
                  color: 'text-blue-500',
                },
                {
                  key: 'cancelada',
                  label: 'Canceladas',
                  icon: XCircle,
                  color: 'text-red-500',
                },
                {
                  key: 'no_show',
                  label: 'No Show',
                  icon: AlertTriangle,
                  color: 'text-amber-500',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {kpis?.reservas?.porEstado?.[item.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas reservas de hoy */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Próximas reservas de hoy
            </h3>
            {kpis?.reservas?.proximasHoy?.length > 0 ? (
              <div className="space-y-3">
                {kpis.reservas.proximasHoy.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.nombre_cliente}</p>
                      <p className="text-xs text-gray-500">
                        {r.num_personas} persona{r.num_personas !== 1 ? 's' : ''}
                        {r.notas_especiales && ' · 📝 tiene notas'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-brand-600">{formatTime(r.hora)}</p>
                      <StatusBadge status={r.estado} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay reservas pendientes hoy
              </p>
            )}
          </div>
        </div>

        {/* Last promo */}
        {kpis?.ultimaPromo && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Última promoción enviada</p>
                <p className="text-sm font-medium text-gray-900">
                  {kpis.ultimaPromo.titulo} — {kpis.ultimaPromo.totalEnviados} envíos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
