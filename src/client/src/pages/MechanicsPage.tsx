import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useCurrentBranchId } from '../contexts/BranchContext';
import { 
  Wrench, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Percent,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';

interface Mechanic {
  id: number;
  name: string;
  phone?: string;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    services: number;
  };
}

interface MechanicsResponse {
  mechanics: Mechanic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MechanicsPage() {
  const currentBranchId = useCurrentBranchId();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['mechanics', currentPage, searchTerm, showInactive],
    queryFn: async () => {
      const response = await api.get('/mechanics', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          isActive: showInactive ? undefined : true,
        }
      });
      return response.data.data as MechanicsResponse;
    },
  });

  const createMechanic = useMutation({
    mutationFn: async (mechanic: { name: string; phone?: string; commissionPercentage?: number }) => {
      const mechanicData = { ...mechanic, branchId: currentBranchId };
      const response = await api.post('/mechanics', mechanicData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      setShowCreateModal(false);
    },
  });

  const updateMechanic = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; phone?: string; commissionPercentage?: number; isActive?: boolean }) => {
      const response = await api.put(`/mechanics/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      setShowEditModal(false);
      setSelectedMechanic(null);
    },
  });

  const deleteMechanic = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/mechanics/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
    },
  });

  const activateMechanic = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/mechanics/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
    },
  });

  const handleCreateSubmit = (formData: FormData) => {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string || undefined;
    const commissionPercentage = formData.get('commissionPercentage') 
      ? parseFloat(formData.get('commissionPercentage') as string) 
      : undefined;

    createMechanic.mutate({ name, phone, commissionPercentage });
  };

  const handleEditSubmit = (formData: FormData) => {
    if (!selectedMechanic) return;

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string || undefined;
    const commissionPercentage = formData.get('commissionPercentage') 
      ? parseFloat(formData.get('commissionPercentage') as string) 
      : undefined;
    const isActive = formData.get('isActive') === 'on';

    updateMechanic.mutate({ 
      id: selectedMechanic.id, 
      name, 
      phone, 
      commissionPercentage,
      isActive
    });
  };

  const handleEdit = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setShowEditModal(true);
  };

  const handleDetails = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setShowDetailsModal(true);
  };

  const handleDelete = (mechanic: Mechanic) => {
    if (confirm(`¿Está seguro de desactivar al mecánico "${mechanic.name}"?`)) {
      deleteMechanic.mutate(mechanic.id);
    }
  };

  const handleActivate = (mechanic: Mechanic) => {
    if (confirm(`¿Está seguro de reactivar al mecánico "${mechanic.name}"?`)) {
      activateMechanic.mutate(mechanic.id);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600">Error al cargar los mecánicos</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Wrench className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Mecánicos</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mecánico
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar mecánico..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1);
              }}
              className="mr-2"
            />
            Mostrar inactivos
          </label>
        </div>
      </div>

      {/* Lista de mecánicos */}
      <div className="bg-white rounded-lg shadow-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando mecánicos...</p>
          </div>
        ) : !data?.mechanics.length ? (
          <div className="p-8 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron mecánicos' : 'No hay mecánicos registrados'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mecánico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicios
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
                  {data?.mechanics.map((mechanic) => (
                    <tr key={mechanic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Wrench className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {mechanic.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {mechanic.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mechanic.phone ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {mechanic.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin teléfono</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Percent className="h-4 w-4 text-gray-400 mr-2" />
                          {mechanic.commissionPercentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mechanic._count?.services || 0} servicios
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mechanic.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {mechanic.isActive ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDetails(mechanic)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(mechanic)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {mechanic.isActive ? (
                            <button
                              onClick={() => handleDelete(mechanic)}
                              className="text-red-600 hover:text-red-900"
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(mechanic)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivar"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Mecánico</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateSubmit(new FormData(e.target as HTMLFormElement));
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Comisión (%)
                </label>
                <input
                  type="number"
                  name="commissionPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="0"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMechanic.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {createMechanic.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && selectedMechanic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Mecánico</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditSubmit(new FormData(e.target as HTMLFormElement));
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={selectedMechanic.name}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={selectedMechanic.phone || ''}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Comisión (%)
                </label>
                <input
                  type="number"
                  name="commissionPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={selectedMechanic.commissionPercentage.toString()}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={selectedMechanic.isActive}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mecánico activo</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMechanic(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMechanic.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {updateMechanic.isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {showDetailsModal && selectedMechanic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Detalles del Mecánico</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre</label>
                <p className="text-gray-900">{selectedMechanic.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900">{selectedMechanic.phone || 'Sin teléfono'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Comisión</label>
                <p className="text-gray-900">{selectedMechanic.commissionPercentage}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Estado</label>
                <p className="text-gray-900">
                  {selectedMechanic.isActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Servicios</label>
                <p className="text-gray-900">{selectedMechanic._count?.services || 0} servicios</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fecha de creación</label>
                <p className="text-gray-900">
                  {new Date(selectedMechanic.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMechanic(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
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