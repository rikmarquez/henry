import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useCurrentBranchId } from '../contexts/BranchContext';
import ClientForm from '../components/ClientForm';
import ServiceHistoryTable from '../components/ServiceHistoryTable';
import PermissionGate from '../components/PermissionGate';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Car,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  whatsapp: string;
  vehicles?: Vehicle[];
  createdAt: string;
  updatedAt: string;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ClientsPage() {
  const currentBranchId = useCurrentBranchId();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);

  const queryClient = useQueryClient();

  // Fetch all clients (only once on mount)
  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<ClientsResponse> => {
      const response = await api.get('/clients?limit=1000');
      return response.data.data;
    },
  });

  // Update local clients when data changes
  useEffect(() => {
    if (clientsData?.clients) {
      setAllClients(clientsData.clients);
    }
  }, [clientsData]);

  // Frontend-only filtering
  const filteredClients = allClients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      (client.whatsapp && client.whatsapp.includes(search))
    );
  });

  // Pagination for filtered results
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await api.delete(`/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by frontend filtering, no need for additional logic
  };

  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${client.name}"?`)) {
      try {
        await deleteClientMutation.mutateAsync(client.id);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente. Puede que tenga vehículos o servicios asociados.');
      }
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar clientes</h2>
          <p className="text-gray-600">No se pudieron cargar los clientes.</p>
        </div>
      </div>
    );
  }

  const clients = paginatedClients;
  const pagination = {
    page: currentPage,
    limit: itemsPerPage,
    total: filteredClients.length,
    pages: totalPages
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                <p className="mt-1 text-gray-600">
                  Total: {pagination?.total || 0} clientes registrados
                </p>
              </div>
            </div>
            <PermissionGate
              resource="clients"
              action="create"
              fallbackMode="disable"
            >
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nuevo Cliente
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o WhatsApp..."
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
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Limpiar
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.whatsapp && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{client.whatsapp}</span>
                          </div>
                        )}
                        {!client.whatsapp && (
                          <span className="text-gray-400">Sin WhatsApp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Car className="h-4 w-4" />
                        <button
                          onClick={() => window.location.href = `/vehicles?clientId=${client.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {client.vehicles?.length || 0} vehículos
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(client)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <PermissionGate
                          resource="clients"
                          action="update"
                          fallbackMode="disable"
                        >
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                        <PermissionGate
                          resource="clients"
                          action="delete"
                          fallbackMode="disable"
                        >
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar"
                            disabled={deleteClientMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {clients.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
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

      {/* Formulario de cliente */}
      <ClientForm
        client={selectedClient}
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        onSuccess={() => {
          // Refresh data will be handled by the form component
        }}
      />

      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Detalles del Cliente
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Client Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">Información Personal</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div><strong>Nombre:</strong> {selectedClient.name}</div>
                  <div><strong>Email:</strong> {selectedClient.email || 'No registrado'}</div>
                  <div><strong>Teléfono:</strong> {selectedClient.phone || 'No registrado'}</div>
                  <div><strong>Dirección:</strong> {selectedClient.address || 'No registrada'}</div>
                  <div><strong>Documento:</strong> {
                    selectedClient.documentType && selectedClient.documentNumber 
                      ? `${selectedClient.documentType}: ${selectedClient.documentNumber}`
                      : 'No registrado'
                  }</div>
                  <div>
                    <strong>Vehículos:</strong> {selectedClient.vehicles?.length || 0}
                    {(selectedClient.vehicles?.length || 0) > 0 && (
                      <button
                        onClick={() => {
                          window.location.href = `/vehicles?clientId=${selectedClient.id}`;
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <Car className="w-4 h-4" />
                        <span>Ver vehículos</span>
                      </button>
                    )}
                  </div>
                  <div><strong>Fecha registro:</strong> {new Date(selectedClient.createdAt).toLocaleDateString('es-MX')}</div>
                </div>
              </div>

              {/* Service History */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">Historial de Servicios</h3>
                <ServiceHistoryTable 
                  type="client" 
                  id={selectedClient.id}
                  compact={true}
                  limit={5}
                  showViewAllButton={true}
                  onViewAll={() => {
                    // TODO: Navigate to full history page
                    console.log('Navigate to full history for client', selectedClient.id);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}