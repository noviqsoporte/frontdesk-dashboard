// pages/api/promociones/index.js
// ================================================
// PROMOCIONES API — Create, list, update & send
// ================================================

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
    console.error('Error in /api/promociones:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleGet(req, res) {
  const { estado } = req.query;

  let filter = '';
  if (estado && estado !== 'todas') {
    filter = `{estado} = '${estado}'`;
  }

  const promos = await fetchRecords(tablas.promociones, {
    filter,
    sort: [{ field: 'fecha_creacion', direction: 'desc' }],
  });

  return res.status(200).json(promos);
}

async function handlePost(req, res) {
  const { titulo, mensaje, audiencia, fecha_envio_programada, imagen_url, accion } = req.body;

  // Accion: "enviar" triggers the n8n webhook
  if (accion === 'enviar') {
    const { promo_id } = req.body;
    if (!promo_id) {
      return res.status(400).json({ error: 'promo_id es requerido' });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL no configurado' });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promo_id, trigger: 'manual' }),
      });

      const result = await response.json().catch(() => ({}));
      return res.status(200).json({ success: true, result });
    } catch (err) {
      console.error('Error triggering n8n webhook:', err);
      return res.status(500).json({ error: 'Error al enviar promoción' });
    }
  }

  // Create new promo
  if (!titulo || !mensaje) {
    return res.status(400).json({ error: 'Título y mensaje son requeridos' });
  }

  const estado = fecha_envio_programada ? 'programada' : 'borrador';

  // Build fields object — include imagen_url if provided
  const fields = {
    titulo,
    mensaje,
    audiencia: audiencia || 'todos',
    estado,
    fecha_envio_programada: fecha_envio_programada || null,
  };

  // FIX: Save the imgbb URL to Airtable
  if (imagen_url) {
    fields.imagen_url = imagen_url;
  }

  const record = await createRecord(tablas.promociones, fields);

  return res.status(201).json(record);
}

async function handlePatch(req, res) {
  const { id, ...fields } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID es requerido' });
  }

  const allowedFields = ['titulo', 'mensaje', 'audiencia', 'estado', 'fecha_envio_programada', 'imagen_url'];
  const updateFields = {};

  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updateFields[key] = fields[key];
    }
  }

  const record = await updateRecord(tablas.promociones, id, updateFields);
  return res.status(200).json(record);
}
