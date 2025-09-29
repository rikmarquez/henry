import { useState } from 'react';
import {
  User,
  Car,
  Clock,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { WhatsAppReminderButton } from '../WhatsAppButton';

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

interface MobileAppointmentCardProps {
  appointment: Appointment;
  onTap: () => void;
  onQuickAction?: (action: 'confirm' | 'cancel' | 'complete') => void;
  isExpanded?: boolean;
}

const MobileAppointmentCard = ({
  appointment,
  onTap,
  onQuickAction,
  isExpanded: controlledExpanded
}: MobileAppointmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(controlledExpanded || false);

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
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const { date, time } = formatDate(appointment.scheduledDate);

  const handleCardTap = () => {
    if (controlledExpanded === undefined) {
      setIsExpanded(!isExpanded);
    }
    onTap();
  };

  const handleQuickActionClick = (e: React.MouseEvent, action: 'confirm' | 'cancel' | 'complete') => {
    e.stopPropagation();
    onQuickAction?.(action);
  };

  const expanded = controlledExpanded !== undefined ? controlledExpanded : isExpanded;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={handleCardTap}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Status Badge */}
            <div className="flex items-center space-x-2 mb-2">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                <span className="ml-1">{getStatusText(appointment.status)}</span>
              </div>
              {appointment.isFromOpportunity && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Oportunidad
                </span>
              )}
              {appointment._count.services > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {appointment._count.services} servicio{appointment._count.services !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Main Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{appointment.client.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 truncate">
                    {appointment.vehicle.brand} {appointment.vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appointment.vehicle.plate || 'Placa pendiente'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Date/Time & Expand Icon */}
          <div className="flex flex-col items-end space-y-1 ml-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{time}</p>
              <p className="text-xs text-gray-500">{date}</p>
            </div>
            {controlledExpanded === undefined && (
              <div className="text-gray-400">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4 space-y-3">
            {/* Contact Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${appointment.client.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {appointment.client.phone}
                </a>
              </div>

              {/* WhatsApp Reminder Button */}
              {appointment.client.phone && (
                <div onClick={(e) => e.stopPropagation()}>
                  <WhatsAppReminderButton
                    clientName={appointment.client.name}
                    clientPhone={appointment.client.phone}
                    vehicleBrand={appointment.vehicle.brand}
                    vehicleModel={appointment.vehicle.model}
                    vehiclePlate={appointment.vehicle.plate}
                    appointmentDate={new Date(appointment.scheduledDate)}
                    variant="outline"
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            {appointment.vehicle.year && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Año:</span> {appointment.vehicle.year}
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Notas:</span> {appointment.notes}
              </div>
            )}

            {/* Opportunity Info */}
            {appointment.opportunity && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Oportunidad:</span> {appointment.opportunity.description}
              </div>
            )}

            {/* Quick Actions */}
            {appointment.status === 'scheduled' && onQuickAction && (
              <div className="space-y-2 pt-2">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleQuickActionClick(e, 'confirm')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </button>
                  <button
                    onClick={(e) => handleQuickActionClick(e, 'cancel')}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {appointment.status === 'confirmed' && onQuickAction && (
              <div className="pt-2">
                <button
                  onClick={(e) => handleQuickActionClick(e, 'complete')}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Car className="h-4 w-4 mr-1" />
                  Recibir Auto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAppointmentCard;