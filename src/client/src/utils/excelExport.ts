import * as XLSX from 'xlsx';

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

interface ExcelExportOptions {
  branchName?: string;
  includeStatistics?: boolean;
  includeMetadata?: boolean;
}

// Configuración de estilos para Excel
const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  },
  title: {
    font: { bold: true, size: 16, color: { rgb: '1F2937' } },
    alignment: { horizontal: 'center' }
  },
  subTitle: {
    font: { bold: true, size: 12, color: { rgb: '374151' } },
    alignment: { horizontal: 'center' }
  },
  statusScheduled: {
    fill: { fgColor: { rgb: 'FEF3C7' } },
    font: { color: { rgb: '92400E' } }
  },
  statusConfirmed: {
    fill: { fgColor: { rgb: 'DBEAFE' } },
    font: { color: { rgb: '1E40AF' } }
  },
  statusCompleted: {
    fill: { fgColor: { rgb: 'D1FAE5' } },
    font: { color: { rgb: '065F46' } }
  },
  statusCancelled: {
    fill: { fgColor: { rgb: 'FEE2E2' } },
    font: { color: { rgb: '991B1B' } }
  },
  data: {
    border: {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } }
    }
  }
};

// Mapeo de estados a español
const STATUS_MAP = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

// Función para obtener el estilo según el estado
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'scheduled': return EXCEL_STYLES.statusScheduled;
    case 'confirmed': return EXCEL_STYLES.statusConfirmed;
    case 'completed': return EXCEL_STYLES.statusCompleted;
    case 'cancelled': return EXCEL_STYLES.statusCancelled;
    default: return {};
  }
};

// Función para formatear fecha y hora
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    weekday: date.toLocaleDateString('es-MX', { weekday: 'long' })
  };
};

// Función para crear metadatos del archivo
const createMetadata = (appointments: Appointment[], title: string, branchName: string) => {
  const now = new Date();
  const statistics = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    fromOpportunities: appointments.filter(a => a.isFromOpportunity).length
  };

  return [
    { A: 'INFORMACIÓN DEL ARCHIVO', B: '' },
    { A: 'Taller:', B: branchName },
    { A: 'Reporte:', B: title },
    { A: 'Fecha de exportación:', B: now.toLocaleDateString('es-MX') },
    { A: 'Hora de exportación:', B: now.toLocaleTimeString('es-MX') },
    { A: '', B: '' },
    { A: 'ESTADÍSTICAS', B: '' },
    { A: 'Total de citas:', B: statistics.total },
    { A: 'Programadas:', B: statistics.scheduled },
    { A: 'Confirmadas:', B: statistics.confirmed },
    { A: 'Completadas:', B: statistics.completed },
    { A: 'Canceladas:', B: statistics.cancelled },
    { A: 'Desde oportunidades:', B: statistics.fromOpportunities },
    { A: '', B: '' }
  ];
};

// Exportación de agenda diaria
export const exportDailyAgendaToExcel = async (
  appointments: Appointment[],
  selectedDate: Date,
  options: ExcelExportOptions = {}
) => {
  const {
    branchName = 'Henry Diagnostics',
    includeStatistics = true,
    includeMetadata = true
  } = options;

  try {
    // Crear nuevo workbook
    const workbook = XLSX.utils.book_new();

    // Filtrar citas del día
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduledDate);
      return appointmentDate >= dayStart && appointmentDate <= dayEnd;
    });

    // Generar horarios de 8 AM a 7 PM
    const timeSlots = [];
    for (let hour = 8; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(time);
      }
    }

    // Crear datos para la hoja principal
    const worksheetData = [];

    // Título
    const dateFormatted = selectedDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    worksheetData.push([`AGENDA DIARIA - ${dateFormatted.toUpperCase()}`]);
    worksheetData.push([branchName]);
    worksheetData.push(['']); // Fila vacía

    // Headers de la tabla
    worksheetData.push([
      'Horario',
      'Cliente',
      'Teléfono',
      'Vehículo',
      'Placa',
      'Estado',
      'Tipo',
      'Notas'
    ]);

    // Datos de horarios
    timeSlots.forEach(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number);
      const appointment = dayAppointments.find(appointment => {
        const appointmentTime = new Date(appointment.scheduledDate);
        const appointmentHour = appointmentTime.getHours();
        const appointmentMinute = appointmentTime.getMinutes();

        const slotStart = hour * 60 + minute;
        const appointmentSlot = appointmentHour * 60 + appointmentMinute;

        return appointmentSlot >= slotStart && appointmentSlot < slotStart + 30;
      });

      if (appointment) {
        worksheetData.push([
          timeSlot,
          appointment.client.name,
          appointment.client.phone,
          `${appointment.vehicle.brand} ${appointment.vehicle.model}`,
          appointment.vehicle.plate,
          STATUS_MAP[appointment.status] || appointment.status,
          appointment.isFromOpportunity ? 'Seguimiento' : 'Nueva',
          appointment.notes || ''
        ]);
      } else {
        worksheetData.push([
          timeSlot,
          'Horario disponible',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      }
    });

    // Agregar estadísticas si se solicita
    if (includeStatistics && dayAppointments.length > 0) {
      worksheetData.push(['']); // Fila vacía
      worksheetData.push(['RESUMEN DEL DÍA']);
      worksheetData.push(['Total de citas:', dayAppointments.length]);
      worksheetData.push(['Programadas:', dayAppointments.filter(a => a.status === 'scheduled').length]);
      worksheetData.push(['Confirmadas:', dayAppointments.filter(a => a.status === 'confirmed').length]);
      worksheetData.push(['Completadas:', dayAppointments.filter(a => a.status === 'completed').length]);
      worksheetData.push(['Canceladas:', dayAppointments.filter(a => a.status === 'cancelled').length]);
    }

    // Crear hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar anchos de columna
    worksheet['!cols'] = [
      { width: 12 }, // Horario
      { width: 25 }, // Cliente
      { width: 15 }, // Teléfono
      { width: 20 }, // Vehículo
      { width: 12 }, // Placa
      { width: 12 }, // Estado
      { width: 15 }, // Tipo
      { width: 30 }  // Notas
    ];

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda Diaria');

    // Crear hoja de metadatos si se solicita
    if (includeMetadata) {
      const metadataData = createMetadata(
        dayAppointments,
        `Agenda Diaria - ${dateFormatted}`,
        branchName
      );
      const metadataSheet = XLSX.utils.json_to_sheet(metadataData);
      metadataSheet['!cols'] = [{ width: 25 }, { width: 30 }];
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Información');
    }

    // Generar nombre del archivo
    const fileName = `Agenda_Diaria_${selectedDate.toISOString().split('T')[0]}_${branchName.replace(/\s+/g, '_')}.xlsx`;

    // Exportar archivo
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
      appointmentsCount: dayAppointments.length
    };

  } catch (error) {
    console.error('Error al exportar agenda diaria:', error);
    throw new Error('No se pudo exportar la agenda diaria a Excel');
  }
};

// Exportación de agenda semanal
export const exportWeeklyAgendaToExcel = async (
  appointments: Appointment[],
  selectedDate: Date,
  options: ExcelExportOptions = {}
) => {
  const {
    branchName = 'Henry Diagnostics',
    includeStatistics = true,
    includeMetadata = true
  } = options;

  try {
    // Crear nuevo workbook
    const workbook = XLSX.utils.book_new();

    // Obtener inicio de semana (Lunes)
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Filtrar citas de la semana
    const weekStartWithTime = new Date(weekStart);
    weekStartWithTime.setHours(0, 0, 0, 0);
    const weekEndWithTime = new Date(weekEnd);
    weekEndWithTime.setHours(23, 59, 59, 999);

    const weekAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduledDate);
      return appointmentDate >= weekStartWithTime && appointmentDate <= weekEndWithTime;
    });

    // Crear datos para la hoja principal
    const worksheetData = [];

    // Título
    const weekRange = `${weekStart.toLocaleDateString('es-MX')} al ${weekEnd.toLocaleDateString('es-MX')}`;
    worksheetData.push([`AGENDA SEMANAL - ${weekRange.toUpperCase()}`]);
    worksheetData.push([branchName]);
    worksheetData.push(['']); // Fila vacía

    // Headers de la tabla
    worksheetData.push([
      'Día',
      'Fecha',
      'Hora',
      'Cliente',
      'Teléfono',
      'Vehículo',
      'Placa',
      'Estado',
      'Tipo',
      'Notas'
    ]);

    // Ordenar citas por fecha y hora
    const sortedAppointments = weekAppointments.sort((a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    // Datos de citas
    sortedAppointments.forEach(appointment => {
      const { date, time, weekday } = formatDateTime(appointment.scheduledDate);

      worksheetData.push([
        weekday,
        date,
        time,
        appointment.client.name,
        appointment.client.phone,
        `${appointment.vehicle.brand} ${appointment.vehicle.model}`,
        appointment.vehicle.plate,
        STATUS_MAP[appointment.status] || appointment.status,
        appointment.isFromOpportunity ? 'Seguimiento' : 'Nueva',
        appointment.notes || ''
      ]);
    });

    // Agregar estadísticas si se solicita
    if (includeStatistics) {
      worksheetData.push(['']); // Fila vacía
      worksheetData.push(['RESUMEN DE LA SEMANA']);
      worksheetData.push(['Total de citas:', weekAppointments.length]);
      worksheetData.push(['Programadas:', weekAppointments.filter(a => a.status === 'scheduled').length]);
      worksheetData.push(['Confirmadas:', weekAppointments.filter(a => a.status === 'confirmed').length]);
      worksheetData.push(['Completadas:', weekAppointments.filter(a => a.status === 'completed').length]);
      worksheetData.push(['Canceladas:', weekAppointments.filter(a => a.status === 'cancelled').length]);
      worksheetData.push(['Desde oportunidades:', weekAppointments.filter(a => a.isFromOpportunity).length]);

      // Distribución por día
      worksheetData.push(['']); // Fila vacía
      worksheetData.push(['DISTRIBUCIÓN POR DÍA']);
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        return day;
      });

      weekDays.forEach(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayCount = weekAppointments.filter(appointment => {
          const appointmentDate = new Date(appointment.scheduledDate);
          return appointmentDate >= dayStart && appointmentDate <= dayEnd;
        }).length;

        worksheetData.push([
          day.toLocaleDateString('es-MX', { weekday: 'long' }),
          dayCount
        ]);
      });
    }

    // Crear hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar anchos de columna
    worksheet['!cols'] = [
      { width: 12 }, // Día
      { width: 12 }, // Fecha
      { width: 10 }, // Hora
      { width: 25 }, // Cliente
      { width: 15 }, // Teléfono
      { width: 20 }, // Vehículo
      { width: 12 }, // Placa
      { width: 12 }, // Estado
      { width: 15 }, // Tipo
      { width: 30 }  // Notas
    ];

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda Semanal');

    // Crear hoja de metadatos si se solicita
    if (includeMetadata) {
      const metadataData = createMetadata(
        weekAppointments,
        `Agenda Semanal - ${weekRange}`,
        branchName
      );
      const metadataSheet = XLSX.utils.json_to_sheet(metadataData);
      metadataSheet['!cols'] = [{ width: 25 }, { width: 30 }];
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Información');
    }

    // Generar nombre del archivo
    const fileName = `Agenda_Semanal_${weekStart.toISOString().split('T')[0]}_${branchName.replace(/\s+/g, '_')}.xlsx`;

    // Exportar archivo
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
      appointmentsCount: weekAppointments.length
    };

  } catch (error) {
    console.error('Error al exportar agenda semanal:', error);
    throw new Error('No se pudo exportar la agenda semanal a Excel');
  }
};