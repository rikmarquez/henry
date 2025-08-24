import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { api } from '../services/api';
import { useCurrentBranchId } from '../contexts/BranchContext';
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
  Wrench,
  List,
  LayoutGrid,
} from 'lucide-react';
import ServicesKanban from '../components/ServicesKanban';

// Types
interface Service {
  id: number;
  appointmentId?: number;
  clientId: number;
  vehicleId: number;
  mechanicId?: number;
  statusId: number;
  problemDescription?: string;
  diagnosis?: string;
  quotationDetails?: string;
  totalAmount: number;
  mechanicCommission: number;
  startedAt?: string;
  completedAt?: string;
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
  mechanic?: {
    id: number;
    name: string;
    commissionPercentage: number;
  };
  status: {
    id: number;
    name: string;
    color: string;
    orderIndex: number;
  };
  appointment?: {
    id: number;
    scheduledDate: string;
    status: string;
  };
  createdByUser: {
    id: number;
    name: string;
  };
  _count: {
    opportunities: number;
    statusLogs: number;
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

interface Mechanic {
  id: number;
  name: string;
  commissionPercentage: number;
  isActive: boolean;
}

interface WorkStatus {
  id: number;
  name: string;
  color: string;
  orderIndex: number;
}

// Validation schemas
const serviceFilterSchema = z.object({
  search: z.string().optional(),
  clientId: z.string().optional(),
  mechanicId: z.string().optional(),
  statusId: z.string().optional(),
});

type ServiceFilterData = z.infer<typeof serviceFilterSchema>;

const createServiceSchema = z.object({
  clientId: z.number().min(1, 'Cliente es requerido'),
  vehicleId: z.number().min(1, 'Vehículo es requerido'),
  mechanicId: z.number().optional(),
  statusId: z.number().default(1),
  problemDescription: z.string().min(1, 'Descripción del problema es requerida'),
  diagnosis: z.string().optional(),
  quotationDetails: z.string().optional(),
  totalAmount: z.number().min(0).default(0),
  mechanicCommission: z.number().min(0).default(0),
});

type CreateServiceData = z.infer<typeof createServiceSchema>;

const createClientSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
});

type CreateClientData = z.infer<typeof createClientSchema>;

const createVehicleSchema = z.object({
  clientId: z.number().min(1, 'Cliente es requerido'),
  plate: z.string().min(1, 'Placa es requerida'),
  brand: z.string().min(1, 'Marca es requerida'),
  model: z.string().min(1, 'Modelo es requerido'),
  year: z.string().transform(val => parseInt(val)).pipe(z.number().min(1900).max(new Date().getFullYear() + 1)),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
});

type CreateVehicleData = z.infer<typeof createVehicleSchema>;

const statusColors: Record<string, string> = {
  'Recibido': 'bg-blue-100 text-blue-800',
  'Diagnosticando': 'bg-yellow-100 text-yellow-800',
  'Cotizado': 'bg-purple-100 text-purple-800',
  'Autorizado': 'bg-indigo-100 text-indigo-800',
  'En Progreso': 'bg-orange-100 text-orange-800',
  'Completado': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'Entregado': 'bg-gray-100 text-gray-800',
};

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentBranchId = useCurrentBranchId();
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to ensure arrays are valid
  const ensureArray = <T,>(data: any): T[] => Array.isArray(data) ? data : [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  // Wrapper para setSelectedClientId con logging
  const setSelectedClientIdWithLog = (value: number | null) => {
    console.log('🔧 setSelectedClientId called with:', value);
    console.trace('🔧 Call stack:');
    setSelectedClientId(value);
  };
  const [preloadedAppointment, setPreloadedAppointment] = useState<any>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [vehicleClientId, setVehicleClientId] = useState<number | null>(null); // Store client ID for vehicle creation
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filter form
  const filterForm = useForm<ServiceFilterData>({
    resolver: zodResolver(serviceFilterSchema),
  });

  // Create form
  const createForm = useForm<CreateServiceData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      statusId: 1,
      totalAmount: 0,
      mechanicCommission: 0,
    },
  });

  // Create client form
  const createClientForm = useForm<CreateClientData>({
    resolver: zodResolver(createClientSchema),
  });

  // Create vehicle form
  const createVehicleForm = useForm<CreateVehicleData>({
    resolver: zodResolver(createVehicleSchema),
  });

  // Client search functionality
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Auto-calculate mechanic commission
  const watchMechanicId = createForm.watch('mechanicId');
  const watchTotalAmount = createForm.watch('totalAmount');

  useEffect(() => {
    if (watchMechanicId && watchTotalAmount) {
      const selectedMechanic = mechanics.find(m => m.id === watchMechanicId);
      if (selectedMechanic) {
        const commission = (watchTotalAmount * selectedMechanic.commissionPercentage) / 100;
        createForm.setValue('mechanicCommission', Number(commission.toFixed(2)));
      }
    } else if (!watchMechanicId) {
      // Clear commission if no mechanic selected
      createForm.setValue('mechanicCommission', 0);
    }
  }, [watchMechanicId, watchTotalAmount, mechanics, createForm]);

  // Load data
  useEffect(() => {
    loadServices();
    loadClients();
    loadMechanics();
    loadWorkStatuses();
  }, []);

  // Handle appointment parameter separately to avoid dependency issues
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (appointmentId) {
      loadAppointmentForService(parseInt(appointmentId));
    }
  }, [searchParams]);

  // Load vehicles when client is selected
  useEffect(() => {
    console.log('🔧 useEffect selectedClientId cambió:', selectedClientId);
    if (selectedClientId) {
      console.log('🔧 Cargando vehículos para cliente ID:', selectedClientId);
      loadVehiclesByClient(selectedClientId);
    } else {
      console.log('🔧 No hay cliente seleccionado, limpiando vehículos');
      setVehicles([]);
    }
  }, [selectedClientId]);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch.length >= 2) {
      const filtered = ensureArray<Client>(clients).filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.phone.includes(clientSearch) ||
        (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
      ).slice(0, 10); // Limit to 10 results for performance
      setFilteredClients(filtered);
      setShowClientDropdown(filtered.length > 0);
    } else {
      setFilteredClients([]);
      setShowClientDropdown(false);
    }
  }, [clientSearch, clients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('🔧 Click outside detected, target:', target.className);
      
      // Check if click is on a dropdown option - if so, don't close
      if (target.closest('.client-dropdown-option') || target.closest('.client-search-container')) {
        console.log('🔧 Click en dropdown option o container, no cerrar');
        return;
      }
      
      console.log('🔧 Cerrando dropdown por click fuera');
      // Use setTimeout to allow onClick to complete first
      setTimeout(() => {
        setShowClientDropdown(false);
      }, 100);
    };

    if (showClientDropdown) {
      console.log('🔧 Agregando listener de click outside');
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        console.log('🔧 Removiendo listener de click outside');
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showClientDropdown]);

  // Debug selectedClientId changes
  useEffect(() => {
    console.log('🔧 selectedClientId cambió a:', selectedClientId, typeof selectedClientId);
  }, [selectedClientId]);

  const loadServices = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });
      
      const response = await api.get(`/services?${params}`);
      
      if (response.data.success) {
        setServices(response.data.data.services);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      toast.error('Error al cargar servicios');
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadClients = async () => {
    try {
      const response = await api.get('/clients?limit=1000'); // Load more clients for search
      if (response.data.success) {
        setClients(response.data.data.clients || response.data.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadVehiclesByClient = async (clientId: number) => {
    try {
      console.log('🔧 Iniciando carga de vehículos para cliente:', clientId);
      const response = await api.get(`/vehicles/by-client/${clientId}`);
      console.log('🔧 Respuesta vehículos:', response.data);
      if (response.data.success) {
        const vehiclesData = response.data.data.vehicles || response.data.data;
        console.log('🔧 Vehículos cargados:', vehiclesData);
        setVehicles(vehiclesData);
      }
    } catch (error) {
      console.error('🔧 Error loading vehicles:', error);
      setVehicles([]);
    }
  };

  const loadMechanics = async () => {
    try {
      const response = await api.get('/mechanics');
      if (response.data.success && response.data.data?.mechanics && Array.isArray(response.data.data.mechanics)) {
        setMechanics(response.data.data.mechanics.filter((m: Mechanic) => m.isActive));
      } else {
        console.warn('Mechanics data structure unexpected:', response.data);
        setMechanics([]);
      }
    } catch (error) {
      console.error('Error loading mechanics:', error);
      setMechanics([]);
    }
  };

  const loadWorkStatuses = async () => {
    try {
      const response = await api.get('/workstatus');
      if (response.data.success && response.data.data?.workStatuses && Array.isArray(response.data.data.workStatuses)) {
        setWorkStatuses(response.data.data.workStatuses);
      } else {
        console.warn('Work statuses data structure unexpected:', response.data);
        setWorkStatuses([]);
      }
    } catch (error) {
      console.error('Error loading work statuses:', error);
      setWorkStatuses([]);
    }
  };

  const loadAppointmentForService = async (appointmentId: number) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      if (response.data.success) {
        const appointment = response.data.data;
        setPreloadedAppointment(appointment);
        setSelectedClientId(appointment.clientId);
        
        // Pre-fill the form
        createForm.reset({
          clientId: appointment.clientId,
          vehicleId: appointment.vehicleId,
          statusId: 1, // Default to first status
          problemDescription: appointment.notes || '',
          totalAmount: 0,
          mechanicCommission: 0,
        });
        
        setShowCreateModal(true);
        
        // Remove the parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('appointmentId');
        setSearchParams(newSearchParams);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Error al cargar la cita');
    }
  };

  const handleFilter = (data: ServiceFilterData) => {
    const filters = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value)
    );
    loadServices(1, filters);
  };

  const handleCreateClient = async (data: CreateClientData) => {
    try {
      const response = await api.post('/clients', {
        ...data,
        whatsapp: data.whatsapp || data.phone, // Use whatsapp if provided, otherwise use phone
      });

      if (response.data.success) {
        toast.success('Cliente creado exitosamente');
        setShowCreateClientModal(false);
        createClientForm.reset();
        await loadClients(); // Reload clients list and wait for it
        
        // Auto-select the new client
        const newClient = response.data.data;
        console.log('🆕 Cliente creado:', newClient);
        setSelectedClientIdWithLog(newClient.id);
        setClientSearch(`${newClient.name} - ${newClient.phone || newClient.whatsapp}`);
        setShowClientDropdown(false);
        createForm.setValue('clientId', newClient.id);
        
        // Also clear the vehicle selection since we have a new client
        createForm.setValue('vehicleId', 0);
        setFilteredVehicles([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    }
  };

  const handleCreateVehicle = async (data: CreateVehicleData) => {
    console.log('🚗 🔥 handleCreateVehicle EJECUTADO - Datos recibidos:', data);
    try {
      console.log('🚗 Creating vehicle with data:', { ...data, clientId: vehicleClientId });
      console.log('🚗 selectedClientId actual:', selectedClientId);
      console.log('🚗 vehicleClientId:', vehicleClientId);
      const response = await api.post('/vehicles', {
        ...data,
        clientId: vehicleClientId, // Use the stored client ID
      });
      
      console.log('🚗 Vehicle creation response:', response.data);

      if (response.data.success) {
        toast.success('Vehículo creado exitosamente');
        setShowCreateVehicleModal(false);
        setVehicleClientId(null);
        createVehicleForm.reset();
        
        // Reload vehicles for the selected client
        if (vehicleClientId) {
          await loadVehiclesByClient(vehicleClientId);
          // Also update selectedClientId if it's null
          if (!selectedClientId) {
            setSelectedClientIdWithLog(vehicleClientId);
          }
        }
        
        // Auto-select the new vehicle
        const newVehicle = response.data.data;
        console.log('🚗 Auto-selecting new vehicle:', newVehicle);
        createForm.setValue('vehicleId', newVehicle.id);
      }
    } catch (error: any) {
      console.error('🚨 Error creating vehicle:', error);
      toast.error(error.response?.data?.message || 'Error al crear vehículo');
    }
  };

  const handleCreateService = async (data: CreateServiceData) => {
    try {
      // Include appointment ID if creating from appointment and branch ID
      const serviceData = {
        ...data,
        branchId: currentBranchId,
        ...(preloadedAppointment && { appointmentId: preloadedAppointment.id })
      };
      
      const response = await api.post('/services', serviceData);
      
      if (response.data.success) {
        toast.success('Servicio creado exitosamente');
        setShowCreateModal(false);
        createForm.reset();
        setSelectedClientIdWithLog(null);
        setPreloadedAppointment(null);
        loadServices();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear servicio');
    }
  };

  const handleStatusChange = async (serviceId: number, newStatusId: number) => {
    try {
      const response = await api.put(`/services/${serviceId}/status`, {
        newStatusId,
        notes: `Estado cambiado desde la interfaz web`,
      });
      
      if (response.data.success) {
        toast.success('Estado actualizado exitosamente');
        loadServices();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleViewService = async (serviceId: number) => {
    try {
      const response = await api.get(`/services/${serviceId}`);
      if (response.data.success) {
        setSelectedService(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (error: any) {
      toast.error('Error al cargar detalles del servicio');
    }
  };

  const handleEditService = async (serviceId: number) => {
    try {
      const response = await api.get(`/services/${serviceId}`);
      if (response.data.success) {
        const service = response.data.data;
        setSelectedService(service);
        setSelectedClientId(service.clientId);
        
        // Populate form with current service data
        createForm.reset({
          clientId: service.clientId,
          vehicleId: service.vehicleId,
          mechanicId: service.mechanicId || 0,
          statusId: service.statusId, // ← CRITICAL: Preserve current status
          problemDescription: service.problemDescription || '',
          diagnosis: service.diagnosis || '',
          quotationDetails: service.quotationDetails || '',
          totalAmount: service.totalAmount,
          mechanicCommission: service.mechanicCommission,
        });
        
        setShowEditModal(true);
      }
    } catch (error: any) {
      toast.error('Error al cargar servicio para editar');
    }
  };

  const handleDeleteService = async (serviceId: number, serviceName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el servicio para ${serviceName}?`)) {
      try {
        const response = await api.delete(`/services/${serviceId}`);
        if (response.data.success) {
          toast.success('Servicio eliminado exitosamente');
          loadServices();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar servicio');
      }
    }
  };

  const handleUpdateService = async (data: CreateServiceData) => {
    if (!selectedService) return;
    
    try {
      const response = await api.put(`/services/${selectedService.id}`, data);
      
      if (response.data.success) {
        toast.success('Servicio actualizado exitosamente');
        setShowEditModal(false);
        setSelectedService(null);
        setSelectedClientIdWithLog(null);
        loadServices();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar servicio');
    }
  };

  const getStatusIcon = (statusName: string) => {
    switch (statusName) {
      case 'Recibido': return <Clock className="h-4 w-4" />;
      case 'Diagnosticando': return <Search className="h-4 w-4" />;
      case 'Cotizado': return <FileText className="h-4 w-4" />;
      case 'Autorizado': return <CheckCircle className="h-4 w-4" />;
      case 'En Progreso': return <Play className="h-4 w-4" />;
      case 'Completado': return <CheckCircle className="h-4 w-4" />;
      case 'Cancelado': return <XCircle className="h-4 w-4" />;
      case 'Entregado': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600">Gestión de órdenes de trabajo y servicios</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Tablero</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={filterForm.handleSubmit(handleFilter)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  {...filterForm.register('search')}
                  type="text"
                  placeholder="Cliente, placa, problema..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                {...filterForm.register('clientId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los clientes</option>
                {ensureArray<Client>(clients).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mechanic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mecánico
              </label>
              <select
                {...filterForm.register('mechanicId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los mecánicos</option>
                {ensureArray<Mechanic>(mechanics).map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                {...filterForm.register('statusId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                {ensureArray<WorkStatus>(workStatuses).map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
            <button
              type="button"
              onClick={() => {
                filterForm.reset();
                loadServices();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando servicios...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron servicios</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <ServicesKanban
            services={ensureArray<Service>(services)}
            workStatuses={ensureArray<WorkStatus>(workStatuses)}
            onStatusChange={handleStatusChange}
            onViewDetails={(service) => handleViewService(service.id)}
            onEdit={(service) => handleEditService(service.id)}
            isLoading={loading}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente / Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mecánico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ensureArray<Service>(services).map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {service.client.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {service.vehicle.plate} - {service.vehicle.brand} {service.vehicle.model}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">
                          {service.problemDescription || 'Sin descripción'}
                        </p>
                        {service.diagnosis && (
                          <p className="text-xs text-gray-500 truncate">
                            Diagnóstico: {service.diagnosis}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          {getStatusIcon(service.status.name)}
                        </div>
                        <select
                          value={service.statusId}
                          onChange={(e) => handleStatusChange(service.id, parseInt(e.target.value))}
                          className={`text-xs px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 ${
                            statusColors[service.status.name] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ensureArray<WorkStatus>(workStatuses).map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {service.mechanic ? (
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {service.mechanic.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(service.totalAmount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(service.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewService(service.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditService(service.id)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id, service.client.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} servicios
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadServices(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => loadServices(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {preloadedAppointment ? 'Crear Servicio desde Cita' : 'Crear Nuevo Servicio'}
              </h3>
              {preloadedAppointment && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Creando servicio desde cita #{preloadedAppointment.id} - {preloadedAppointment.client.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateService)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Search */}
                <div className="relative client-search-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onFocus={() => {
                      if (filteredClients.length > 0) {
                        setShowClientDropdown(true);
                      }
                    }}
                    placeholder="Buscar por nombre, teléfono o email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {/* Client Dropdown */}
                  {showClientDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            console.log('🔧 Cliente seleccionado:', client);
                            console.log('🔧 Client.id tipo:', typeof client.id, 'valor:', client.id);
                            
                            // Use React 18 batching to prevent race conditions
                            setTimeout(() => {
                              setSelectedClientIdWithLog(client.id);
                              setClientSearch(`${client.name} - ${client.phone}`);
                              setShowClientDropdown(false);
                              createForm.setValue('clientId', client.id);
                              createForm.setValue('vehicleId', undefined);
                              console.log('🔧 Estados actualizados para cliente:', client.id);
                            }, 0);
                          }}
                          className="client-dropdown-option w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">
                            📱 {client.phone} {client.email && `• 📧 ${client.email}`}
                          </div>
                        </button>
                      ))}
                      
                      {/* Create new client option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowClientDropdown(false);
                          setShowCreateClientModal(true);
                        }}
                        className="client-dropdown-option w-full text-left px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                      >
                        + Crear nuevo cliente "{clientSearch}"
                      </button>
                    </div>
                  )}
                  
                  {createForm.formState.errors.clientId && (
                    <p className="text-red-600 text-sm mt-1">
                      {createForm.formState.errors.clientId.message}
                    </p>
                  )}
                  
                  {/* Quick create button */}
                  <div className="mt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowCreateClientModal(true)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      + Crear cliente nuevo
                    </button>
                  </div>
                </div>

                {/* Vehicle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehículo *
                  </label>
                  <select
                    {...createForm.register('vehicleId', { valueAsNumber: true })}
                    disabled={!selectedClientId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {selectedClientId 
                        ? "Seleccionar vehículo" 
                        : "Primero selecciona un cliente"}
                    </option>
                    {ensureArray<Vehicle>(vehicles).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </option>
                    ))}
                    {selectedClientId && vehicles.length === 0 && (
                      <option value="" disabled>
                        Este cliente no tiene vehículos registrados
                      </option>
                    )}
                  </select>
                  {createForm.formState.errors.vehicleId && (
                    <p className="text-red-600 text-sm mt-1">
                      {createForm.formState.errors.vehicleId.message}
                    </p>
                  )}
                  
                  {/* Quick actions for new vehicle */}
                  {selectedClientId && (
                    <div className="mt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleClientId(selectedClientId);
                          createVehicleForm.setValue('clientId', selectedClientId || 0);
                          setShowCreateVehicleModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 underline"
                      >
                        + Agregar vehículo a este cliente
                      </button>
                    </div>
                  )}
                </div>

                {/* Mechanic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mecánico
                  </label>
                  <select
                    {...createForm.register('mechanicId', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {ensureArray<Mechanic>(mechanics).map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name} ({mechanic.commissionPercentage}% comisión)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    {...createForm.register('statusId', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ensureArray<WorkStatus>(workStatuses).map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Problema *
                </label>
                <textarea
                  {...createForm.register('problemDescription')}
                  rows={3}
                  placeholder="Describe el problema reportado por el cliente..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {createForm.formState.errors.problemDescription && (
                  <p className="text-red-600 text-sm mt-1">
                    {createForm.formState.errors.problemDescription.message}
                  </p>
                )}
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico Inicial
                </label>
                <textarea
                  {...createForm.register('diagnosis')}
                  rows={2}
                  placeholder="Diagnóstico preliminar (opcional)..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Total
                  </label>
                  <input
                    {...createForm.register('totalAmount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Mechanic Commission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comisión Mecánico <span className="text-gray-500 text-xs">(calculada automáticamente)</span>
                  </label>
                  <input
                    {...createForm.register('mechanicCommission', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    createForm.reset();
                    setSelectedClientIdWithLog(null);
                    setPreloadedAppointment(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Detalles del Servicio #{selectedService.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedService(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border ${
                statusColors[selectedService.status.name] || 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedService.status.name)}
                  <span className="font-medium">Estado: {selectedService.status.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client & Vehicle Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Información del Cliente y Vehículo
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedService.client.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>📱 {selectedService.client.phone}</p>
                      {selectedService.client.email && <p>📧 {selectedService.client.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {selectedService.vehicle.plate} - {selectedService.vehicle.brand} {selectedService.vehicle.model}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Año: {selectedService.vehicle.year}
                    </div>
                  </div>

                  {selectedService.mechanic && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedService.mechanic.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Comisión: {selectedService.mechanic.commissionPercentage}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Detalles del Servicio
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Problema Reportado:</label>
                      <p className="text-gray-900 mt-1">
                        {selectedService.problemDescription || 'No especificado'}
                      </p>
                    </div>

                    {selectedService.diagnosis && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Diagnóstico:</label>
                        <p className="text-gray-900 mt-1">{selectedService.diagnosis}</p>
                      </div>
                    )}

                    {selectedService.quotationDetails && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Detalles de Cotización:</label>
                        <p className="text-gray-900 mt-1">{selectedService.quotationDetails}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Monto Total:</label>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedService.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Comisión Mecánico:</label>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(selectedService.mechanicCommission)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-700">Creado:</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedService.createdAt)}</p>
                  <p className="text-xs text-gray-500">Por: {selectedService.createdByUser.name}</p>
                </div>
                {selectedService.startedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Iniciado:</label>
                    <p className="text-sm text-gray-600">{formatDate(selectedService.startedAt)}</p>
                  </div>
                )}
                {selectedService.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Completado:</label>
                    <p className="text-sm text-gray-600">{formatDate(selectedService.completedAt)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditService(selectedService.id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Editar Servicio
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Servicio #{selectedService.id}
              </h3>
            </div>

            <form onSubmit={createForm.handleSubmit(handleUpdateService)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    {...createForm.register('clientId', { 
                      valueAsNumber: true,
                      onChange: (e) => setSelectedClientId(parseInt(e.target.value) || null),
                      value: selectedService.clientId
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar cliente</option>
                    {ensureArray<Client>(clients).map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehículo *
                  </label>
                  <select
                    {...createForm.register('vehicleId', { 
                      valueAsNumber: true,
                      value: selectedService.vehicleId
                    })}
                    disabled={!selectedClientId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar vehículo</option>
                    {ensureArray<Vehicle>(vehicles).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mechanic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mecánico
                  </label>
                  <select
                    {...createForm.register('mechanicId', { 
                      valueAsNumber: true,
                      value: selectedService.mechanicId || ''
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {ensureArray<Mechanic>(mechanics).map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name} ({mechanic.commissionPercentage}% comisión)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    {...createForm.register('statusId', { 
                      valueAsNumber: true,
                      value: selectedService.statusId
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ensureArray<WorkStatus>(workStatuses).map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Problema *
                </label>
                <textarea
                  {...createForm.register('problemDescription', {
                    value: selectedService.problemDescription || ''
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  {...createForm.register('diagnosis', {
                    value: selectedService.diagnosis || ''
                  })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quotation Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalles de Cotización
                </label>
                <textarea
                  {...createForm.register('quotationDetails', {
                    value: selectedService.quotationDetails || ''
                  })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Total
                  </label>
                  <input
                    {...createForm.register('totalAmount', { 
                      valueAsNumber: true,
                      value: selectedService.totalAmount
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Mechanic Commission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comisión Mecánico <span className="text-gray-500 text-xs">(calculada automáticamente)</span>
                  </label>
                  <input
                    {...createForm.register('mechanicCommission', { 
                      valueAsNumber: true,
                      value: selectedService.mechanicCommission
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedService(null);
                    setSelectedClientIdWithLog(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Actualizar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Crear Nuevo Cliente
              </h3>
            </div>

            <form onSubmit={createClientForm.handleSubmit(handleCreateClient)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  {...createClientForm.register('name')}
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo del cliente"
                />
                {createClientForm.formState.errors.name && (
                  <p className="text-red-600 text-sm mt-1">
                    {createClientForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  {...createClientForm.register('phone')}
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de teléfono"
                />
                {createClientForm.formState.errors.phone && (
                  <p className="text-red-600 text-sm mt-1">
                    {createClientForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...createClientForm.register('email')}
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Correo electrónico (opcional)"
                />
                {createClientForm.formState.errors.email && (
                  <p className="text-red-600 text-sm mt-1">
                    {createClientForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  {...createClientForm.register('address')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Dirección (opcional)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClientModal(false);
                    createClientForm.reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Vehicle Modal */}
      {showCreateVehicleModal && vehicleClientId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Agregar Vehículo
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Cliente: {clients.find(c => c.id === vehicleClientId)?.name}
              </p>
            </div>

            <form onSubmit={createVehicleForm.handleSubmit(handleCreateVehicle, (errors) => {
              console.error('🚨 Errores de validación en formulario de vehículo:', errors);
            })} className="p-6 space-y-4">
              {/* Hidden clientId field */}
              <input
                type="hidden"
                {...createVehicleForm.register('clientId', { value: vehicleClientId })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa *
                  </label>
                  <input
                    {...createVehicleForm.register('plate')}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC-1234"
                  />
                  {createVehicleForm.formState.errors.plate && (
                    <p className="text-red-600 text-sm mt-1">
                      {createVehicleForm.formState.errors.plate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año *
                  </label>
                  <input
                    {...createVehicleForm.register('year')}
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2024"
                  />
                  {createVehicleForm.formState.errors.year && (
                    <p className="text-red-600 text-sm mt-1">
                      {createVehicleForm.formState.errors.year.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    {...createVehicleForm.register('brand')}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Toyota, Honda, etc."
                  />
                  {createVehicleForm.formState.errors.brand && (
                    <p className="text-red-600 text-sm mt-1">
                      {createVehicleForm.formState.errors.brand.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    {...createVehicleForm.register('model')}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Corolla, Civic, etc."
                  />
                  {createVehicleForm.formState.errors.model && (
                    <p className="text-red-600 text-sm mt-1">
                      {createVehicleForm.formState.errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    {...createVehicleForm.register('color')}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Blanco, Negro, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Combustible
                  </label>
                  <select
                    {...createVehicleForm.register('fuelType')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="GLP">GLP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmisión
                </label>
                <select
                  {...createVehicleForm.register('transmission')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateVehicleModal(false);
                    setVehicleClientId(null);
                    createVehicleForm.reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => console.log('🚗 Botón Crear Vehículo clickeado, errores actuales:', createVehicleForm.formState.errors)}
                >
                  Crear Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}