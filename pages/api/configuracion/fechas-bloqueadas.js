// pages/api/configuracion/fechas-bloqueadas.js
// ================================================
// FECHAS BLOQUEADAS API — CRUD for blocked dates
// ================================================

import { tablas, fetchRecords, createRecord, deleteRecord } from '../../../lib/airtable';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in /api/configuracion/fechas-bloqueadas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleGet(req, res) {
  const records = await fetchRecords(tablas.fechas_bloqueadas, {
    sort: [{ field: 'fecha', direction: 'asc' }],
  });

  return res.status(200).json(records);
}

async function handlePost(req, res) {
  const { fecha, motivo } = req.body;

  if (!fecha) {
    return res.status(400).json({ error: 'Fecha es requerida' });
  }

  const fields = {
    fecha,
    motivo: motivo || '',
  };

  const record = await createRecord(tablas.fechas_bloqueadas, fields);
  return res.status(201).json(record);
}

async function handleDelete(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  await deleteRecord(tablas.fechas_bloqueadas, id);
  return res.status(200).json({ success: true });
}
