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

interface PrintableDailyAgendaProps {
  appointments: Appointment[];
  selectedDate: Date;
  branchName?: string;
}

const PrintableDailyAgenda: React.FC<PrintableDailyAgendaProps> = ({
  appointments,
  selectedDate,
  branchName = "Henry Diagnostics"
}) => {
  // Ya no necesitamos generar slots, trabajaremos directamente con las citas

  // Filtrar citas del día seleccionado
  const dayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.scheduledDate);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return appointmentDate >= selectedDateStart && appointmentDate <= selectedDateEnd;
  }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-${status}`;
  };

  return (
    <div className="print-container print-daily">
      {/* Header */}
      <div className="print-header">
        <h1>{branchName}</h1>
        <h2>Agenda Diaria - {formatDate(selectedDate)}</h2>
        <div className="print-header-info">
          <span>📍 Taller Mecánico</span>
          <span>📞 Contacto: (555) 123-4567</span>
          <span>📅 Impreso: {new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      {/* Lista de citas del día */}
      <div className="print-daily-schedule">
        {dayAppointments.length > 0 ? (
          dayAppointments.map((appointment, index) => (
            <div key={appointment.id} className="print-time-slot print-no-break">
              <div className="print-time-label">
                {formatTime(new Date(appointment.scheduledDate))}
              </div>
              <div className="print-appointment-details">
                <div className="print-client-name">
                  {appointment.client.name}
                </div>
                <div className="print-vehicle-info">
                  🚗 {appointment.vehicle.brand} {appointment.vehicle.model}
                  {appointment.vehicle.year && ` (${appointment.vehicle.year})`} - {appointment.vehicle.plate}
                </div>
                <div className="print-phone">
                  📞 {appointment.client.phone}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span className={getStatusClass(appointment.status)}>
                    {getStatusDisplay(appointment.status)}
                  </span>
                  {appointment.isFromOpportunity && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '9px',
                      color: '#059669',
                      backgroundColor: '#d1fae5',
                      padding: '1px 4px',
                      borderRadius: '2px'
                    }}>
                      📋 Seguimiento
                    </span>
                  )}
                </div>
                {appointment.notes && (
                  <div className="print-notes">
                    💭 {appointment.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="print-no-appointments">
            <h3 style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
              📅 No hay citas programadas para este día
            </h3>
            <p style={{ margin: '0', fontSize: '12px' }}>
              Día libre para mantenimiento o atención de emergencias
            </p>
          </div>
        )}
      </div>

      {/* Resumen del día */}
      <div className="print-spacing" style={{ marginTop: '20px' }}>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #d1d5db'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#374151'
          }}>
            📊 Resumen del Día
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            fontSize: '11px'
          }}>
            <div>
              <strong>Total de Citas:</strong> {dayAppointments.length}
            </div>
            <div>
              <strong>Confirmadas:</strong> {dayAppointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div>
              <strong>Programadas:</strong> {dayAppointments.filter(a => a.status === 'scheduled').length}
            </div>
            <div>
              <strong>Completadas:</strong> {dayAppointments.filter(a => a.status === 'completed').length}
            </div>
          </div>
        </div>
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

    </div>
  );
};

export default PrintableDailyAgenda;