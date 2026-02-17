import { useState, useRef } from 'react';
import { X, Send, Clock, Image, Trash2, Upload } from 'lucide-react';

export default function PromoForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    titulo: '',
    mensaje: '',
    audiencia: 'todos',
    fecha_envio_programada: '',
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('ahora');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, WebP)');
      return;
    }

    // Max 5MB for WhatsApp
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    handleImageSelect(e.target.files[0]);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      if (mode === 'ahora') {
        data.fecha_envio_programada = '';
      }

      // Upload image to imgbb if present
      if (imageFile) {
        setUploading(true);
        try {
          const uploadData = new FormData();
          uploadData.append('file', imageFile);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadData,
          });

          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            data.imagen_url = uploadResult.url;
          } else {
            throw new Error('Upload failed');
          }
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          alert('Error al subir la imagen. La promoción se creará sin imagen.');
        } finally {
          setUploading(false);
        }
      }

      await onSubmit(data, mode);
      onClose();
    } catch (err) {
      alert('Error al crear la promoción');
    } finally {
      setLoading(false);
    }
  };

  const charCount = form.mensaje.length;
  const isSubmitting = loading || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Promoción</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Título *</label>
            <input
              type="text"
              className="input"
              placeholder="2x1 en Pizzas 🍕"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="label">Mensaje *</label>
            <textarea
              className="input"
              rows={4}
              placeholder="¡Hola! Tenemos una promoción especial para ti..."
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              required
              maxLength={1024}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{charCount}/1024</p>
          </div>

          {/* Image upload */}
          <div>
            <label className="label">Imagen (opcional)</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 rounded-full bg-gray-900/60 p-1.5 text-white hover:bg-gray-900/80 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 rounded-full bg-gray-900/60 px-2 py-1">
                  <p className="text-xs text-white">
                    {(imageFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`w-full rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className={`mx-auto h-8 w-8 ${dragActive ? 'text-brand-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-500 mt-2">
                  {dragActive ? 'Suelta la imagen aquí' : 'Haz clic o arrastra una imagen'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · Máx 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* WhatsApp Preview */}
          {form.mensaje && (
            <div className="rounded-lg bg-[#e5ddd5] p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Vista previa WhatsApp</p>
              <div className="bg-white rounded-lg shadow-sm max-w-[280px] ml-auto overflow-hidden">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-2.5">
                  <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-snug">
                    {form.mensaje}
                  </p>
                  <p className="text-[10px] text-gray-400 text-right mt-1">12:00 PM ✔✔</p>
                </div>
              </div>
            </div>
          )}

          {/* Audience */}
          <div>
            <label className="label">Audiencia</label>
            <select
              className="select"
              value={form.audiencia}
              onChange={(e) => setForm({ ...form, audiencia: e.target.value })}
            >
              <option value="todos">Todos los contactos</option>
              <option value="vip">Solo VIP</option>
              <option value="recientes">Activos últimos 30 días</option>
            </select>
          </div>

          {/* Send mode toggle */}
          <div>
            <label className="label">¿Cuándo enviar?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'ahora'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('ahora')}
              >
                <Send className="h-4 w-4" />
                Enviar ahora
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'programar'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('programar')}
              >
                <Clock className="h-4 w-4" />
                Programar
              </button>
            </div>
          </div>

          {mode === 'programar' && (
            <div>
              <label className="label">Fecha y hora de envío</label>
              <input
                type="datetime-local"
                className="input"
                value={form.fecha_envio_programada}
                onChange={(e) => setForm({ ...form, fecha_envio_programada: e.target.value })}
                required={mode === 'programar'}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? uploading
                  ? 'Subiendo imagen...'
                  : 'Procesando...'
                : mode === 'ahora'
                ? '🚀 Enviar Ahora'
                : '📅 Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
