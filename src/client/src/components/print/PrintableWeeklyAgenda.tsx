import React from 'react';
import '../../styles/print.css';

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

interface PrintableWeeklyAgendaProps {
  appointments: Appointment[];
  selectedDate: Date;
  branchName?: string;
}

const PrintableWeeklyAgenda: React.FC<PrintableWeeklyAgendaProps> = ({
  appointments,
  selectedDate,
  branchName = "Henry Diagnostics"
}) => {
  // Obtener inicio de semana (Lunes)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Agrupar citas por día
  const appointmentsByDay = weekDays.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate);
        return appointmentDate >= dayStart && appointmentDate <= dayEnd;
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return {
      date: day,
      appointments: dayAppointments
    };
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} ${start.toLocaleDateString('es-MX', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      scheduled: 'Prog.',
      confirmed: 'Conf.',
      completed: 'Comp.',
      cancelled: 'Canc.'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-${status}`;
  };

  const totalAppointments = appointments.length;
  const statusSummary = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="print-container print-weekly">
      {/* Header */}
      <div className="print-header">
        <h1>{branchName}</h1>
        <h2>Agenda Semanal - Semana del {getWeekRange()}</h2>
        <div className="print-header-info">
          <span>📍 Taller Mecánico</span>
          <span>📞 Contacto: (555) 123-4567</span>
          <span>📅 Impreso: {new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      {/* Grid semanal */}
      <div className="print-week-grid">
        {/* Headers de días */}
        {appointmentsByDay.map(({ date }, index) => (
          <div key={`header-${index}`} className="print-day-header">
            {date.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase()}
          </div>
        ))}

        {/* Columnas de días */}
        {appointmentsByDay.map(({ date, appointments: dayAppointments }, index) => (
          <div key={`day-${index}`} className="print-day-column">
            <div className="print-day-date">
              {formatDate(date)}
            </div>

            {dayAppointments.length > 0 ? (
              <div>
                {dayAppointments.map((appointment, appointmentIndex) => (
                  <div key={appointmentIndex} className="print-appointment-card print-no-break">
                    <div className="print-appointment-time">
                      🕐 {formatTime(appointment.scheduledDate)}
                    </div>
                    <div className="print-appointment-client">
                      👤 {appointment.client.name}
                    </div>
                    <div className="print-appointment-vehicle">
                      🚗 {appointment.vehicle.brand} {appointment.vehicle.model}
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={getStatusClass(appointment.status)}>
                        {getStatusDisplay(appointment.status)}
                      </span>
                      {appointment.isFromOpportunity && (
                        <span style={{
                          marginLeft: '4px',
                          fontSize: '8px',
                          color: '#059669',
                          backgroundColor: '#d1fae5',
                          padding: '1px 3px',
                          borderRadius: '2px'
                        }}>
                          📋
                        </span>
                      )}
                    </div>
                    {appointment.notes && (
                      <div style={{
                        fontSize: '8px',
                        color: '#374151',
                        marginTop: '2px',
                        fontStyle: 'italic'
                      }}>
                        💭 {appointment.notes.substring(0, 50)}{appointment.notes.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                color: '#9ca3af',
                fontStyle: 'italic',
                fontSize: '10px',
                textAlign: 'center',
                marginTop: '20px'
              }}>
                Sin citas programadas
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div>
          © 2025 {branchName} - Agenda generada automáticamente
        </div>
        <div>
          Sistema de Gestión Henry Diagnostics
        </div>
      </div>

      {/* Mensaje si no hay citas */}
      {totalAppointments === 0 && (
        <div className="print-no-appointments" style={{ marginTop: '40px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
            📅 No hay citas programadas para esta semana
          </h3>
          <p style={{ margin: '0', fontSize: '12px' }}>
            Semana disponible para mantenimiento general o atención de emergencias
          </p>
        </div>
      )}
    </div>
  );
};

export default PrintableWeeklyAgenda;