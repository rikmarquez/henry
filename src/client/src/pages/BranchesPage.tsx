import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import BranchForm from '../components/BranchForm';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Phone,
  Users,
  Wrench,
  Calendar,
  Loader2,
  AlertCircle,
  Check,
  X 
} from 'lucide-react';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  city: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    mechanics: number;
    services: number;
    appointments: number;
  };
}

interface BranchesResponse {
  branches: Branch[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export default function BranchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branchesData, isLoading, error } = useQuery({
    queryKey: ['branches', currentPage, searchTerm, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(activeFilter !== 'all' && { isActive: (activeFilter === 'active').toString() })
      });
      
      const response = await api.get(`/branches?${params}`);
      return response.data.data as BranchesResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/branches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowCreateModal(false);
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/branches/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowEditModal(false);
      setSelectedBranch(null);
    },
  });

  // Delete branch mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/branches/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDetails = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDetailsModal(true);
  };

  const handleDelete = async (branch: Branch) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la sucursal "${branch.name}"?`)) {
      deleteMutation.mutate(branch.id);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">Error al cargar las sucursales</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span>Gestión de Sucursales</span>
          </h1>
          <p className="text-gray-600 mt-1">Administra las sucursales del taller</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, ciudad o dirección..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Status Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'inactive'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inactivas
          </button>
        </div>
      </div>

      {/* Branches List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando sucursales...</p>
          </div>
        ) : !branchesData?.branches?.length ? (
          <div className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sucursales</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No se encontraron sucursales con los criterios de búsqueda.' : 'Aún no tienes sucursales registradas.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Primera Sucursal</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estadísticas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchesData.branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                              <div className="text-sm text-gray-500">Código: {branch.code}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{branch.city} - {branch.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {branch.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{branch._count?.users || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Wrench className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{branch._count?.mechanics || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{branch._count?.appointments || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{branch._count?.services || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          branch.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Inactiva
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDetails(branch)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(branch)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Eliminar"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {branchesData && branchesData.pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(branchesData.pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === branchesData.pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                        <span className="font-medium">{branchesData.pagination.totalPages}</span> 
                        {' '}({branchesData.pagination.totalCount} sucursales en total)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(branchesData.pagination.totalPages, currentPage + 1))}
                          disabled={currentPage === branchesData.pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Nueva Sucursal</h3>
            </div>
            <div className="p-6">
              <BranchForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setShowCreateModal(false)}
                isLoading={createMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Editar Sucursal</h3>
            </div>
            <div className="p-6">
              <BranchForm
                branch={selectedBranch}
                onSubmit={(data) => updateMutation.mutate({ id: selectedBranch.id, data })}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedBranch(null);
                }}
                isLoading={updateMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detalles de Sucursal</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información General</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Nombre:</span>
                      <p className="text-sm font-medium">{selectedBranch.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Código:</span>
                      <p className="text-sm font-medium">{selectedBranch.code}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Ciudad:</span>
                      <p className="text-sm font-medium">{selectedBranch.city}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Estado:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedBranch.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedBranch.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contacto</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Dirección:</span>
                      <p className="text-sm font-medium">{selectedBranch.address}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Teléfono:</span>
                      <p className="text-sm font-medium">{selectedBranch.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedBranch._count && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Estadísticas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600">Usuarios</p>
                          <p className="text-lg font-semibold text-blue-900">{selectedBranch._count.users}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600">Mecánicos</p>
                          <p className="text-lg font-semibold text-green-900">{selectedBranch._count.mechanics}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600">Citas</p>
                          <p className="text-lg font-semibold text-purple-900">{selectedBranch._count.appointments}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600">Servicios</p>
                          <p className="text-lg font-semibold text-orange-900">{selectedBranch._count.services}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBranch(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}