import { useState } from 'react';
import { X } from 'lucide-react';

export default function ReservaForm({ onSubmit, onClose, initialDate }) {
  const [form, setForm] = useState({
    nombre_cliente: '',
    telefono: '',
    fecha: initialDate || '',
    hora: '',
    num_personas: 2,
    notas_especiales: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      alert('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Reserva</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre del cliente *</label>
            <input
              type="text"
              className="input"
              placeholder="Juan Pérez"
              value={form.nombre_cliente}
              onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input
              type="tel"
              className="input"
              placeholder="5215512345678"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha *</label>
              <input
                type="date"
                className="input"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Hora *</label>
              <input
                type="time"
                className="input"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Personas</label>
            <input
              type="number"
              className="input"
              min="1"
              max="50"
              value={form.num_personas}
              onChange={(e) => setForm({ ...form, num_personas: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="label">Notas especiales</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Cumpleaños, alergias, etc."
              value={form.notas_especiales}
              onChange={(e) => setForm({ ...form, notas_especiales: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
