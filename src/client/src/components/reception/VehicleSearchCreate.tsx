import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  Search,
  Car,
  Plus,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// Schema para crear vehículo
const vehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida'),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.number().int().min(1900).max(2030).optional(),
  color: z.string().optional(),
  clientId: z.number(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleSearchCreateProps {
  clientId: number;
  clientName: string;
  onVehicleSelected: (vehicle: any) => void;
  onBack: () => void;
  onCancel: () => void;
}

export const VehicleSearchCreate: React.FC<VehicleSearchCreateProps> = ({
  clientId,
  clientName,
  onVehicleSelected,
  onBack,
  onCancel,
}) => {
  console.log('[VehicleSearchCreate] Recibido clientId:', clientId);
  console.log('[VehicleSearchCreate] Recibido clientName:', clientName);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Query para vehículos del cliente
  const { data: clientVehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['client-vehicles', clientId],
    queryFn: async () => {
      console.log('[VehicleSearchCreate] Buscando vehículos para clientId:', clientId);
      const { data } = await api.get(`/vehicles/by-client/${clientId}`);
      return data.data?.vehicles || data.vehicles || [];
    },
    enabled: !!clientId, // Solo ejecutar si clientId existe
  });

  // Query para buscar vehículos por placa
  const { data: searchedVehicles = [], isLoading: isSearching } = useQuery({
    queryKey: ['vehicles-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data } = await api.get('/vehicles', {
        params: { search: searchTerm, limit: 20 },
      });
      return data.vehicles || [];
    },
    enabled: searchTerm.length >= 2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      clientId,
    },
  });

  const handleCreateVehicle = async (formData: VehicleFormData) => {
    console.log('[VehicleSearchCreate] handleCreateVehicle llamado');
    console.log('[VehicleSearchCreate] formData:', formData);
    console.log('[VehicleSearchCreate] errors:', errors);

    try {
      setIsCreating(true);
      const { data } = await api.post('/vehicles', formData);
      console.log('[VehicleSearchCreate] Response completa:', data);

      // La respuesta tiene estructura: { success, data: { vehicle: {...} } }
      const vehicleData = data.data?.vehicle || data.vehicle || data.data || data;
      console.log('[VehicleSearchCreate] Vehículo extraído:', vehicleData);
      console.log('[VehicleSearchCreate] Vehículo ID:', vehicleData?.id);

      toast.success('Vehículo creado exitosamente');
      onVehicleSelected(vehicleData);
    } catch (error: any) {
      console.error('[VehicleSearchCreate] Error al crear vehículo:', error);
      toast.error(error.response?.data?.message || 'Error al crear vehículo');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtrar vehículos del cliente por búsqueda local
  const filteredClientVehicles = clientVehicles.filter((vehicle: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      vehicle.plate.toLowerCase().includes(search) ||
      vehicle.brand.toLowerCase().includes(search) ||
      vehicle.model.toLowerCase().includes(search)
    );
  });

  // Vista del formulario de creación
  if (showCreateForm) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Car className="h-6 w-6 text-blue-600" />
          Crear Vehículo Nuevo
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Cliente: <span className="font-semibold">{clientName}</span>
        </p>

        <form
          onSubmit={handleSubmit(
            handleCreateVehicle,
            (validationErrors) => {
              console.log('[VehicleSearchCreate] Errores de validación:', validationErrors);
              toast.error('Por favor completa los campos requeridos');
            }
          )}
          className="space-y-4"
        >
          {/* Placa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('plate')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              placeholder="Ej: ABC-1234 o TEMP-12345"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si no conoces la placa, usa formato TEMP-12345
            </p>
            {errors.plate && (
              <p className="mt-1 text-sm text-red-600">{errors.plate.message}</p>
            )}
          </div>

          {/* Marca y Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('brand')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Toyota"
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('model')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Corolla"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>
          </div>

          {/* Año y Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año (opcional)
              </label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 2020"
                min="1900"
                max="2030"
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color (opcional)
              </label>
              <input
                type="text"
                {...register('color')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Blanco"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Crear Vehículo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Vista de búsqueda
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Car className="h-6 w-6 text-blue-600" />
        Paso 2: Buscar o Crear Vehículo
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Cliente: <span className="font-semibold">{clientName}</span>
      </p>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Vehículos del cliente */}
      {isLoadingVehicles ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando vehículos...</span>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {filteredClientVehicles.length > 0 ? (
            <>
              <p className="text-sm font-medium text-gray-700">
                Vehículos de {clientName}:
              </p>
              {filteredClientVehicles.map((vehicle: any) => {
                const isTemp = vehicle.plate.startsWith('TEMP-');
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => onVehicleSelected(vehicle)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          {isTemp && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              TEMPORAL
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-mono font-semibold">{vehicle.plate}</span>
                          {vehicle.year && ` • ${vehicle.year}`}
                          {vehicle.color && ` • ${vehicle.color}`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </button>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-600 mb-2">
                Este cliente no tiene vehículos registrados
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Crea el primer vehículo para continuar
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botón Crear Nuevo Vehículo */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 mb-4"
      >
        <Plus className="h-5 w-5" />
        Crear Vehículo Nuevo
      </button>

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          ← Atrás
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
