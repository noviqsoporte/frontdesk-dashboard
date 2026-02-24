import Airtable from 'airtable';

// This file should ONLY be imported from /pages/api/*
// NEVER import this from React components

if (!process.env.AIRTABLE_PAT) {
  throw new Error('AIRTABLE_PAT is not set in environment variables');
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not set in environment variables');
}

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

// Table references
export const tablas = {
  configuracion: base('Configuracion_Negocio'),
  contactos: base('Contactos'),
  reservas: base('Reservas'),
  conversaciones: base('Conversaciones_Log'),
  promociones: base('Promociones'),
  logPromos: base('Log_Promociones_Enviadas'),
  fechas_bloqueadas: base('Fechas_Bloqueadas'),
};

// Helper: fetch all records from a table with optional filter
export async function fetchRecords(table, options = {}) {
  const { filter, sort, maxRecords, fields } = options;
  
  const queryParams = {};
  if (filter) queryParams.filterByFormula = filter;
  if (sort) queryParams.sort = sort;
  if (maxRecords) queryParams.maxRecords = maxRecords;
  if (fields) queryParams.fields = fields;

  const records = await table.select(queryParams).all();
  
  return records.map((record) => ({
    id: record.id,
    ...record.fields,
  }));
}

// Helper: get a single record
export async function getRecord(table, id) {
  const record = await table.find(id);
  return {
    id: record.id,
    ...record.fields,
  };
}

// Helper: create a record
export async function createRecord(table, fields) {
  const record = await table.create(fields);
  return {
    id: record.id,
    ...record.fields,
  };
}

// Helper: update a record
export async function updateRecord(table, id, fields) {
  const record = await table.update(id, fields);
  return {
    id: record.id,
    ...record.fields,
  };
}

// Helper: delete a record
export async function deleteRecord(table, id) {
  await table.destroy(id);
  return { success: true, id };
}

export default base;
