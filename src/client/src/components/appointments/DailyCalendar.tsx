import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Car, Phone, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

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

interface DailyCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentSelect: (appointment: Appointment) => void;
  onCreateAppointment: (preselectedDate?: Date) => void;
}

const DailyCalendar = ({ 
  appointments, 
  selectedDate, 
  onDateSelect, 
  onAppointmentSelect,
  onCreateAppointment
}: DailyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Get appointments for the current day
  const dayAppointments = useMemo(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate);
        return appointmentDate >= dayStart && appointmentDate <= dayEnd;
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [appointments, currentDate]);

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Time slots for the day (8 AM to 7 PM)
  const timeSlots = Array.from({ length: 22 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const getAppointmentForSlot = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return dayAppointments.find(appointment => {
      const appointmentTime = new Date(appointment.scheduledDate);
      const appointmentHour = appointmentTime.getHours();
      const appointmentMinute = appointmentTime.getMinutes();
      
      // Check if appointment falls in this 30-minute slot
      const slotStart = hour * 60 + minute;
      const appointmentSlot = appointmentHour * 60 + appointmentMinute;
      
      return appointmentSlot >= slotStart && appointmentSlot < slotStart + 30;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Summary stats
  const statsData = useMemo(() => {
    const total = dayAppointments.length;
    const confirmed = dayAppointments.filter(apt => apt.status === 'confirmed').length;
    const completed = dayAppointments.filter(apt => apt.status === 'completed').length;
    const cancelled = dayAppointments.filter(apt => apt.status === 'cancelled').length;
    const pending = dayAppointments.filter(apt => apt.status === 'scheduled').length;

    return { total, confirmed, completed, cancelled, pending };
  }, [dayAppointments]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Diaria{isToday(currentDate) && ' - HOY'}
            </h2>
            <p className="text-lg text-gray-600 capitalize">
              {formatDate(currentDate)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              Hoy
            </button>
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateDay('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{statsData.pending}</div>
            <div className="text-sm text-blue-600">Programadas</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{statsData.confirmed}</div>
            <div className="text-sm text-green-600">Confirmadas</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{statsData.completed}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{statsData.cancelled}</div>
            <div className="text-sm text-red-600">Canceladas</div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="max-h-[600px] overflow-y-auto">
        {dayAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas programadas</h3>
            <p className="text-gray-500 mb-4">
              {isToday(currentDate) ? 'No hay citas para hoy' : 'No hay citas para este día'}
            </p>
            <button
              onClick={() => onCreateAppointment(currentDate)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Cita
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {timeSlots.map(time => {
              const appointment = getAppointmentForSlot(time);
              
              return (
                <div key={time} className="flex">
                  {/* Time Column */}
                  <div className="w-20 p-4 text-sm text-gray-500 bg-gray-50 border-r border-gray-200">
                    {time}
                  </div>
                  
                  {/* Appointment Column */}
                  <div className="flex-1 p-4">
                    {appointment ? (
                      <div
                        onClick={() => onAppointmentSelect(appointment)}
                        className="cursor-pointer hover:shadow-md transition-shadow border rounded-lg p-4 bg-white border-l-4 border-l-blue-500"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1">{getStatusText(appointment.status)}</span>
                            </div>
                            {appointment.isFromOpportunity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Oportunidad
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{appointment.client.name}</p>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {appointment.client.phone}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Car className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {appointment.vehicle.brand} {appointment.vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500">
                                {appointment.vehicle.plate || 'Placa pendiente'}
                                {appointment.vehicle.year && ` - ${appointment.vehicle.year}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          // Set selected time for new appointment
                          const selectedDateTime = new Date(currentDate);
                          const [hour, minute] = time.split(':').map(Number);
                          selectedDateTime.setHours(hour, minute);
                          onDateSelect(selectedDateTime);
                          onCreateAppointment(selectedDateTime);
                        }}
                        className="h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                      >
                        <div className="flex items-center text-gray-400 group-hover:text-blue-500">
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="text-sm">Crear cita para las {time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {dayAppointments.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onCreateAppointment(currentDate)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cita para Hoy
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyCalendar;