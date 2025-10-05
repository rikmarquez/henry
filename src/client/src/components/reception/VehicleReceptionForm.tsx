import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useReception } from '../../hooks/useReception';
import { SignatureCanvas } from './SignatureCanvas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { vehicleReceptionSchema } from '../../../../shared/schemas/service.schema';

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
      lucesOk: true,
      llantasOk: true,
      cristalesOk: true,
      carroceriaOk: true,
    },
  });

  const nivelCombustible = watch('nivelCombustible');

  const onSubmit = async (data: VehicleReceptionFormData) => {
    // Validar firma
    if (!signature) {
      setSignatureError('La firma del cliente es requerida');
      return;
    }

    try {
      const payload = {
        ...data,
        firmaCliente: signature,
      };

      await receiveVehicleAsync(payload);
      onComplete();
    } catch (error) {
      console.error('Error al recibir vehículo:', error);
    }
  };

  const handleSignatureChange = (sig: string) => {
    setSignature(sig);
    if (sig) {
      setSignatureError('');
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
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4 h-12 text-lg"
          disabled={isReceivingVehicle}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a Lista
        </Button>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        {/* Información del Vehículo y Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-base font-semibold text-gray-700">Vehículo</Label>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {appointment.vehicle.brand} {appointment.vehicle.model} {appointment.vehicle.year}
              </p>
              <p className="text-sm text-gray-500 mt-1">Color: {appointment.vehicle.color || 'N/A'}</p>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-700">Placa</Label>
              <div className="mt-1 px-4 py-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg font-bold text-2xl text-gray-900 inline-block">
                {appointment.vehicle.plate}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </Label>
              <p className="text-lg font-medium text-gray-900 mt-1">{appointment.client.name}</p>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <p className="text-lg text-gray-900 mt-1">{appointment.client.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Kilometraje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Kilometraje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                placeholder="Ej: 45000"
                {...register('kilometraje', { valueAsNumber: true })}
                className="h-16 text-2xl font-semibold max-w-xs"
                inputMode="numeric"
              />
              <span className="text-xl font-medium text-gray-600">km</span>
            </div>
            {errors.kilometraje && (
              <p className="text-red-500 text-sm mt-2">{errors.kilometraje.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Nivel de Combustible */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Nivel de Combustible
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Inspección Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Inspección Visual Rápida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="lucesOk"
                checked={watch('lucesOk')}
                onCheckedChange={(checked) => setValue('lucesOk', checked as boolean)}
                className="h-6 w-6"
              />
              <Label htmlFor="lucesOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Luces funcionando correctamente
              </Label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="llantasOk"
                checked={watch('llantasOk')}
                onCheckedChange={(checked) => setValue('llantasOk', checked as boolean)}
                className="h-6 w-6"
              />
              <Label htmlFor="llantasOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Circle className="h-5 w-5 text-gray-600" />
                Llantas en buen estado
              </Label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="cristalesOk"
                checked={watch('cristalesOk')}
                onCheckedChange={(checked) => setValue('cristalesOk', checked as boolean)}
                className="h-6 w-6"
              />
              <Label htmlFor="cristalesOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Shield className="h-5 w-5 text-blue-600" />
                Cristales completos sin daños
              </Label>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="carroceriaOk"
                checked={watch('carroceriaOk')}
                onCheckedChange={(checked) => setValue('carroceriaOk', checked as boolean)}
                className="h-6 w-6"
              />
              <Label htmlFor="carroceriaOk" className="text-lg flex items-center gap-3 cursor-pointer flex-1">
                <Droplet className="h-5 w-5 text-gray-600" />
                Carrocería sin golpes nuevos
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Observaciones Especiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Rayón puerta trasera, cristal estrellado, golpe defensa delantera, etc."
              {...register('observacionesRecepcion')}
              className="min-h-[120px] text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">
              Describa cualquier daño visible, golpe, rayón o detalle importante
            </p>
          </CardContent>
        </Card>

        {/* Firma Digital */}
        <Card>
          <CardHeader>
            <CardTitle>Firma del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCanvas onSignatureChange={handleSignatureChange} error={signatureError} />
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isReceivingVehicle}
            className="flex-1 h-16 text-lg"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isReceivingVehicle}
            className="flex-1 h-16 text-lg bg-green-600 hover:bg-green-700"
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
          </Button>
        </div>
      </form>
    </div>
  );
};
