import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  X,
  Car,
  User,
  Phone,
  Gauge,
  Fuel,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Circle,
  Shield,
  Droplet,
  Calendar,
  Save,
} from 'lucide-react';

// Schema de validación para edición
const serviceEditSchema = z.object({
  kilometraje: z.number().int().min(0, 'El kilometraje debe ser mayor o igual a 0'),
  nivelCombustible: z.enum(['1/4', '1/2', '3/4', 'FULL'], {
    errorMap: () => ({ message: 'Selecciona un nivel de combustible válido' })
  }),
  lucesOk: z.boolean(),
  llantasOk: z.boolean(),
  cristalesOk: z.boolean(),
  carroceriaOk: z.boolean(),
  observacionesRecepcion: z.string().optional(),
});

type ServiceEditFormData = z.infer<typeof serviceEditSchema>;

interface ServiceDetailsModalProps {
  serviceId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  serviceId,
  onClose,
  onUpdate,
}) => {
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServiceEditFormData>({
    resolver: zodResolver(serviceEditSchema),
  });

  const nivelCombustible = watch('nivelCombustible');

  // Cargar detalles del servicio
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/reception/service/${serviceId}`);
        const serviceData = response.data;
        setService(serviceData);

        // Cargar valores en el formulario
        reset({
          kilometraje: serviceData.kilometraje || 0,
          nivelCombustible: serviceData.nivelCombustible || '1/2',
          lucesOk: serviceData.lucesOk ?? true,
          llantasOk: serviceData.llantasOk ?? true,
          cristalesOk: serviceData.cristalesOk ?? true,
          carroceriaOk: serviceData.carroceriaOk ?? true,
          observacionesRecepcion: serviceData.observacionesRecepcion || '',
        });
      } catch (error) {
        console.error('Error al cargar detalles del servicio:', error);
        toast.error('Error al cargar detalles del servicio');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, reset, onClose]);

  const onSubmit = async (data: ServiceEditFormData) => {
    try {
      setIsSaving(true);
      await api.put(`/services/${serviceId}`, {
        kilometraje: data.kilometraje,
        nivelCombustible: data.nivelCombustible,
        lucesOk: data.lucesOk,
        llantasOk: data.llantasOk,
        cristalesOk: data.cristalesOk,
        carroceriaOk: data.carroceriaOk,
        observacionesRecepcion: data.observacionesRecepcion,
      });

      toast.success('Detalles actualizados exitosamente');
      setIsEditing(false);

      // Recargar datos actualizados
      const response = await api.get(`/reception/service/${serviceId}`);
      setService(response.data);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error al actualizar detalles:', error);
      toast.error('Error al actualizar detalles');
    } finally {
      setIsSaving(false);
    }
  };

  const fuelLevels = [
    { value: '1/4', label: '1/4', icon: '▁' },
    { value: '1/2', label: '1/2', icon: '▄' },
    { value: '3/4', label: '3/4', icon: '▆' },
    { value: 'FULL', label: 'FULL', icon: '█' },
  ] as const;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-lg text-gray-700">Cargando detalles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Detalles de Recepción</h2>
                <p className="text-blue-100">
                  {service.vehicle.brand} {service.vehicle.model} - {service.vehicle.plate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información del Cliente y Vehículo */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                <User className="h-4 w-4" />
                Cliente
              </label>
              <p className="text-lg font-medium text-gray-900">{service.client.name}</p>
              <p className="text-sm text-gray-600">{service.client.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Recibido por
              </label>
              <p className="text-lg font-medium text-gray-900">
                {service.receptionist?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {service.receivedAt
                  ? new Date(service.receivedAt).toLocaleString('es-MX')
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Botón Editar/Cancelar */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar Edición
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Editar Detalles
              </button>
            )}
          </div>

          {/* Kilometraje */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Gauge className="h-5 w-5" />
              Kilometraje
            </h3>
            {isEditing ? (
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  {...register('kilometraje', { valueAsNumber: true })}
                  className="h-12 text-xl font-semibold max-w-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  inputMode="numeric"
                />
                <span className="text-lg font-medium text-gray-600">km</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {service.kilometraje?.toLocaleString() || 0} km
              </p>
            )}
            {errors.kilometraje && (
              <p className="text-red-500 text-sm mt-2">{errors.kilometraje.message}</p>
            )}
          </div>

          {/* Nivel de Combustible */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Fuel className="h-5 w-5" />
              Nivel de Combustible
            </h3>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fuelLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setValue('nivelCombustible', level.value)}
                    className={`h-16 rounded-lg border-2 transition-all font-semibold ${
                      nivelCombustible === level.value
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{level.icon}</div>
                    {level.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {fuelLevels.find((l) => l.value === service.nivelCombustible)?.label || 'N/A'}
              </p>
            )}
            {errors.nivelCombustible && (
              <p className="text-red-500 text-sm mt-2">{errors.nivelCombustible.message}</p>
            )}
          </div>

          {/* Inspección Visual */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5" />
              Inspección Visual
            </h3>
            <div className="space-y-3">
              {/* Luces */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {isEditing ? (
                  <input
                    type="checkbox"
                    id="lucesOk"
                    checked={watch('lucesOk')}
                    onChange={(e) => setValue('lucesOk', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    {service.lucesOk ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
                <label htmlFor="lucesOk" className="flex items-center gap-2 flex-1">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Luces funcionando correctamente
                </label>
              </div>

              {/* Llantas */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {isEditing ? (
                  <input
                    type="checkbox"
                    id="llantasOk"
                    checked={watch('llantasOk')}
                    onChange={(e) => setValue('llantasOk', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    {service.llantasOk ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
                <label htmlFor="llantasOk" className="flex items-center gap-2 flex-1">
                  <Circle className="h-5 w-5 text-gray-600" />
                  Llantas en buen estado
                </label>
              </div>

              {/* Cristales */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {isEditing ? (
                  <input
                    type="checkbox"
                    id="cristalesOk"
                    checked={watch('cristalesOk')}
                    onChange={(e) => setValue('cristalesOk', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    {service.cristalesOk ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
                <label htmlFor="cristalesOk" className="flex items-center gap-2 flex-1">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Cristales completos sin daños
                </label>
              </div>

              {/* Carrocería */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {isEditing ? (
                  <input
                    type="checkbox"
                    id="carroceriaOk"
                    checked={watch('carroceriaOk')}
                    onChange={(e) => setValue('carroceriaOk', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="h-5 w-5 flex items-center justify-center">
                    {service.carroceriaOk ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
                <label htmlFor="carroceriaOk" className="flex items-center gap-2 flex-1">
                  <Droplet className="h-5 w-5 text-gray-600" />
                  Carrocería sin golpes nuevos
                </label>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5" />
              Observaciones Especiales
            </h3>
            {isEditing ? (
              <textarea
                {...register('observacionesRecepcion')}
                className="min-h-[100px] w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Rayón puerta trasera, cristal estrellado, golpe defensa delantera, etc."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {service.observacionesRecepcion || 'Sin observaciones'}
              </p>
            )}
          </div>

          {/* Firma del Cliente */}
          {service.firmaCliente && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">Firma del Cliente</h3>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={service.firmaCliente}
                  alt="Firma del cliente"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          {isEditing && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                disabled={isSaving}
                className="flex-1 h-12 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-12 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
