import React, { useState } from 'react';
import { useReception } from '../hooks/useReception';
import { VehicleReceptionForm } from '../components/reception/VehicleReceptionForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  ClipboardCheck,
  Search,
  Car,
  User,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const ReceptionPage: React.FC = () => {
  const { todayAppointments, isLoadingAppointments, refetchAppointments } = useReception();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showReceptionForm, setShowReceptionForm] = useState(false);

  // Filtrar citas por búsqueda
  const filteredAppointments = todayAppointments.filter((appointment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      appointment.client.name.toLowerCase().includes(search) ||
      appointment.vehicle.plate.toLowerCase().includes(search) ||
      appointment.vehicle.brand.toLowerCase().includes(search) ||
      appointment.vehicle.model.toLowerCase().includes(search)
    );
  });

  const handleReceiveVehicle = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowReceptionForm(true);
  };

  const handleReceptionComplete = () => {
    setShowReceptionForm(false);
    setSelectedAppointment(null);
    refetchAppointments();
  };

  const handleBackToList = () => {
    setShowReceptionForm(false);
    setSelectedAppointment(null);
  };

  // Si se está mostrando el formulario de recepción
  if (showReceptionForm && selectedAppointment) {
    return (
      <VehicleReceptionForm
        appointment={selectedAppointment}
        onComplete={handleReceptionComplete}
        onCancel={handleBackToList}
      />
    );
  }

  // Vista principal: listado de citas
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <ClipboardCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recepción de Vehículos</h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => refetchAppointments()}
            className="h-14 px-6"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Actualizar
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por placa, marca, modelo o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoadingAppointments && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando citas...</span>
        </div>
      )}

      {/* Lista de Citas */}
      {!isLoadingAppointments && (
        <>
          {/* Contador */}
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-medium text-gray-700">
              {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} para hoy
            </span>
          </div>

          {/* Grid de Citas */}
          {filteredAppointments.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'No hay citas para hoy'}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Intenta con otro término de búsqueda'
                  : 'Las citas del día aparecerán aquí'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => {
                const hasService = appointment.services && appointment.services.length > 0;
                const isReceived = appointment.status === 'received';

                return (
                  <Card
                    key={appointment.id}
                    className={`hover:shadow-lg transition-shadow ${
                      isReceived ? 'border-green-300 bg-green-50' : ''
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Car className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl font-bold text-gray-900 truncate">
                              {appointment.vehicle.brand} {appointment.vehicle.model}
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                              {appointment.vehicle.year || ''} • {appointment.vehicle.color || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {isReceived && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Recibido
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Cliente */}
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{appointment.client.name}</p>
                          <p className="text-sm text-gray-500">{appointment.client.phone}</p>
                        </div>
                      </div>

                      {/* Placa */}
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg font-bold text-lg text-gray-900">
                          {appointment.vehicle.plate}
                        </div>
                      </div>

                      {/* Hora */}
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">
                          {new Date(appointment.scheduledDate).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Notas */}
                      {appointment.notes && (
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-700">{appointment.notes}</p>
                        </div>
                      )}

                      {/* Botón Recibir */}
                      <Button
                        onClick={() => handleReceiveVehicle(appointment)}
                        disabled={isReceived}
                        className={`w-full h-14 text-lg font-semibold ${
                          isReceived
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isReceived ? (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Ver Detalles
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="mr-2 h-5 w-5" />
                            Recibir Auto
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
