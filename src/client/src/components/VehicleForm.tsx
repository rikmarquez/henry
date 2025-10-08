import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { X, Loader2 } from 'lucide-react';

const vehicleSchema = z.object({
  plate: z.string().min(6, 'La placa debe tener al menos 6 caracteres'),
  brand: z.string().min(2, 'La marca debe tener al menos 2 caracteres'),
  model: z.string().min(2, 'El modelo debe tener al menos 2 caracteres'),
  year: z.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  color: z.string().optional(),
  fuelType: z.enum(['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'GLP', 'GNC']).optional(),
  transmission: z.enum(['Manual', 'Automática', 'CVT']).optional(),
  clientId: z.number().min(1, 'Debe seleccionar un cliente'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

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
}

interface Client {
  id: number;
  name: string;
}

interface VehicleFormProps {
  vehicle?: Vehicle;
  preselectedClientId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VehicleForm({ 
  vehicle, 
  preselectedClientId, 
  isOpen, 
  onClose, 
  onSuccess 
}: VehicleFormProps) {
  const [error, setError] = useState<string>('');
  const queryClient = useQueryClient();
  const isEditing = !!vehicle;

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-vehicle'],
    queryFn: async (): Promise<Client[]> => {
      const response = await api.get('/clients?limit=100');
      return response.data.data.clients;
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      fuelType: '',
      transmission: '',
      clientId: 0,
    },
  });

  // Update form values when vehicle prop changes or preselected client changes
  useEffect(() => {
    // Solo actualizar si los clientes ya están cargados
    if (!clientsData) return;
    
    if (vehicle) {
      reset({
        plate: vehicle.plate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        fuelType: (vehicle.fuelType as any) || '',
        transmission: (vehicle.transmission as any) || '',
        clientId: vehicle.client?.id || 0,
      });
    } else if (preselectedClientId) {
      reset({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuelType: '',
        transmission: '',
        clientId: preselectedClientId,
      });
    } else {
      // Reset form for new vehicle
      reset({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuelType: '',
        transmission: '',
        clientId: 0,
      });
    }
  }, [vehicle, preselectedClientId, clientsData, reset]);

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const payload = {
        ...data,
        plate: data.plate.toUpperCase(),
        brand: data.brand.toUpperCase(),
        model: data.model.toUpperCase(),
        color: data.color?.toUpperCase() || null,
        fuelType: data.fuelType || null,
        transmission: data.transmission || null,
        engineNumber: data.engineNumber?.toUpperCase(),
        chassisNumber: data.chassisNumber?.toUpperCase(),
      };
      const response = await api.post('/vehicles', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al crear el vehículo');
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      if (!vehicle) throw new Error('Vehículo no encontrado');
      const payload = {
        ...data,
        plate: data.plate.toUpperCase(),
        brand: data.brand.toUpperCase(),
        model: data.model.toUpperCase(),
        color: data.color?.toUpperCase() || null,
        fuelType: data.fuelType || null,
        transmission: data.transmission || null,
        engineNumber: data.engineNumber?.toUpperCase(),
        chassisNumber: data.chassisNumber?.toUpperCase(),
      };
      const response = await api.put(`/vehicles/${vehicle.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al actualizar el vehículo');
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    setError('');
    if (isEditing) {
      updateVehicleMutation.mutate(data);
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  const isLoading = createVehicleMutation.isPending || updateVehicleMutation.isPending;
  const clients = clientsData || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              id="clientId"
              {...register('clientId', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={0}>Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
            )}
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placa */}
            <div>
              <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">
                Placa *
              </label>
              <input
                type="text"
                id="plate"
                {...register('plate')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="ABC123"
                disabled={isLoading}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.plate && (
                <p className="text-red-500 text-sm mt-1">{errors.plate.message}</p>
              )}
            </div>

            {/* Año */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <input
                type="number"
                id="year"
                {...register('year', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                disabled={isLoading}
              />
              {errors.year && (
                <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
              )}
            </div>

            {/* Marca */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                id="brand"
                {...register('brand')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Toyota"
                disabled={isLoading}
              />
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>
              )}
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                id="model"
                {...register('model')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Corolla"
                disabled={isLoading}
              />
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                id="color"
                {...register('color')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Blanco"
                disabled={isLoading}
              />
            </div>

            {/* Combustible */}
            <div>
              <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de combustible
              </label>
              <select
                id="fuelType"
                {...register('fuelType')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Seleccionar combustible</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="GLP">GLP</option>
                <option value="GNC">GNC</option>
              </select>
            </div>

            {/* Transmisión */}
            <div>
              <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">
                Transmisión
              </label>
              <select
                id="transmission"
                {...register('transmission')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Seleccionar transmisión</option>
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

          </div>


          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Vehículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}