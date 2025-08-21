import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Car } from 'lucide-react';

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

interface AppointmentCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentSelect: (appointment: Appointment) => void;
}

const AppointmentCalendar = ({ 
  appointments, 
  selectedDate, 
  onDateSelect, 
  onAppointmentSelect 
}: AppointmentCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.scheduledDate).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    return grouped;
  }, [appointments]);

  // Get appointments for selected date
  const selectedDateAppointments = appointmentsByDate[selectedDate.toDateString()] || [];

  // Calendar helpers
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  const daysInMonth = lastDayOfMonth.getDate();
  const daysFromPrevMonth = firstDayOfWeek;
  const totalDays = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7;

  const calendarDays = [];
  
  // Previous month days
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    calendarDays.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
      isCurrentMonth: false,
      day: day
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      isCurrentMonth: true,
      day: day
    });
  }
  
  // Next month days
  const remainingDays = totalDays - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
    calendarDays.push({
      date: nextMonth,
      isCurrentMonth: false,
      day: day
    });
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Calendar Grid */}
        <div className="col-span-2 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                Hoy
              </button>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {calendarDays.map((calendarDay, index) => {
              const dayAppointments = appointmentsByDate[calendarDay.date.toDateString()] || [];
              const hasAppointments = dayAppointments.length > 0;
              
              return (
                <div
                  key={index}
                  className={`
                    bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors
                    ${!calendarDay.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                    ${isToday(calendarDay.date) ? 'bg-blue-50' : ''}
                    ${isSelected(calendarDay.date) ? 'ring-2 ring-blue-500' : ''}
                  `}
                  onClick={() => onDateSelect(calendarDay.date)}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday(calendarDay.date) ? 'text-blue-600' : ''}
                    ${isSelected(calendarDay.date) ? 'text-blue-600' : ''}
                  `}>
                    {calendarDay.day}
                  </div>
                  
                  {hasAppointments && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(appointment => (
                        <div
                          key={appointment.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentSelect(appointment);
                          }}
                          className={`
                            text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer
                            ${getStatusColor(appointment.status)}
                            hover:opacity-80
                          `}
                        >
                          {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {appointment.client.name}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayAppointments.length - 3} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Programada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Completada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Cancelada</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>

          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No hay citas para este día
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  onClick={() => onAppointmentSelect(appointment)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                      ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                      ${appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                      ${appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {appointment.status === 'scheduled' && 'Programada'}
                      {appointment.status === 'confirmed' && 'Confirmada'}
                      {appointment.status === 'completed' && 'Completada'}
                      {appointment.status === 'cancelled' && 'Cancelada'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{appointment.client.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {appointment.vehicle.brand} {appointment.vehicle.model}
                      {appointment.vehicle.plate && ` - ${appointment.vehicle.plate}`}
                    </span>
                  </div>
                  
                  {appointment.isFromOpportunity && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Desde Oportunidad
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;