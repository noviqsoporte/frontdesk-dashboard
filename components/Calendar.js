import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateCalendarDays, toISODate } from '../lib/dates';

export default function Calendar({ reservas = [], selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(
    () => generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const reservasPorDia = useMemo(() => {
    const map = {};
    for (const r of reservas) {
      if (!r.fecha) continue;
      if (!map[r.fecha]) map[r.fecha] = [];
      map[r.fecha].push(r);
    }
    return map;
  }, [reservas]);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex items-center gap-1">
          <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoy
          </button>
          <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-500 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
        {days.map((day, idx) => {
          const dateStr = toISODate(day);
          const dayReservas = reservasPorDia[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, new Date(selectedDate));
          const isHoy = isToday(day);
          const confirmadas = dayReservas.filter((r) => r.estado === 'confirmada').length;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateStr)}
              className={`relative bg-white p-2 min-h-[64px] text-left transition-all hover:bg-gray-50 ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isSelected ? 'ring-2 ring-inset ring-brand-500 bg-brand-50' : ''}`}
            >
              <span
                className={`text-sm ${
                  isHoy
                    ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white font-bold'
                    : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </span>
              {confirmadas > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                    {confirmadas} reserva{confirmadas !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
