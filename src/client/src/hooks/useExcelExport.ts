import { useCallback } from 'react';
import { exportDailyAgendaToExcel, exportWeeklyAgendaToExcel } from '../utils/excelExport';

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

interface UseExcelExportProps {
  branchName?: string;
  includeStatistics?: boolean;
  includeMetadata?: boolean;
}

export const useExcelExport = ({
  branchName = 'Henry Diagnostics',
  includeStatistics = true,
  includeMetadata = true
}: UseExcelExportProps = {}) => {

  // Hook para exportar agenda diaria
  const exportDailyAgenda = useCallback(async (
    appointments: Appointment[],
    selectedDate: Date
  ) => {
    try {
      const result = await exportDailyAgendaToExcel(appointments, selectedDate, {
        branchName,
        includeStatistics,
        includeMetadata
      });

      return {
        success: true,
        message: `Agenda diaria exportada exitosamente: ${result.fileName}`,
        fileName: result.fileName,
        appointmentsCount: result.appointmentsCount
      };
    } catch (error) {
      console.error('Error al exportar agenda diaria:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'No se pudo exportar la agenda diaria a Excel'
      );
    }
  }, [branchName, includeStatistics, includeMetadata]);

  // Hook para exportar agenda semanal
  const exportWeeklyAgenda = useCallback(async (
    appointments: Appointment[],
    selectedDate: Date
  ) => {
    try {
      const result = await exportWeeklyAgendaToExcel(appointments, selectedDate, {
        branchName,
        includeStatistics,
        includeMetadata
      });

      return {
        success: true,
        message: `Agenda semanal exportada exitosamente: ${result.fileName}`,
        fileName: result.fileName,
        appointmentsCount: result.appointmentsCount
      };
    } catch (error) {
      console.error('Error al exportar agenda semanal:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'No se pudo exportar la agenda semanal a Excel'
      );
    }
  }, [branchName, includeStatistics, includeMetadata]);

  // Hook para exportar citas personalizadas (útil para futuras extensiones)
  const exportCustomAppointments = useCallback(async (
    appointments: Appointment[],
    title: string,
    fileName?: string
  ) => {
    try {
      // Implementación básica para exportar cualquier conjunto de citas
      if (appointments.length === 0) {
        throw new Error('No hay citas para exportar');
      }

      // Usar exportación semanal como base para conjuntos personalizados
      const result = await exportWeeklyAgendaToExcel(appointments, new Date(), {
        branchName,
        includeStatistics,
        includeMetadata
      });

      return {
        success: true,
        message: `${title} exportado exitosamente: ${result.fileName}`,
        fileName: result.fileName,
        appointmentsCount: result.appointmentsCount
      };
    } catch (error) {
      console.error('Error al exportar citas personalizadas:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'No se pudo exportar las citas a Excel'
      );
    }
  }, [branchName, includeStatistics, includeMetadata]);

  // Verificar si el navegador soporta exportación
  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'Blob' in window && 'URL' in window;
  }, []);

  // Función para obtener estadísticas rápidas de un conjunto de citas
  const getAppointmentsStatistics = useCallback((appointments: Appointment[]) => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      fromOpportunities: appointments.filter(a => a.isFromOpportunity).length,
      newAppointments: appointments.filter(a => !a.isFromOpportunity).length
    };
  }, []);

  return {
    // Funciones principales de exportación
    exportDailyAgenda,
    exportWeeklyAgenda,
    exportCustomAppointments,

    // Utilidades
    getAppointmentsStatistics,
    isSupported: isSupported(),

    // Configuración actual
    config: {
      branchName,
      includeStatistics,
      includeMetadata
    }
  };
};

export default useExcelExport;