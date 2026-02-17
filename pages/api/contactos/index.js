import { tablas, fetchRecords } from '../../../lib/airtable';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
