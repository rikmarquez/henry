import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Loader2, Users, Car, Calendar, Wrench, TrendingUp, AlertCircle, Target, Clock, ArrowRight, Search, Plus, UserPlus, Phone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  overview: {
    totalClients: number;
    totalVehicles: number;
    totalMechanics: number;
    totalAppointments: number;
    totalServices: number;
    totalOpportunities: number;
  };
  active: {
    activeClients: number;
    activeMechanics: number;
    pendingAppointments: number;
    inProgressServices: number;
    pendingOpportunities: number;
  };
  revenue: {
    total: number;
    period: string;
  };
  recentServices: Array<{
    id: number;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
    status: { name: string; color: string };
    totalAmount: number;
    createdAt: string;
  }>;
  upcomingOpportunities: Array<{
    id: number;
    type: string;
    description: string;
    followUpDate: string;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
  }>;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  vehicles: Array<{
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
    color?: string;
  }>;
  services?: Array<{
    id: number;
    createdAt: string;
    totalAmount: number;
    status: {
      name: string;
      color: string;
    };
    vehicle: {
      plate: string;
      brand: string;
      model: string;
    };
  }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get('/reports/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Query para búsqueda de clientes
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['clients-search', searchTerm],
    queryFn: async (): Promise<Client[]> => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      const response = await api.get(`/clients?limit=1000`);
      const allClients = response.data.data.clients || [];

      // Filtrar en el frontend
      const filteredClients = allClients.filter((client: Client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.whatsapp && client.whatsapp.includes(searchTerm)) ||
        client.vehicles.some(v =>
          v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.model.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      // Para cada cliente encontrado, obtener sus servicios recientes
      const clientsWithServices = await Promise.all(
        filteredClients.map(async (client) => {
          try {
            const servicesResponse = await api.get(`/services/client/${client.id}?limit=3`);
            return {
              ...client,
              services: servicesResponse.data.data.services || []
            };
          } catch (error) {
            return {
              ...client,
              services: []
            };
          }
        })
      );

      return clientsWithServices;
    },
    enabled: searchTerm.length >= 2,
  });

  const handleCreateAppointmentWithClient = (client: Client, vehicle?: any) => {
    // Limpiar búsqueda
    setSearchTerm('');
    setShowResults(false);

    // Navegar a la página de citas con parámetros de cliente preseleccionado
    const params = new URLSearchParams({
      clientId: client.id.toString(),
      clientName: client.name,
      ...(vehicle && {
        vehicleId: vehicle.id.toString(),
        vehiclePlate: vehicle.plate,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model
      })
    });
    navigate(`/appointments?${params.toString()}&mode=create`);
  };

  const handleCreateNewClient = () => {
    // Limpiar búsqueda
    setSearchTerm('');
    setShowResults(false);
    navigate('/clients?mode=create');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h2>
          <p className="text-gray-600">No se pudieron cargar las métricas del taller.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Bienvenido, {user?.name} - Henry Diagnostics
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString('es-MX')}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Búsqueda de Clientes */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">¿Crear una cita?</h2>
            <p className="text-blue-100">Busca primero si el cliente ya existe para evitar duplicados</p>
          </div>

          <div className="max-w-2xl mx-auto" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nombre, teléfono, placa de vehículo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(e.target.value.length >= 2);
                }}
                onFocus={() => setShowResults(searchTerm.length >= 2)}
                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {showResults && (
              <div className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 max-h-[32rem] overflow-y-auto">
                {searchResults && searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {searchResults.slice(0, 6).map((client) => (
                      <div key={client.id} className="p-6 hover:bg-gray-50">
                        <div className="space-y-4">
                          {/* Información del Cliente */}
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-semibold text-gray-900">{client.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </span>
                                {client.whatsapp && (
                                  <span className="text-green-600">
                                    WhatsApp: {client.whatsapp}
                                  </span>
                                )}
                                {client.email && (
                                  <span>
                                    {client.email}
                                  </span>
                                )}
                              </div>
                              {client.address && (
                                <p className="text-sm text-gray-500 mt-1">{client.address}</p>
                              )}
                            </div>
                          </div>

                          {/* Vehículos */}
                          {client.vehicles && client.vehicles.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehículos registrados ({client.vehicles.length})
                              </h5>
                              <div className="grid grid-cols-1 gap-2">
                                {client.vehicles.map((vehicle) => (
                                  <div key={vehicle.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-900 block">{vehicle.plate}</span>
                                        <span className="text-gray-600">
                                          {vehicle.brand} {vehicle.model}
                                          {vehicle.year && ` (${vehicle.year})`}
                                          {vehicle.color && ` - ${vehicle.color}`}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleCreateAppointmentWithClient(client, vehicle)}
                                      className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                                    >
                                      <Calendar className="h-4 w-4" />
                                      Crear Cita
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Servicios Recientes */}
                          {client.services && client.services.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Servicios recientes
                              </h5>
                              <div className="space-y-2">
                                {client.services.map((service) => (
                                  <div key={service.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-900">
                                            {service.vehicle.plate} - {service.vehicle.brand} {service.vehicle.model}
                                          </span>
                                          <span
                                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                            style={{ backgroundColor: service.status.color }}
                                          >
                                            {service.status.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-gray-600">
                                          <span>{new Date(service.createdAt).toLocaleDateString('es-MX')}</span>
                                          <span className="font-semibold">
                                            {new Intl.NumberFormat('es-MX', {
                                              style: 'currency',
                                              currency: 'MXN',
                                            }).format(service.totalAmount)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botón para cliente sin vehículos */}
                          {(!client.vehicles || client.vehicles.length === 0) && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 mb-3">Cliente sin vehículos registrados</p>
                              <button
                                onClick={() => handleCreateAppointmentWithClient(client)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                                Crear cita + registrar vehículo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-6 text-center">
                    <div className="mb-4">
                      <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontró el cliente</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        No existe ningún cliente con "{searchTerm}". ¿Es un cliente nuevo?
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNewClient}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Crear Cliente Nuevo
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primera línea - CITAS, SERVICIOS Y OPORTUNIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Citas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Citas</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalAppointments || 0}</p>
                <p className="text-sm text-yellow-600">
                  {dashboardData?.active.pendingAppointments || 0} pendientes
                </p>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalServices || 0}</p>
                <p className="text-sm text-purple-600">
                  {dashboardData?.active.inProgressServices || 0} en progreso
                </p>
              </div>
            </div>
          </div>

          {/* Oportunidades */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalOpportunities || 0}</p>
                <p className="text-sm text-orange-600">
                  {dashboardData?.active.pendingOpportunities || 0} pendientes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Segunda línea - CLIENTES y VEHÍCULOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Clientes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Totales</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalClients || 0}</p>
                <p className="text-sm text-green-600">
                  {dashboardData?.active.activeClients || 0} activos
                </p>
              </div>
            </div>
          </div>

          {/* Vehículos */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehículos</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalVehicles || 0}</p>
                <p className="text-sm text-gray-500">Registrados</p>
              </div>
            </div>
          </div>
        </div>


        {/* Grid para Servicios Recientes y Oportunidades Próximas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Oportunidades Próximas */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Seguimientos Próximos
                </h2>
                <span className="text-sm text-orange-600 font-medium">
                  {dashboardData?.upcomingOpportunities?.length || 0} requieren atención
                </span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.upcomingOpportunities && dashboardData.upcomingOpportunities.length > 0 ? (
                <div className="space-y-4 p-6">
                  {dashboardData.upcomingOpportunities.map((opportunity) => {
                    const followUpDate = new Date(opportunity.followUpDate);
                    const today = new Date();
                    const diffTime = followUpDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays < 0;
                    const isDueToday = diffDays === 0;
                    const isDueSoon = diffDays > 0 && diffDays <= 7;
                    
                    return (
                      <div key={opportunity.id} className={`border rounded-lg p-4 ${
                        isOverdue ? 'border-red-200 bg-red-50' : 
                        isDueToday ? 'border-orange-200 bg-orange-50' :
                        isDueSoon ? 'border-yellow-200 bg-yellow-50' : 
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`h-4 w-4 ${
                                isOverdue ? 'text-red-600' : 
                                isDueToday ? 'text-orange-600' :
                                'text-yellow-600'
                              }`} />
                              <span className="font-medium text-gray-900">
                                {opportunity.client.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {opportunity.vehicle.plate} - {opportunity.vehicle.brand} {opportunity.vehicle.model}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">{opportunity.type}:</span> {opportunity.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className={`font-medium ${
                                isOverdue ? 'text-red-600' : 
                                isDueToday ? 'text-orange-600' :
                                'text-yellow-600'
                              }`}>
                                {isOverdue ? `Vencido hace ${Math.abs(diffDays)} días` :
                                 isDueToday ? 'Vence hoy' :
                                 `Vence en ${diffDays} días`}
                              </span>
                              <span className="text-gray-500">
                                {followUpDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button className="ml-3 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors">
                            <ArrowRight className="h-3 w-3" />
                            Contactar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No hay oportunidades próximas</p>
                  <p className="text-sm mt-1">Todas las oportunidades están al día</p>
                </div>
              )}
            </div>
          </div>

          {/* Servicios Recientes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Servicios Recientes
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.recentServices && dashboardData.recentServices.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dashboardData.recentServices.map((service) => (
                    <div key={service.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {service.client.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {service.vehicle.brand} {service.vehicle.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">
                              {service.vehicle.plate}
                            </span>
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: service.status.color }}
                            >
                              {service.status.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(service.totalAmount)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(service.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No hay servicios recientes</p>
                  <p className="text-sm mt-1">Los servicios aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}