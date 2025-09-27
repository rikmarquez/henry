import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, User, Car, Phone, CalendarDays, Search, Filter, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useCurrentBranchId } from '../contexts/BranchContext';
import PermissionGate from '../components/PermissionGate';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import WeeklyCalendar from '../components/appointments/WeeklyCalendar';
import DailyCalendar from '../components/appointments/DailyCalendar';
import CreateAppointmentModal from '../components/appointments/CreateAppointmentModal';
import AppointmentDetails from '../components/appointments/AppointmentDetails';

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

const AppointmentsPage = () => {
  const currentBranchId = useCurrentBranchId();
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 20
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedDateForModal, setPreselectedDateForModal] = useState<Date | undefined>(undefined);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('week');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    appointmentId: number | null;
    action: 'confirm' | 'complete' | 'cancel' | null;
  }>({ show: false, appointmentId: null, action: null });
  
  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/appointments?${params.toString()}`);
      return response.data;
    }
  });

  // Mutation para actualizar estado de cita
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'confirm' | 'complete' | 'cancel' }) => {
      if (action === 'cancel') {
        return await api.delete(`/appointments/${id}`);
      } else {
        return await api.post(`/appointments/${id}/${action}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Estado de cita actualizado');
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar cita');
    }
  });

  const appointments = appointmentsData?.data?.appointments || [];
  const pagination = appointmentsData?.data?.pagination;

  const handleStatusUpdate = (id: number, action: 'confirm' | 'complete' | 'cancel') => {
    updateStatusMutation.mutate({ id, action });
  };

  const handleConfirmAction = (appointmentId: number, action: 'confirm' | 'complete' | 'cancel') => {
    setConfirmDialog({ show: true, appointmentId, action });
  };

  const executeConfirmAction = () => {
    if (confirmDialog.appointmentId && confirmDialog.action) {
      handleStatusUpdate(confirmDialog.appointmentId, confirmDialog.action);
    }
    setConfirmDialog({ show: false, appointmentId: null, action: null });
  };

  const cancelConfirmAction = () => {
    setConfirmDialog({ show: false, appointmentId: null, action: null });
  };

  const handleCreateAppointment = (preselectedDate?: Date) => {
    setPreselectedDateForModal(preselectedDate);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setPreselectedDateForModal(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'confirm': return 'confirmar';
      case 'complete': return 'completar';
      case 'cancel': return 'cancelar';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'confirm': return 'bg-green-600 hover:bg-green-700';
      case 'complete': return 'bg-blue-600 hover:bg-blue-700';
      case 'cancel': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Programa y gestiona las citas del taller
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {/* Toggle View Mode */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-4 w-4 mr-1" />
              Hoy
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mes
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" />
              Lista
            </button>
          </div>
          
          <PermissionGate
            resource="appointments"
            action="create"
            fallbackMode="disable"
          >
            <button
              onClick={() => handleCreateAppointment()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, placa..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="scheduled">Programada</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.status || filters.dateFrom || filters.dateTo) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 20 })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'day' ? (
        <DailyCalendar 
          appointments={appointments}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onAppointmentSelect={setSelectedAppointment}
          onCreateAppointment={handleCreateAppointment}
        />
      ) : viewMode === 'week' ? (
        <WeeklyCalendar 
          appointments={appointments}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onAppointmentSelect={setSelectedAppointment}
          onCreateAppointment={handleCreateAppointment}
        />
      ) : viewMode === 'month' ? (
        <AppointmentCalendar 
          appointments={appointments}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onAppointmentSelect={setSelectedAppointment}
        />
      ) : (
        /* List View */
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando citas...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">Error al cargar las citas</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status || filters.dateFrom || filters.dateTo
                  ? 'No se encontraron citas con los filtros aplicados.'
                  : 'Comienza creando una nueva cita.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Appointments List */}
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </div>
                          {appointment.isFromOpportunity && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Desde Oportunidad
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{appointment.client.name}</p>
                              <p className="text-sm text-gray-500">{appointment.client.phone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.vehicle.brand} {appointment.vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500">
                                {appointment.vehicle.plate || 'Placa pendiente'}
                                {appointment.vehicle.year && ` - ${appointment.vehicle.year}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(appointment.scheduledDate).toLocaleDateString('es-ES')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {appointment._count.services > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {appointment._count.services} servicio{appointment._count.services !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {appointments.length} de {pagination.total} citas
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-900">
                      {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          preselectedDate={preselectedDateForModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            handleCloseCreateModal();
          }}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={updateStatusMutation.isPending}
          onConfirmAction={handleConfirmAction}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && confirmDialog.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Acción
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro que deseas {getActionText(confirmDialog.action)} esta cita?
                {confirmDialog.action === 'cancel' && ' Esta acción no se puede deshacer.'}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelConfirmAction}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeConfirmAction}
                  disabled={updateStatusMutation.isPending}
                  className={`flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${getActionColor(confirmDialog.action)}`}
                >
                  {updateStatusMutation.isPending ? 'Procesando...' : `Sí, ${getActionText(confirmDialog.action)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;