// pages/api/configuracion/index.js
// ================================================
// CONFIGURACIÓN API — Read & update business config
// ================================================

import { tablas, fetchRecords, updateRecord } from '../../../lib/airtable';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'PATCH':
        return await handlePatch(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in /api/configuracion:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleGet(req, res) {
  // Fetch the first (and usually only) record from Configuracion_Negocio
  const records = await fetchRecords(tablas.configuracion, {
    maxRecords: 1,
  });

  if (!records || records.length === 0) {
    return res.status(404).json({ error: 'No se encontró configuración del negocio' });
  }

  return res.status(200).json(records[0]);
}

async function handlePatch(req, res) {
  const { id, ...fields } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  // Only allow updating specific fields
  const allowedFields = [
    'nombre_negocio',
    'horarios',
    'servicios',
    'telefono_whatsapp',
    'telefono_humano',
    'url_menu',
    'aceptan_reserva',
  ];

  const updateFields = {};
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updateFields[key] = fields[key];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
  }

  const record = await updateRecord(tablas.configuracion, id, updateFields);
  return res.status(200).json(record);
}
