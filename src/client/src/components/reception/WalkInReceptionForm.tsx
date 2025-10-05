import React, { useState } from 'react';
import { ClientSearchCreate } from './ClientSearchCreate';
import { VehicleSearchCreate } from './VehicleSearchCreate';
import { VehicleReceptionForm } from './VehicleReceptionForm';
import { CheckCircle, User, Car, ClipboardCheck } from 'lucide-react';

interface WalkInReceptionFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'client' | 'vehicle' | 'reception';

export const WalkInReceptionForm: React.FC<WalkInReceptionFormProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleClientSelected = (client: any) => {
    setSelectedClient(client);
    setCurrentStep('vehicle');
  };

  const handleVehicleSelected = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentStep('reception');
  };

  const handleBackToClient = () => {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setCurrentStep('client');
  };

  const handleBackToVehicle = () => {
    setSelectedVehicle(null);
    setCurrentStep('vehicle');
  };

  const handleReceptionComplete = () => {
    // Resetear estado y llamar a onComplete
    setSelectedClient(null);
    setSelectedVehicle(null);
    setCurrentStep('client');
    onComplete();
  };

  // Crear objeto appointment "virtual" para compatibilidad con VehicleReceptionForm
  const createVirtualAppointment = () => {
    if (!selectedClient || !selectedVehicle) return null;

    return {
      id: null, // Sin cita
      clientId: selectedClient.id,
      vehicleId: selectedVehicle.id,
      client: selectedClient,
      vehicle: selectedVehicle,
      scheduledDate: new Date(),
      status: 'walk-in',
      notes: 'Walk-in sin cita previa',
      isWalkIn: true, // Flag para identificar walk-ins
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header con Stepper */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Recibir Auto SIN Cita Previa
          </h1>

          {/* Stepper */}
          <div className="flex items-center justify-between">
            {/* Step 1: Cliente */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'client'
                    ? 'bg-blue-600 text-white'
                    : selectedClient
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {selectedClient ? <CheckCircle className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Cliente</p>
                {selectedClient && (
                  <p className="text-sm text-gray-600">{selectedClient.name}</p>
                )}
              </div>
            </div>

            {/* Línea conectora */}
            <div className="w-16 h-1 bg-gray-300 mx-2" />

            {/* Step 2: Vehículo */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'vehicle'
                    ? 'bg-blue-600 text-white'
                    : selectedVehicle
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {selectedVehicle ? <CheckCircle className="h-6 w-6" /> : <Car className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Vehículo</p>
                {selectedVehicle && (
                  <p className="text-sm text-gray-600">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </p>
                )}
              </div>
            </div>

            {/* Línea conectora */}
            <div className="w-16 h-1 bg-gray-300 mx-2" />

            {/* Step 3: Recepción */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'reception'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Recepción</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 'client' && (
          <ClientSearchCreate
            onClientSelected={handleClientSelected}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'vehicle' && selectedClient && (
          <VehicleSearchCreate
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onVehicleSelected={handleVehicleSelected}
            onBack={handleBackToClient}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'reception' && selectedClient && selectedVehicle && (
          <VehicleReceptionForm
            appointment={createVirtualAppointment()!}
            onComplete={handleReceptionComplete}
            onCancel={handleBackToVehicle}
          />
        )}
      </div>
    </div>
  );
};
