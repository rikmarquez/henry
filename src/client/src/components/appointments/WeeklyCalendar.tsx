import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Car, Phone, Plus, Eye, Printer, FileSpreadsheet } from 'lucide-react';
import usePrintAgenda from '../../hooks/usePrintAgenda';
import useExcelExport from '../../hooks/useExcelExport';
import toast from 'react-hot-toast';

interface Appointment {
  id: number;
  scheduledDate: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isFromOpportunity: boolean;
  client: {
    id: number;
    name: string;
    phone: string;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
  };
}

interface WeeklyCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentSelect: (appointment: Appointment) => void;
  onCreateAppointment: (preselectedDate?: Date) => void;
}

const WeeklyCalendar = ({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentSelect,
  onCreateAppointment
}: WeeklyCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  // Sync currentWeek with selectedDate when it changes from parent
  useEffect(() => {
    setCurrentWeek(selectedDate);
  }, [selectedDate]);
  const { printWeeklyAgenda } = usePrintAgenda({ branchName: 'Henry Diagnostics' });
  const { exportWeeklyAgenda } = useExcelExport({ branchName: 'Henry Diagnostics' });

  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.scheduledDate).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    // Sort appointments by time within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
    });
    
    return grouped;
  }, [appointments]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeek(newWeek);
  };

  const goToThisWeek = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500 border-blue-600';
      case 'confirmed': return 'bg-green-500 border-green-600';
      case 'completed': return 'bg-gray-500 border-gray-600';
      case 'cancelled': return 'bg-red-500 border-red-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getStatusTextColor = (status: string) => {
    return 'text-white';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'long' });
    const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'long' });

    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getFullYear()}`;
    } else {
      return `${startMonth} - ${endMonth} ${weekEnd.getFullYear()}`;
    }
  };

  // Obtener citas de la semana actual
  const weekAppointments = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartWithTime = new Date(weekStart);
    weekStartWithTime.setHours(0, 0, 0, 0);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduledDate);
      return appointmentDate >= weekStartWithTime && appointmentDate <= weekEnd;
    });
  }, [appointments, weekStart]);

  const handlePrint = async () => {
    try {
      await printWeeklyAgenda(weekAppointments, currentWeek);
      toast.success('Iniciando impresión de la agenda semanal...');
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al imprimir la agenda. Por favor, inténtelo de nuevo.');
    }
  };

  const handleExcelExport = async () => {
    try {
      const result = await exportWeeklyAgenda(weekAppointments, currentWeek);
      toast.success(`Agenda exportada: ${result.appointmentsCount} citas`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar la agenda. Por favor, inténtelo de nuevo.');
    }
  };

  // No need for time slots - just show appointments per day

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Semanal - {formatWeekRange()}
            </h2>
            <p className="text-sm text-gray-600">Semana del {weekStart.toLocaleDateString('es-ES')} al {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Imprimir agenda semanal"
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </button>
            <button
              onClick={handleExcelExport}
              className="flex items-center px-3 py-2 text-sm text-green-700 hover:text-green-900 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
              title="Exportar agenda semanal a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={goToThisWeek}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              Esta semana
            </button>
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Grid - Simplified */}
      <div className="grid grid-cols-7 gap-4 p-6">
        {weekDays.map((day, index) => {
          const dayAppointments = appointmentsByDate[day.toDateString()] || [];
          
          return (
            <div
              key={index}
              className={`bg-gray-50 rounded-lg border-2 transition-colors ${
                isToday(day) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              } ${isSelected(day) ? 'border-blue-400 bg-blue-100' : ''}`}
            >
              {/* Day Header */}
              <div
                className="p-3 text-center cursor-pointer hover:bg-white hover:bg-opacity-50 rounded-t-lg transition-colors"
                onClick={() => onDateSelect(day)}
              >
                <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>
                  {day.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                </div>
                <div className={`text-xl font-bold ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {dayAppointments.length} vehículo{dayAppointments.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Appointments List */}
              <div className="px-3 pb-3 space-y-2 min-h-[300px]">
                {dayAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentSelect(appointment)}
                    className={`
                      p-2 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4
                      ${getStatusColor(appointment.status)} bg-white
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-600">
                        {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {appointment.isFromOpportunity && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full" title="Desde Oportunidad"></div>
                      )}
                    </div>
                    
                    <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {appointment.client.name}
                    </div>
                    
                    <div className="text-xs text-gray-600 truncate">
                      {appointment.vehicle.brand} {appointment.vehicle.model}
                    </div>
                    
                    <div className="text-xs text-gray-500 truncate">
                      {appointment.vehicle.plate || 'Placa pendiente'}
                    </div>
                    
                    {appointment.status === 'cancelled' && (
                      <div className="text-xs text-red-600 font-medium mt-1">
                        CANCELADA
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Appointment for this day */}
                <div
                  onClick={() => {
                    onDateSelect(day);
                    onCreateAppointment(day);
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <Plus className="h-5 w-5 mx-auto text-gray-400 group-hover:text-blue-500 mb-1" />
                  <div className="text-xs text-gray-500 group-hover:text-blue-600">
                    Agregar vehículo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
            <span>Programada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
            <span>Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded border border-gray-600"></div>
            <span>Completada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
            <span>Cancelada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;