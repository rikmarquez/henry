import React, { useState } from 'react';
import { useReception } from '../hooks/useReception';
import { VehicleReceptionForm } from '../components/reception/VehicleReceptionForm';
import { WalkInReceptionForm } from '../components/reception/WalkInReceptionForm';
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
  UserPlus,
} from 'lucide-react';

export const ReceptionPage: React.FC = () => {
  const { todayAppointments, isLoadingAppointments, refetchAppointments } = useReception();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showReceptionForm, setShowReceptionForm] = useState(false);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'received'>('pending');

  // Separar citas pendientes vs recibidas
  const pendingAppointments = todayAppointments.filter(
    (apt) => apt.status !== 'received' && apt.status !== 'cancelled'
  );

  const receivedAppointments = todayAppointments.filter(
    (apt) => apt.status === 'received'
  );

  // Filtrar según tab activo
  const appointmentsToShow = activeTab === 'pending' ? pendingAppointments : receivedAppointments;

  const filteredAppointments = appointmentsToShow.filter((appointment) => {
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

  const handleWalkInComplete = () => {
    setShowWalkInForm(false);
    refetchAppointments();
  };

  const handleCancelWalkIn = () => {
    setShowWalkInForm(false);
  };

  // Si se está mostrando el formulario de walk-in
  if (showWalkInForm) {
    return (
      <WalkInReceptionForm
        onComplete={handleWalkInComplete}
        onCancel={handleCancelWalkIn}
      />
    );
  }

  // Si se está mostrando el formulario de recepción con cita
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

          <div className="flex gap-3">
            <button
              onClick={() => setShowWalkInForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 h-14 font-semibold"
            >
              <UserPlus className="h-5 w-5" />
              Recibir Auto SIN Cita
            </button>

            <button
              onClick={() => refetchAppointments()}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 h-14"
            >
              <RefreshCw className="h-5 w-5" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSearchTerm('');
            }}
            className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Pendientes ({pendingAppointments.length})</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('received');
              setSearchTerm('');
            }}
            className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all ${
              activeTab === 'received'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Recibidos ({receivedAppointments.length})</span>
            </div>
          </button>
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
            {activeTab === 'pending' ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <span className="text-lg font-medium text-gray-700">
              {filteredAppointments.length} {activeTab === 'pending' ? 'pendiente' : 'recibido'}
              {filteredAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Grid de Citas */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm
                  ? 'No se encontraron resultados'
                  : activeTab === 'pending'
                  ? 'No hay citas pendientes'
                  : 'No hay autos recibidos'}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Intenta con otro término de búsqueda'
                  : activeTab === 'pending'
                  ? 'Las citas pendientes aparecerán aquí'
                  : 'Los autos recibidos (con o sin cita) aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => {
                const isReceived = appointment.status === 'received';

                return (
                  <div
                    key={appointment.id}
                    className={`bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow ${
                      isReceived ? 'border-green-300 bg-green-50' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Car className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 truncate">
                              {appointment.vehicle.brand} {appointment.vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {appointment.vehicle.year || ''} • {appointment.vehicle.color || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {isReceived && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Recibido
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
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
                      <button
                        onClick={() => handleReceiveVehicle(appointment)}
                        disabled={isReceived}
                        className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 ${
                          isReceived
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isReceived ? (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Ver Detalles
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="h-5 w-5" />
                            Recibir Auto
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
