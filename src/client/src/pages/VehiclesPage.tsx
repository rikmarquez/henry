import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import VehicleForm from '../components/VehicleForm';
import { 
  Car, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  fuelType: string | null;
  transmission: string | null;
  client: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VehiclesResponse {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Client {
  id: number;
  name: string;
}

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Check URL parameters for preselected client
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId');
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, []);
  
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehiclesData, isLoading, error } = useQuery({
    queryKey: ['vehicles', currentPage, searchTerm, selectedClientId],
    queryFn: async (): Promise<VehiclesResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedClientId && { clientId: selectedClientId })
      });
      const response = await api.get(`/vehicles?${params}`);
      return response.data.data;
    },
  });

  // Fetch clients for filter
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-filter'],
    queryFn: async (): Promise<Client[]> => {
      const response = await api.get('/clients?limit=100');
      return response.data.data.clients;
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      await api.delete(`/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate})?`)) {
      try {
        await deleteVehicleMutation.mutateAsync(vehicle.id);
      } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        alert('Error al eliminar el vehículo. Puede que tenga servicios asociados.');
      }
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClientId('');
    setCurrentPage(1);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar vehículos</h2>
          <p className="text-gray-600">No se pudieron cargar los vehículos.</p>
        </div>
      </div>
    );
  }

  const vehicles = vehiclesData?.vehicles || [];
  const pagination = vehiclesData?.pagination;
  const clients = clientsData || [];

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
                <p className="mt-1 text-gray-600">
                  Total: {pagination?.total || 0} vehículos registrados
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nuevo Vehículo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Búsqueda */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca, modelo o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Buscar
                </button>
              </div>

              {/* Filtro por cliente */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>Filtros:</span>
                </div>
                <div className="flex-1">
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id.toString()}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(searchTerm || selectedClientId) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Tabla de vehículos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.fuelType || 'Combustible no especificado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        {vehicle.client.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.color || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(vehicle.createdAt).toLocaleDateString('es-MX')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(vehicle)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Eliminar"
                          disabled={deleteVehicleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {vehicles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm || selectedClientId ? 'No se encontraron vehículos que coincidan con los filtros' : 'No hay vehículos registrados'}
              </div>
            )}
          </div>

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * (pagination.limit || 10) + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * (pagination.limit || 10), pagination.total)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === pagination.pages || 
                        Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, array) => (
                        <div key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de vehículo */}
      <VehicleForm
        vehicle={selectedVehicle}
        preselectedClientId={selectedClientId ? parseInt(selectedClientId) : undefined}
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedVehicle(null);
        }}
        onSuccess={() => {
          // Refresh data will be handled by the form component
        }}
      />

      {showDetailsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Detalles del Vehículo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Marca:</strong> {selectedVehicle.brand}</div>
              <div><strong>Modelo:</strong> {selectedVehicle.model}</div>
              <div><strong>Placa:</strong> {selectedVehicle.plate}</div>
              <div><strong>Año:</strong> {selectedVehicle.year}</div>
              <div><strong>Color:</strong> {selectedVehicle.color || 'No especificado'}</div>
              <div><strong>Combustible:</strong> {selectedVehicle.fuelType || 'No especificado'}</div>
              <div><strong>Transmisión:</strong> {selectedVehicle.transmission || 'No especificado'}</div>
              <div className="md:col-span-2"><strong>Propietario:</strong> {selectedVehicle.client.name}</div>
              <div className="md:col-span-2">
                <strong>Fecha registro:</strong> {new Date(selectedVehicle.createdAt).toLocaleDateString('es-MX')}
              </div>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}