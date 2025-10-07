import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useReception } from '../../hooks/useReception';
import { SignatureCanvas } from './SignatureCanvas';
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Gauge,
  Fuel,
  CheckCircle,
  AlertCircle,
  Wind,
  Shield,
  Lock,
  Package,
  Grip,
} from 'lucide-react';

// Schema de validación local para el frontend
const vehicleReceptionSchema = z.object({
  appointmentId: z.number().nullable().optional(),
  clientId: z.number(),
  vehicleId: z.number(),
  kilometraje: z.number().int().min(0, 'El kilometraje debe ser mayor o igual a 0'),
  nivelCombustible: z.enum(['1/4', '1/2', '3/4', 'FULL'], {
    errorMap: () => ({ message: 'Selecciona un nivel de combustible válido' })
  }),
  aireAcondicionadoOk: z.boolean().default(true),
  cristalesOk: z.boolean().default(true),
  candadoLlantaOk: z.boolean().default(true),
  pertenenciasCajuelaOk: z.boolean().default(true),
  manijasOk: z.boolean().default(true),
  observacionesRecepcion: z.string().optional(),
  firmaCliente: z.string().optional(), // Validamos manualmente en onSubmit
  fotosRecepcion: z.array(z.string()).optional(),

  // Campos opcionales para actualizar vehículo
  vehicleUpdates: z.object({
    plate: z.string().min(1, 'La placa es requerida').optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().min(1900).max(2030).optional(),
    color: z.string().optional(),
  }).optional(),
});

type VehicleReceptionFormData = z.infer<typeof vehicleReceptionSchema>;

interface VehicleReceptionFormProps {
  appointment: any;
  onComplete: () => void;
  onCancel: () => void;
}

export const VehicleReceptionForm: React.FC<VehicleReceptionFormProps> = ({
  appointment,
  onComplete,
  onCancel,
}) => {
  const { receiveVehicleAsync, isReceivingVehicle } = useReception();
  const [signature, setSignature] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleReceptionFormData>({
    resolver: zodResolver(vehicleReceptionSchema),
    defaultValues: {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      vehicleId: appointment.vehicleId,
      aireAcondicionadoOk: true,
      cristalesOk: true,
      candadoLlantaOk: true,
      pertenenciasCajuelaOk: true,
      manijasOk: true,
    },
  });

  const nivelCombustible = watch('nivelCombustible');

  const onSubmit = async (data: VehicleReceptionFormData) => {
    console.log('[VehicleReceptionForm] ========== INICIO onSubmit ==========');
    console.log('[VehicleReceptionForm] Signature existe?:', !!signature);

    // Validar firma
    if (!signature) {
      console.log('[VehicleReceptionForm] ERROR: No hay firma');
      setSignatureError('La firma del cliente es requerida');
      return;
    }

    try {
      console.log('[VehicleReceptionForm] Datos del formulario:', data);

      // Filtrar solo campos que tengan valor en vehicleUpdates
      const vehicleUpdates = data.vehicleUpdates
        ? Object.fromEntries(
            Object.entries(data.vehicleUpdates).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
          )
        : undefined;

      const payload = {
        ...data,
        firmaCliente: signature,
        vehicleUpdates: vehicleUpdates && Object.keys(vehicleUpdates).length > 0 ? vehicleUpdates : undefined,
      };

      console.log('[VehicleReceptionForm] Payload a enviar:', payload);

      await receiveVehicleAsync(payload);

      console.log('[VehicleReceptionForm] Recepción exitosa');
      onComplete();
    } catch (error: any) {
      console.error('[VehicleReceptionForm] Error completo:', error);
      console.error('[VehicleReceptionForm] Error response:', error?.response);
      console.error('[VehicleReceptionForm] Error data:', error?.response?.data);

      // Manejar error de placa duplicada
      if (error?.response?.status === 409 && error?.response?.data?.code === 'DUPLICATE_PLATE') {
        const errorData = error.response.data;
        if (errorData.canMerge) {
          // Mismo cliente - mostrar modal de confirmación
          setDuplicateData(errorData);
          setShowMergeModal(true);
        } else {
          // Cliente diferente - mostrar error
          alert(`Error: La placa ya está registrada para otro cliente: ${errorData.existingVehicle.client.name}\n\nPor favor, verifica la placa ingresada.`);
        }
      } else {
        // Otros errores - mostrar mensaje genérico
        const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido al recibir vehículo';
        console.error('[VehicleReceptionForm] Mostrando error al usuario:', errorMessage);
        alert(`Error: ${errorMessage}\n\nPor favor, verifica la consola para más detalles.`);
      }
    }
  };

  const handleSignatureChange = (sig: string) => {
    setSignature(sig);
    if (sig) {
      setSignatureError('');
    }
  };

  const handleMergeConfirm = async () => {
    if (!duplicateData) return;

    try {
      // Llamar al endpoint de merge
      const response = await fetch('/api/reception/merge-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          tempVehicleId: duplicateData.tempVehicle.id,
          existingVehicleId: duplicateData.existingVehicle.id,
          appointmentId: appointment.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al fusionar vehículos');
      }

      // Cerrar modal
      setShowMergeModal(false);
      setDuplicateData(null);

      // Notificar éxito y cerrar formulario
      alert('Vehículos fusionados exitosamente. Por favor, vuelva a recibir el vehículo.');
      onCancel(); // Volver a la lista para refrescar datos
    } catch (error) {
      console.error('Error al fusionar vehículos:', error);
      alert('Error al fusionar vehículos. Por favor, intente nuevamente.');
    }
  };

  const fuelLevels = [
    { value: '1/4', label: '1/4', icon: '▁' },
    { value: '1/2', label: '1/2', icon: '▄' },
    { value: '3/4', label: '3/4', icon: '▆' },
    { value: 'FULL', label: 'FULL', icon: '█' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isReceivingVehicle}
          className="mb-4 h-12 text-lg px-4 py-2 bg-transparent hover:bg-gray-100 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a Lista
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Car className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recepción de Vehículo</h1>
            <p className="text-gray-600">Complete la inspección y firma del cliente</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(
          onSubmit,
          (errors) => {
            console.log('[VehicleReceptionForm] ❌ ERRORES DE VALIDACIÓN:', errors);
            alert('Error de validación del formulario. Revisa la consola para detalles.');
          }
        )}
        className="space-y-6 max-w-4xl"
      >
        {/* Información del Vehículo y Cliente */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-blue-50">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Datos del Vehículo
            </h3>
            <p className="text-sm text-gray-600 mt-1">Puede actualizar los datos del vehículo durante la recepción</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Indicador de placa temporal */}
            {appointment?.vehicle?.plate?.startsWith('TEMP') && (
              <div className="p-3 bg-orange-100 border-l-4 border-orange-500 rounded flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">
                  ⚠️ PLACA TEMPORAL - Actualizar con placa real del vehículo
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placa - Editable */}
              <div>
                <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">
                  Placa del Vehículo *
                </label>
                <input
                  type="text"
                  id="plate"
                  defaultValue={appointment?.vehicle?.plate || ''}
                  {...register('vehicleUpdates.plate')}
                  className="h-12 text-lg font-bold uppercase w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="ABC-1234"
                />
                {errors.vehicleUpdates?.plate && (
                  <p className="text-red-500 text-sm mt-1">{errors.vehicleUpdates.plate.message}</p>
                )}
              </div>

              {/* Marca - Editable */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  id="brand"
                  defaultValue={appointment?.vehicle?.brand || ''}
                  {...register('vehicleUpdates.brand')}
                  className="h-12 text-lg w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Toyota, Ford, etc."
                />
              </div>

              {/* Modelo - Editable */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  id="model"
                  defaultValue={appointment?.vehicle?.model || ''}
                  {...register('vehicleUpdates.model')}
                  className="h-12 text-lg w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Corolla, F-150, etc."
                />
              </div>

              {/* Año - Editable */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <input
                  type="number"
                  id="year"
                  defaultValue={appointment.vehicle.year || ''}
                  {...register('vehicleUpdates.year', { valueAsNumber: true })}
                  className="h-12 text-lg w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="2020"
                  min="1900"
                  max="2030"
                />
                {errors.vehicleUpdates?.year && (
                  <p className="text-red-500 text-sm mt-1">{errors.vehicleUpdates.year.message}</p>
                )}
              </div>

              {/* Color - Editable */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  defaultValue={appointment.vehicle.color || ''}
                  {...register('vehicleUpdates.color')}
                  className="h-12 text-lg w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Blanco, Negro, Rojo, etc."
                />
              </div>
            </div>

            {/* Información del Cliente - Solo Lectura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </label>
                <p className="text-lg font-medium text-gray-900 mt-1">{appointment?.client?.name || ''}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <p className="text-lg text-gray-900 mt-1">{appointment?.client?.phone || ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kilometraje */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Kilometraje
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="Ej: 45000"
                {...register('kilometraje', { valueAsNumber: true })}
                className="h-16 text-2xl font-semibold max-w-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                inputMode="numeric"
              />
              <span className="text-xl font-medium text-gray-600">km</span>
            </div>
            {errors.kilometraje && (
              <p className="text-red-500 text-sm mt-2">{errors.kilometraje.message}</p>
            )}
          </div>
        </div>

        {/* Nivel de Combustible */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Nivel de Combustible
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fuelLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setValue('nivelCombustible', level.value)}
                  className={`h-20 rounded-lg border-2 transition-all font-semibold text-lg ${
                    nivelCombustible === level.value
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-1">{level.icon}</div>
                  {level.label}
                </button>
              ))}
            </div>
            {errors.nivelCombustible && (
              <p className="text-red-500 text-sm mt-2">{errors.nivelCombustible.message}</p>
            )}
          </div>
        </div>

        {/* Inspección Visual */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Inspección Visual Rápida
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="aireAcondicionadoOk"
                checked={watch('aireAcondicionadoOk')}
                onChange={(e) => setValue('aireAcondicionadoOk', e.target.checked)}
                className="h-6 w-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="aireAcondicionadoOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Wind className="h-5 w-5 text-blue-500" />
                Aire acondicionado funcionando
              </label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="cristalesOk"
                checked={watch('cristalesOk')}
                onChange={(e) => setValue('cristalesOk', e.target.checked)}
                className="h-6 w-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="cristalesOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Shield className="h-5 w-5 text-blue-600" />
                Cristales completos sin daños
              </label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="candadoLlantaOk"
                checked={watch('candadoLlantaOk')}
                onChange={(e) => setValue('candadoLlantaOk', e.target.checked)}
                className="h-6 w-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="candadoLlantaOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Lock className="h-5 w-5 text-gray-700" />
                Candado de llanta presente
              </label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="pertenenciasCajuelaOk"
                checked={watch('pertenenciasCajuelaOk')}
                onChange={(e) => setValue('pertenenciasCajuelaOk', e.target.checked)}
                className="h-6 w-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="pertenenciasCajuelaOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Package className="h-5 w-5 text-orange-600" />
                Pertenencias en cajuela verificadas
              </label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="manijasOk"
                checked={watch('manijasOk')}
                onChange={(e) => setValue('manijasOk', e.target.checked)}
                className="h-6 w-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="manijasOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Grip className="h-5 w-5 text-gray-600" />
                Manijas de puertas funcionando
              </label>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Observaciones Especiales
            </h3>
          </div>
          <div className="p-4">
            <textarea
              placeholder="Rayón puerta trasera, cristal estrellado, golpe defensa delantera, etc."
              {...register('observacionesRecepcion')}
              className="min-h-[120px] text-lg w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Describa cualquier daño visible, golpe, rayón o detalle importante
            </p>
          </div>
        </div>

        {/* Firma Digital */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold">Firma del Cliente</h3>
          </div>
          <div className="p-4">
            <SignatureCanvas onSignatureChange={handleSignatureChange} error={signatureError} />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isReceivingVehicle}
            className="flex-1 h-16 text-lg px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isReceivingVehicle}
            onClick={() => {
              console.log('[VehicleReceptionForm] Botón submit clickeado');
              console.log('[VehicleReceptionForm] Errores actuales:', errors);
              console.log('[VehicleReceptionForm] isReceivingVehicle:', isReceivingVehicle);
            }}
            className="flex-1 h-16 text-lg px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isReceivingVehicle ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-6 w-6" />
                Completar Recepción
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Confirmación de Merge */}
      {showMergeModal && duplicateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-yellow-50">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-900">⚠️ Vehículo ya registrado</h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-lg text-gray-700">
                La placa <span className="font-bold text-gray-900">{duplicateData.existingVehicle.plate}</span> ya existe en el sistema para este mismo cliente.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Vehículo Existente */}
                <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Vehículo Existente en Sistema
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Placa:</span> {duplicateData.existingVehicle.plate}</p>
                    <p><span className="font-medium">Marca:</span> {duplicateData.existingVehicle.brand}</p>
                    <p><span className="font-medium">Modelo:</span> {duplicateData.existingVehicle.model}</p>
                    {duplicateData.existingVehicle.year && (
                      <p><span className="font-medium">Año:</span> {duplicateData.existingVehicle.year}</p>
                    )}
                    {duplicateData.existingVehicle.color && (
                      <p><span className="font-medium">Color:</span> {duplicateData.existingVehicle.color}</p>
                    )}
                  </div>
                </div>

                {/* Vehículo Temporal */}
                <div className="border border-gray-300 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehículo Temporal (Se eliminará)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Placa:</span> {appointment?.vehicle?.plate || ''}</p>
                    <p><span className="font-medium">Marca:</span> {appointment?.vehicle?.brand || ''}</p>
                    <p><span className="font-medium">Modelo:</span> {appointment?.vehicle?.model || ''}</p>
                    {appointment?.vehicle?.year && (
                      <p><span className="font-medium">Año:</span> {appointment.vehicle.year}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">¿Qué sucederá al confirmar?</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>La cita se actualizará para usar el vehículo existente</li>
                  <li>El vehículo temporal será eliminado</li>
                  <li>Deberás volver a iniciar el proceso de recepción</li>
                  <li>El historial del vehículo existente se mantendrá intacto</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(false);
                  setDuplicateData(null);
                }}
                className="flex-1 h-12 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMergeConfirm}
                className="flex-1 h-12 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirmar y Usar Vehículo Existente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
