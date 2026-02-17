import { tablas, fetchRecords, createRecord, updateRecord } from '../../../lib/airtable';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PATCH':
        return await handlePatch(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in /api/reservas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleGet(req, res) {
  const { fecha, estado, mes, año } = req.query;

  let filter = '';
  const conditions = [];

  if (fecha) {
    conditions.push(`{fecha} = '${fecha}'`);
  }

  if (estado && estado !== 'todas') {
    conditions.push(`{estado} = '${estado}'`);
  }

  if (mes && año) {
    const monthStart = `${año}-${String(mes).padStart(2, '0')}-01`;
    const nextMonth = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
    const nextYear = parseInt(mes) === 12 ? parseInt(año) + 1 : parseInt(año);
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    conditions.push(`IS_AFTER({fecha}, '${monthStart}')`);
    conditions.push(`IS_BEFORE({fecha}, '${monthEnd}')`);
  }

  if (conditions.length > 0) {
    filter = conditions.length === 1 ? conditions[0] : `AND(${conditions.join(',')})`;
  }

  const reservas = await fetchRecords(tablas.reservas, {
    filter,
    sort: [
      { field: 'fecha', direction: 'asc' },
      { field: 'hora', direction: 'asc' },
    ],
  });

  return res.status(200).json(reservas);
}

async function handlePost(req, res) {
  const { nombre_cliente, telefono, fecha, hora, num_personas, notas_especiales } = req.body;

  if (!nombre_cliente || !fecha || !hora) {
    return res.status(400).json({ error: 'Nombre, fecha y hora son requeridos' });
  }

  const record = await createRecord(tablas.reservas, {
    nombre_cliente,
    telefono: telefono || '',
    fecha,
    hora,
    num_personas: parseInt(num_personas) || 2,
    notas_especiales: notas_especiales || '',
    estado: 'confirmada',
    creada_por: 'dashboard',
  });

  return res.status(201).json(record);
}

async function handlePatch(req, res) {
  const { id, ...fields } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  // Only allow updating specific fields
  const allowedFields = ['estado', 'nombre_cliente', 'fecha', 'hora', 'num_personas', 'notas_especiales'];
  const updateFields = {};

  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updateFields[key] = fields[key];
    }
  }

  const record = await updateRecord(tablas.reservas, id, updateFields);
  return res.status(200).json(record);
}
