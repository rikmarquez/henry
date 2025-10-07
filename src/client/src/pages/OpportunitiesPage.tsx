import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { api } from '../services/api';
import PermissionGate from '../components/PermissionGate';
import { WhatsAppFollowUpButton } from '../components/WhatsAppButton';
import ClientSearchSelect from '../components/ClientSearchSelect';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  User,
  Car,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  XCircle,
  FileText,
  DollarSign,
  Target,
  ArrowRight,
  Phone,
  CalendarPlus,
  Wrench,
} from 'lucide-react';

// Types
interface Opportunity {
  id: number;
  clientId: number;
  vehicleId: number;
  serviceId?: number;
  type: string;
  description: string;
  followUpDate: string;
  status: 'pending' | 'contacted' | 'interested' | 'declined' | 'converted';
  notes?: string;
  createdAt: string;
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
    year: number;
  };
  service?: {
    id: number;
    problemDescription?: string;
    diagnosis?: string;
    totalAmount: number;
    status: {
      id: number;
      name: string;
      color: string;
    };
  };
  createdByUser: {
    id: number;
    name: string;
  };
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  clientId: number;
}

interface Service {
  id: number;
  problemDescription?: string;
  diagnosis?: string;
  totalAmount: number;
  client: { name: string };
  vehicle: { plate: string; brand: string; model: string };
}

// Form schemas
const createOpportunitySchema = z.object({
  clientId: z.number().min(1, 'Seleccione un cliente'),
  vehicleId: z.number().min(1, 'Seleccione un vehículo'),
  serviceId: z.number().optional(),
  type: z.string().min(2, 'El tipo debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  followUpDate: z.string().min(1, 'Fecha de seguimiento requerida'),
  status: z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']),
  notes: z.string().optional(),
});

type CreateOpportunityForm = z.infer<typeof createOpportunitySchema>;

const filterSchema = z.object({
  search: z.string().optional(),
  clientId: z.number().optional(),
  vehicleId: z.number().optional(),
  type: z.string().optional(),
  status: z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

// Helper function for safe array handling
const ensureArray = <T,>(data: any): T[] => Array.isArray(data) ? data : [];

// Helper function for currency formatting (Mexican format)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  // Form hooks
  const createForm = useForm<CreateOpportunityForm>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      status: 'pending',
    },
  });

  const editForm = useForm<CreateOpportunityForm>({
    resolver: zodResolver(createOpportunitySchema),
  });

  const filterForm = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
  });

  // Watch for client selection to filter vehicles
  const selectedClientId = createForm.watch('clientId');
  const editSelectedClientId = editForm.watch('clientId');

  // Filter vehicles when client changes
  useEffect(() => {
    if (selectedClientId) {
      const clientVehicles = vehicles.filter(v => v.clientId === selectedClientId);
      setFilteredVehicles(clientVehicles);
      createForm.setValue('vehicleId', 0);
    } else {
      setFilteredVehicles([]);
    }
  }, [selectedClientId, vehicles, createForm]);

  useEffect(() => {
    if (editSelectedClientId) {
      const clientVehicles = vehicles.filter(v => v.clientId === editSelectedClientId);
      setFilteredVehicles(clientVehicles);
    }
  }, [editSelectedClientId, vehicles]);

  // Load initial data
  useEffect(() => {
    loadOpportunities();
    loadClients();
    loadVehicles();
    loadServices();
  }, [searchParams]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      params.set('page', currentPage.toString());
      params.set('limit', '10');

      const response = await api.get(`/opportunities?${params}`);
      if (response.data.success) {
        setOpportunities(ensureArray<Opportunity>(response.data.data.opportunities));
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Error al cargar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await api.get('/clients?limit=1000');
      if (response.data.success) {
        setClients(ensureArray<Client>(response.data.data.clients || response.data.data));
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles?limit=1000');
      if (response.data.success) {
        setVehicles(ensureArray<Vehicle>(response.data.data.vehicles || response.data.data));
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services?limit=1000&status=5'); // Only completed services
      if (response.data.success) {
        setServices(ensureArray<Service>(response.data.data.services || response.data.data));
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleCreateOpportunity = async (data: CreateOpportunityForm) => {
    try {
      // Limpiar serviceId si es 0 (no seleccionado)
      const payload = {
        ...data,
        serviceId: data.serviceId && data.serviceId > 0 ? data.serviceId : undefined,
      };

      const response = await api.post('/opportunities', payload);
      if (response.data.success) {
        toast.success('Oportunidad creada exitosamente');
        setIsCreateModalOpen(false);
        createForm.reset();
        loadOpportunities();
      }
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      toast.error(error.response?.data?.message || 'Error al crear oportunidad');
    }
  };

  const handleEditOpportunity = async (data: CreateOpportunityForm) => {
    if (!selectedOpportunity) return;

    try {
      // Limpiar serviceId si es 0 (no seleccionado)
      const payload = {
        ...data,
        serviceId: data.serviceId && data.serviceId > 0 ? data.serviceId : undefined,
      };

      const response = await api.put(`/opportunities/${selectedOpportunity.id}`, payload);
      if (response.data.success) {
        toast.success('Oportunidad actualizada exitosamente');
        setIsEditModalOpen(false);
        setSelectedOpportunity(null);
        editForm.reset();
        loadOpportunities();
      }
    } catch (error: any) {
      console.error('Error updating opportunity:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar oportunidad');
    }
  };

  const handleDeleteOpportunity = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta oportunidad?')) return;

    try {
      const response = await api.delete(`/opportunities/${id}`);
      if (response.data.success) {
        toast.success('Oportunidad eliminada exitosamente');
        loadOpportunities();
      }
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar oportunidad');
    }
  };

  const handleConvertToAppointment = async (opportunity: Opportunity) => {
    // Show a date/time picker modal or use default date
    const scheduledDate = prompt(
      `Convertir oportunidad a cita para ${opportunity.client.name} - ${opportunity.vehicle.plate}\n\n` +
      `Descripción: ${opportunity.description}\n\n` +
      `Ingrese la fecha y hora (YYYY-MM-DD HH:MM) o presione OK para usar hoy:`,
      new Date().toISOString().slice(0, 16).replace('T', ' ')
    );

    if (!scheduledDate) return; // User cancelled

    setConvertingId(opportunity.id);
    try {
      // Use the new direct conversion endpoint
      const response = await api.post(`/opportunities/${opportunity.id}/convert-to-appointment`, {
        scheduledDate: new Date(scheduledDate.replace(' ', 'T')).toISOString(),
        notes: `Cita generada desde oportunidad: ${opportunity.description}`,
      });

      if (response.data.success) {
        toast.success('¡Oportunidad convertida en cita exitosamente!');
        loadOpportunities();
      }
    } catch (error: any) {
      console.error('Error converting opportunity:', error);
      toast.error(error.response?.data?.message || 'Error al convertir oportunidad');
    } finally {
      setConvertingId(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await api.put(`/opportunities/${id}`, { status: newStatus });
      if (response.data.success) {
        toast.success('Estado actualizado exitosamente');
        loadOpportunities();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'interested': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      case 'converted': return <CalendarPlus className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isOpportunityOverdue = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0; // Due within 7 days
  };

  const openEditModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    
    // Filter vehicles for the selected client
    const clientVehicles = vehicles.filter(v => v.clientId === opportunity.clientId);
    setFilteredVehicles(clientVehicles);

    editForm.reset({
      clientId: opportunity.clientId,
      vehicleId: opportunity.vehicleId,
      serviceId: opportunity.serviceId || undefined,
      type: opportunity.type,
      description: opportunity.description,
      followUpDate: opportunity.followUpDate.split('T')[0],
      status: opportunity.status,
      notes: opportunity.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDetailModalOpen(true);
  };

  // Get opportunities due for follow-up (within next 7 days)
  const upcomingOpportunities = opportunities.filter(opp => 
    opp.status === 'pending' && isOpportunityOverdue(opp.followUpDate)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-gray-600 mt-1">
            Gestiona el seguimiento de trabajos futuros y mantenimientos programados
          </p>
        </div>
        <PermissionGate
          resource="opportunities"
          action="create"
          fallbackMode="disable"
        >
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Oportunidad
          </button>
        </PermissionGate>
      </div>

      {/* Upcoming Follow-ups Alert */}
      {upcomingOpportunities.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">
              Seguimientos Próximos ({upcomingOpportunities.length})
            </h3>
          </div>
          <p className="text-orange-700 text-sm mb-3">
            Las siguientes oportunidades requieren seguimiento en los próximos 7 días:
          </p>
          <div className="grid gap-2">
            {upcomingOpportunities.slice(0, 3).map(opp => (
              <div key={opp.id} className="flex items-center justify-between bg-white rounded p-3 border border-orange-200">
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-orange-600" />
                  <div>
                    <span className="font-medium text-gray-900">
                      {opp.client.name} - {opp.vehicle.plate}
                    </span>
                    <p className="text-sm text-gray-600">{opp.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-orange-600">
                    {new Date(opp.followUpDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleConvertToAppointment(opp)}
                    disabled={convertingId === opp.id}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Crear Cita
                  </button>
                </div>
              </div>
            ))}
          </div>
          {upcomingOpportunities.length > 3 && (
            <p className="text-sm text-orange-600 mt-2">
              +{upcomingOpportunities.length - 3} oportunidades más requieren seguimiento
            </p>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, vehículo, tipo o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) {
                  params.set('search', e.target.value);
                } else {
                  params.delete('search');
                }
                setSearchParams(params);
              }}
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo / Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Seguimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio Origen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Cargando oportunidades...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron oportunidades
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{opportunity.client.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {opportunity.vehicle.plate} - {opportunity.vehicle.brand} {opportunity.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">{opportunity.client.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{opportunity.type}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{opportunity.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${isOpportunityOverdue(opportunity.followUpDate) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(opportunity.followUpDate).toLocaleDateString()}
                        </span>
                      </div>
                      {isOpportunityOverdue(opportunity.followUpDate) && opportunity.status === 'pending' && (
                        <span className="text-xs text-orange-600 font-medium">¡Requiere seguimiento!</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={opportunity.status}
                        onChange={(e) => handleStatusChange(opportunity.id, e.target.value)}
                        className={`text-sm px-3 py-1 rounded-full border-0 ${getStatusColor(opportunity.status)} cursor-pointer`}
                        disabled={opportunity.status === 'converted'}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="contacted">Contactado</option>
                        <option value="interested">Interesado</option>
                        <option value="declined">Rechazado</option>
                        <option value="converted">Convertido</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {opportunity.service ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(opportunity.service.totalAmount)}
                          </div>
                          <div className="text-gray-500 line-clamp-1">
                            {opportunity.service.problemDescription || 'Sin descripción'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin servicio</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(opportunity)}
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <PermissionGate
                          resource="opportunities"
                          action="update"
                          fallbackMode="disable"
                        >
                          <button
                            onClick={() => openEditModal(opportunity)}
                            className="text-gray-600 hover:text-green-600 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                        {opportunity.status !== 'converted' && (
                          <PermissionGate
                            resource="opportunities"
                            action="delete"
                            fallbackMode="disable"
                          >
                            <button
                              onClick={() => handleDeleteOpportunity(opportunity.id)}
                              className="text-gray-600 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        )}
                        {(opportunity.status === 'interested' || opportunity.status === 'contacted') && (
                          <button
                            onClick={() => handleConvertToAppointment(opportunity)}
                            disabled={convertingId === opportunity.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
                            title="Convertir en cita"
                          >
                            {convertingId === opportunity.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                            Crear Cita
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Oportunidad</h2>
            <form onSubmit={createForm.handleSubmit(handleCreateOpportunity)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <ClientSearchSelect
                    selectedClientId={selectedClientId}
                    onClientSelect={(clientId) => createForm.setValue('clientId', clientId)}
                    clients={clients}
                    isLoading={loading}
                    error={createForm.formState.errors.clientId?.message}
                    placeholder="Buscar cliente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehículo *
                  </label>
                  <select
                    {...createForm.register('vehicleId', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedClientId}
                  >
                    <option value={0}>
                      {selectedClientId ? 'Seleccionar vehículo...' : 'Primero seleccione un cliente'}
                    </option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.vehicleId && (
                    <p className="text-red-500 text-sm mt-1">{createForm.formState.errors.vehicleId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Oportunidad *
                  </label>
                  <select
                    {...createForm.register('type')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="Mantenimiento">Mantenimiento Preventivo</option>
                    <option value="Trabajo Pendiente">Trabajo Pendiente</option>
                    <option value="Revisión">Revisión Programada</option>
                    <option value="Garantía">Seguimiento de Garantía</option>
                    <option value="Otros">Otros</option>
                  </select>
                  {createForm.formState.errors.type && (
                    <p className="text-red-500 text-sm mt-1">{createForm.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Seguimiento *
                  </label>
                  <input
                    type="date"
                    {...createForm.register('followUpDate')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {createForm.formState.errors.followUpDate && (
                    <p className="text-red-500 text-sm mt-1">{createForm.formState.errors.followUpDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio Origen (opcional)
                  </label>
                  <select
                    {...createForm.register('serviceId', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Sin servicio origen</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.client.name} - {service.vehicle.plate} - {formatCurrency(service.totalAmount)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    {...createForm.register('status')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="contacted">Contactado</option>
                    <option value="interested">Interesado</option>
                    <option value="declined">Rechazado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  {...createForm.register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describa el trabajo o mantenimiento a realizar..."
                />
                {createForm.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{createForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  {...createForm.register('notes')}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    createForm.reset();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {createForm.formState.isSubmitting ? 'Creando...' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Oportunidad</h2>
            <form onSubmit={editForm.handleSubmit(handleEditOpportunity)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <ClientSearchSelect
                    selectedClientId={editSelectedClientId}
                    onClientSelect={(clientId) => editForm.setValue('clientId', clientId)}
                    clients={clients}
                    isLoading={loading}
                    error={editForm.formState.errors.clientId?.message}
                    placeholder="Buscar cliente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehículo *
                  </label>
                  <select
                    {...editForm.register('vehicleId', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Seleccionar vehículo...</option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                  {editForm.formState.errors.vehicleId && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.vehicleId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Oportunidad *
                  </label>
                  <select
                    {...editForm.register('type')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="Mantenimiento">Mantenimiento Preventivo</option>
                    <option value="Trabajo Pendiente">Trabajo Pendiente</option>
                    <option value="Revisión">Revisión Programada</option>
                    <option value="Garantía">Seguimiento de Garantía</option>
                    <option value="Otros">Otros</option>
                  </select>
                  {editForm.formState.errors.type && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Seguimiento *
                  </label>
                  <input
                    type="date"
                    {...editForm.register('followUpDate')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {editForm.formState.errors.followUpDate && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.followUpDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    {...editForm.register('status')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="contacted">Contactado</option>
                    <option value="interested">Interesado</option>
                    <option value="declined">Rechazado</option>
                    <option value="converted">Convertido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  {...editForm.register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describa el trabajo o mantenimiento a realizar..."
                />
                {editForm.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  {...editForm.register('notes')}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedOpportunity(null);
                    editForm.reset();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {editForm.formState.isSubmitting ? 'Actualizando...' : 'Actualizar Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detalles de Oportunidad</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client and Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Cliente
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedOpportunity.client.name}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedOpportunity.client.phone}</p>
                    {selectedOpportunity.client.email && (
                      <p><span className="font-medium">Email:</span> {selectedOpportunity.client.email}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Car className="w-5 h-5 text-green-600" />
                    Vehículo
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Placa:</span> {selectedOpportunity.vehicle.plate}</p>
                    <p><span className="font-medium">Marca:</span> {selectedOpportunity.vehicle.brand}</p>
                    <p><span className="font-medium">Modelo:</span> {selectedOpportunity.vehicle.model}</p>
                    <p><span className="font-medium">Año:</span> {selectedOpportunity.vehicle.year}</p>
                  </div>
                </div>
              </div>

              {/* Opportunity Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Detalles de la Oportunidad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="mb-2"><span className="font-medium">Tipo:</span> {selectedOpportunity.type}</p>
                    <p className="mb-2">
                      <span className="font-medium">Estado:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOpportunity.status)}`}>
                        {selectedOpportunity.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Seguimiento:</span>
                      <span className={isOpportunityOverdue(selectedOpportunity.followUpDate) ? 'text-orange-600 font-medium' : ''}>
                        {new Date(selectedOpportunity.followUpDate).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium">Creado:</span> {new Date(selectedOpportunity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-medium mb-1">Descripción:</p>
                  <p className="text-gray-700 bg-white rounded p-3 border">
                    {selectedOpportunity.description}
                  </p>
                </div>
                {selectedOpportunity.notes && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">Notas:</p>
                    <p className="text-gray-700 bg-white rounded p-3 border">
                      {selectedOpportunity.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Service Origin */}
              {selectedOpportunity.service && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-green-600" />
                    Servicio Origen
                  </h3>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="font-medium">Problema:</span> {selectedOpportunity.service.problemDescription || 'Sin descripción'}
                    </p>
                    {selectedOpportunity.service.diagnosis && (
                      <p>
                        <span className="font-medium">Diagnóstico:</span> {selectedOpportunity.service.diagnosis}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Monto:</span> {formatCurrency(selectedOpportunity.service.totalAmount)}
                    </p>
                    <p>
                      <span className="font-medium">Estado del Servicio:</span>
                      <span 
                        className="ml-2 px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: selectedOpportunity.service.status.color }}
                      >
                        {selectedOpportunity.service.status.name}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedOpportunity.status !== 'converted' && selectedOpportunity.status !== 'declined' && (
                <div className="flex justify-center gap-3 pt-4">
                  {/* WhatsApp Follow-up Button */}
                  {selectedOpportunity.client?.phone && (
                    <WhatsAppFollowUpButton
                      clientName={selectedOpportunity.client.name}
                      clientPhone={selectedOpportunity.client.phone}
                      vehicleBrand={selectedOpportunity.vehicle?.brand}
                      vehicleModel={selectedOpportunity.vehicle?.model}
                      followUpService={selectedOpportunity.description}
                      size="md"
                      variant="outline"
                    />
                  )}

                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleConvertToAppointment(selectedOpportunity);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    Convertir en Cita
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}