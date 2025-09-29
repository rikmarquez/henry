import { useState, useCallback } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import MobileAppointmentCard from './MobileAppointmentCard';

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
    email?: string;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
  };
  opportunity?: {
    id: number;
    type: string;
    description: string;
  };
  createdByUser: {
    id: number;
    name: string;
  };
  _count: {
    services: number;
  };
}

interface AppointmentFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MobileAppointmentsListProps {
  appointments: Appointment[];
  filters: AppointmentFilters;
  onFiltersChange: (filters: AppointmentFilters) => void;
  pagination?: Pagination;
  isLoading: boolean;
  error: any;
  onAppointmentSelect: (appointment: Appointment) => void;
  onQuickAction?: (appointmentId: number, action: 'confirm' | 'cancel' | 'complete') => void;
  onRefresh?: () => void;
}

const MobileAppointmentsList = ({
  appointments,
  filters,
  onFiltersChange,
  pagination,
  isLoading,
  error,
  onAppointmentSelect,
  onQuickAction,
  onRefresh
}: MobileAppointmentsListProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // Pull-to-refresh functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || window.scrollY > 0) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStart;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 100));
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
    setTouchStart(null);
    setPullDistance(0);
  }, [pullDistance, onRefresh, isRefreshing]);

  const handleQuickActionClick = (appointmentId: number, action: 'confirm' | 'cancel' | 'complete') => {
    onQuickAction?.(appointmentId, action);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500">Cargando citas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-3 bg-red-100 rounded-full">
          <Calendar className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-center">
          <p className="text-red-600 font-medium">Error al cargar las citas</p>
          <p className="text-sm text-gray-500 mt-1">Toca para intentar nuevamente</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No hay citas</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            {filters.search || filters.status || filters.dateFrom || filters.dateTo
              ? 'No se encontraron citas con los filtros aplicados.'
              : 'Comienza creando una nueva cita.'
            }
          </p>
        </div>
        {(filters.search || filters.status || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => onFiltersChange({ page: 1, limit: 20 })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pull-to-refresh indicator */}
      {onRefresh && (
        <div
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {pullDistance > 0 && (
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex items-center justify-center transition-all duration-200"
              style={{ transform: `translateX(-50%) translateY(${pullDistance - 60}px)` }}
            >
              <div className={`p-2 bg-white rounded-full shadow-lg border ${
                isRefreshing ? 'animate-spin' : ''
              }`}>
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <MobileAppointmentCard
            key={appointment.id}
            appointment={appointment}
            onTap={() => onAppointmentSelect(appointment)}
            onQuickAction={(action) => handleQuickActionClick(appointment.id, action)}
          />
        ))}
      </div>

      {/* Load More / Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="py-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            Mostrando {appointments.length} de {pagination.total} citas
          </div>

          <div className="flex justify-center space-x-3">
            {pagination.hasPrev && (
              <button
                onClick={() => onFiltersChange({ ...filters, page: pagination.page - 1 })}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Anterior
              </button>
            )}

            <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-900">
                {pagination.page} de {pagination.totalPages}
              </span>
            </div>

            {pagination.hasNext && (
              <button
                onClick={() => onFiltersChange({ ...filters, page: pagination.page + 1 })}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      )}

      {/* Infinite scroll option (future enhancement) */}
      {pagination && pagination.hasNext && (
        <div className="text-center pt-4">
          <button
            onClick={() => onFiltersChange({ ...filters, page: pagination.page + 1 })}
            className="w-full py-3 text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            Cargar más citas
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileAppointmentsList;