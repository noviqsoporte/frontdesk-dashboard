import { tablas, fetchRecords } from '../../../lib/airtable';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { TZDate } from 'date-fns-tz';

const TIMEZONE = 'America/Mexico_City';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new TZDate(new Date(), TIMEZONE);
    const hoy = format(now, 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    // Fetch all reservas del mes
    const reservas = await fetchRecords(tablas.reservas, {
      filter: `AND(IS_AFTER({fecha}, '${monthStart}'), IS_BEFORE({fecha}, '${monthEnd}'))`,
    });

    // Calcular KPIs de reservas
    const reservasHoy = reservas.filter((r) => r.fecha === hoy);
    const reservasSemana = reservas.filter((r) => r.fecha >= weekStart && r.fecha <= weekEnd);
    const reservasMes = reservas;

    const porEstado = {
      confirmada: reservas.filter((r) => r.estado === 'confirmada').length,
      cancelada: reservas.filter((r) => r.estado === 'cancelada').length,
      completada: reservas.filter((r) => r.estado === 'completada').length,
      no_show: reservas.filter((r) => r.estado === 'no_show').length,
    };

    // Contactos
    const contactos = await fetchRecords(tablas.contactos, {
      fields: ['telefono', 'estado', 'opt_in_promos'],
    });

    const contactosActivos = contactos.filter((c) => c.estado === 'activo').length;
    const contactosOptIn = contactos.filter((c) => c.opt_in_promos).length;

    // Promociones: contar envíos reales desde el Log
    const logEnvios = await fetchRecords(tablas.logPromos, {
      filter: `AND({estado_envio} = 'enviado', IS_AFTER({fecha_envio}, '${monthStart}'), IS_BEFORE({fecha_envio}, '${monthEnd}'))`,
    });

    // Promos únicas enviadas este mes (handle linked records which come as arrays)
    const promosUnicas = new Set(logEnvios.map((log) => {
      const promo = log.promocion;
      // Airtable linked records come as arrays
      if (Array.isArray(promo)) return promo[0] || '';
      return promo || log.titulo || '';
    }));

    // Última promoción enviada
    const ultimaPromoArr = await fetchRecords(tablas.promociones, {
      filter: "{estado} = 'enviada'",
      sort: [{ field: 'fecha_creacion', direction: 'desc' }],
      maxRecords: 1,
    });

    const ultimaPromo = ultimaPromoArr.length > 0 ? ultimaPromoArr[0] : null;

    return res.status(200).json({
      reservas: {
        hoy: reservasHoy.length,
        semana: reservasSemana.length,
        mes: reservasMes.length,
        porEstado,
        proximasHoy: reservasHoy
          .filter((r) => r.estado === 'confirmada')
          .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
          .slice(0, 5),
      },
      contactos: {
        total: contactos.length,
        activos: contactosActivos,
        optInPromos: contactosOptIn,
      },
      promos: {
        enviadasMes: logEnvios.length,
        totalEnviosMes: logEnvios.length,
        promosUnicas: promosUnicas.size,
      },
      ultimaPromo: ultimaPromo
        ? {
            titulo: ultimaPromo.titulo,
            totalEnviados: ultimaPromo.total_enviados || 0,
            fecha: ultimaPromo.fecha_creacion,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return res.status(500).json({ error: 'Error al obtener KPIs' });
  }
}
