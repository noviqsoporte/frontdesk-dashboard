import { tablas, fetchRecords, updateRecord } from '../../../lib/airtable';

export default async function handler(req, res) {
  // ─── GET: List all contacts ───
  if (req.method === 'GET') {
    try {
      const contactos = await fetchRecords(tablas.contactos, {
        sort: [{ field: 'ultima_interaccion', direction: 'desc' }],
      });

      return res.status(200).json(contactos);
    } catch (error) {
      console.error('Error fetching contactos:', error);
      return res.status(500).json({ error: 'Error al obtener contactos' });
    }
  }

  // ─── PATCH: Update a contact (opt_in_promos, tags, notas, estado) ───
  if (req.method === 'PATCH') {
    try {
      const { id, ...fields } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID del contacto' });
      }

      // Only allow updating specific fields
      const allowedFields = ['opt_in_promos', 'tags', 'notas', 'estado', 'nombre'];
      const updateFields = {};

      for (const key of allowedFields) {
        if (fields[key] !== undefined) {
          updateFields[key] = fields[key];
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
      }

      const updated = await updateRecord(tablas.contactos, id, updateFields);
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating contacto:', error);
      return res.status(500).json({ error: 'Error al actualizar contacto' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
