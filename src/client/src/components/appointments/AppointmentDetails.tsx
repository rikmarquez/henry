import { useState } from 'react';
import { 
  X, 
  User, 
  Car, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  ArrowRight,
  Wrench
} from 'lucide-react';

interface Appointment {
  id: number;
  scheduledDate: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isFromOpportunity: boolean;
  client: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
  };
  opportunity?: {
    id: number;
    type: string;
    description: string;
  };
  createdByUser: {
    id: number;
    name: string;
  };
  _count: {
    services: number;
  };
}

interface AppointmentDetailsProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: number, action: 'confirm' | 'complete' | 'cancel') => void;
  isUpdating: boolean;
  onConfirmAction: (appointmentId: number, action: 'confirm' | 'complete' | 'cancel') => void;
  onCreateService?: (appointment: Appointment) => void;
  onReceiveCarComplete?: (appointment: Appointment) => void;
}

const AppointmentDetails = ({
  appointment,
  isOpen,
  onClose,
  onStatusUpdate,
  isUpdating,
  onConfirmAction,
  onCreateService,
  onReceiveCarComplete
}: AppointmentDetailsProps) => {

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canConfirm = appointment.status === 'scheduled';
  const canReceiveCar = appointment.status === 'confirmed' && appointment._count.services === 0;
  const canCancel = appointment.status === 'scheduled' || appointment.status === 'confirmed';

  const handleStatusAction = (action: 'confirm' | 'complete' | 'cancel') => {
    onConfirmAction(appointment.id, action);
  };

  const handleReceiveCar = () => {
    // Llamar al callback que maneja el timing correctamente
    if (onReceiveCarComplete) {
      onReceiveCarComplete(appointment);
    }
  };


  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">Detalles de la Cita</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                <span className="ml-1">{getStatusText(appointment.status)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Appointment Type Badge */}
            {appointment.isFromOpportunity && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Cita desde Oportunidad</p>
                    <p className="text-sm text-purple-700">
                      Esta cita fue creada desde una oportunidad de seguimiento
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(appointment.scheduledDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Cliente
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p className="text-gray-900">{appointment.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{appointment.client.phone}</span>
                    </div>
                  </div>
                </div>
                {appointment.client.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{appointment.client.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Información del Vehículo
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Marca y Modelo</p>
                    <p className="text-gray-900">{appointment.vehicle.brand} {appointment.vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Placa</p>
                    <p className="text-gray-900">
                      {appointment.vehicle.plate || (
                        <span className="text-amber-600 font-medium">Pendiente de capturar</span>
                      )}
                    </p>
                  </div>
                  {appointment.vehicle.year && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Año</p>
                      <p className="text-gray-900">{appointment.vehicle.year}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opportunity Information */}
            {appointment.opportunity && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Oportunidad Relacionada
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Tipo</p>
                      <p className="text-purple-900">{appointment.opportunity.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Descripción</p>
                      <p className="text-purple-900">{appointment.opportunity.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notas
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            )}

            {/* Services Count */}
            {appointment._count.services > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Servicios Asociados</p>
                    <p className="text-sm text-green-700">
                      Esta cita tiene {appointment._count.services} servicio{appointment._count.services !== 1 ? 's' : ''} asociado{appointment._count.services !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-500">
                <p>Creada por: {appointment.createdByUser.name}</p>
                <p>ID de cita: #{appointment.id}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
              {canCancel && (
                <button
                  onClick={() => handleStatusAction('cancel')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Cita
                </button>
              )}
              
              {canConfirm && (
                <button
                  onClick={() => handleStatusAction('confirm')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Cita
                </button>
              )}
              
              {canReceiveCar && onReceiveCarComplete && (
                <button
                  onClick={handleReceiveCar}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Recibir Auto
                </button>
              )}

              {/* Manual status change buttons for completed appointments */}
              {appointment.status === 'completed' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusAction('confirm')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1 border border-green-300 rounded text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    ← Confirmar
                  </button>
                </div>
              )}

              {/* Manual status change buttons for confirmed appointments */}
              {appointment.status === 'confirmed' && appointment._count.services > 0 && (
                <button
                  onClick={() => handleStatusAction('complete')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-blue-300 rounded text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Marcar Completada →
                </button>
              )}

              {/* Close Button - Always visible */}
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentDetails;