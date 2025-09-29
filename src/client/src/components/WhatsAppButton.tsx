import React from 'react';
import { MessageCircle, Clock, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { WhatsAppLinks, WhatsAppMessageData, openWhatsApp } from '../utils/whatsapp';

interface WhatsAppButtonProps {
  type: 'reminder' | 'quotation' | 'ready' | 'followup' | 'general';
  data: WhatsAppMessageData;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

const buttonConfig = {
  reminder: {
    icon: Clock,
    label: 'Recordatorio',
    bgColor: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-500',
  },
  quotation: {
    icon: DollarSign,
    label: 'Cotización',
    bgColor: 'bg-yellow-500 hover:bg-yellow-600',
    textColor: 'text-white',
    borderColor: 'border-yellow-500',
  },
  ready: {
    icon: CheckCircle,
    label: 'Listo',
    bgColor: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-500',
  },
  followup: {
    icon: Calendar,
    label: 'Seguimiento',
    bgColor: 'bg-purple-500 hover:bg-purple-600',
    textColor: 'text-white',
    borderColor: 'border-purple-500',
  },
  general: {
    icon: MessageCircle,
    label: 'WhatsApp',
    bgColor: 'bg-green-600 hover:bg-green-700',
    textColor: 'text-white',
    borderColor: 'border-green-600',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function WhatsAppButton({
  type,
  data,
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
}: WhatsAppButtonProps) {
  const config = buttonConfig[type];
  const Icon = config.icon;

  const handleClick = () => {
    if (disabled) return;

    let link: string;

    switch (type) {
      case 'reminder':
        link = WhatsAppLinks.appointmentReminder(data);
        break;
      case 'quotation':
        link = WhatsAppLinks.quotationReady(data);
        break;
      case 'ready':
        link = WhatsAppLinks.vehicleReady(data);
        break;
      case 'followup':
        link = WhatsAppLinks.opportunityFollowUp(data);
        break;
      case 'general':
      default:
        link = WhatsAppLinks.generalContact(data);
        break;
    }

    openWhatsApp(link);
  };

  const getButtonClasses = () => {
    const baseClasses = `inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses[size]}`;

    if (disabled) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    switch (variant) {
      case 'outline':
        return `${baseClasses} border-2 ${config.borderColor} ${config.textColor.replace('text-white', 'text-' + config.bgColor.split('-')[1] + '-500')} bg-transparent hover:${config.bgColor} hover:text-white`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case 'primary':
      default:
        return `${baseClasses} ${config.bgColor} ${config.textColor} focus:ring-green-500`;
    }
  };

  // Validar que tenemos los datos mínimos necesarios
  const isDataValid = data.clientName && data.clientPhone;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isDataValid}
      className={`${getButtonClasses()} ${className}`}
      title={`Enviar mensaje de ${config.label.toLowerCase()} por WhatsApp a ${data.clientName}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </button>
  );
}

// Componente específico para recordatorio de citas
export function WhatsAppReminderButton({
  clientName,
  clientPhone,
  vehicleBrand,
  vehicleModel,
  vehiclePlate,
  appointmentDate,
  appointmentTime,
  ...props
}: {
  clientName: string;
  clientPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
} & Omit<WhatsAppButtonProps, 'type' | 'data'>) {
  return (
    <WhatsAppButton
      type="reminder"
      data={{
        clientName,
        clientPhone,
        vehicleBrand,
        vehicleModel,
        vehiclePlate,
        appointmentDate,
        appointmentTime,
      }}
      {...props}
    />
  );
}

// Componente específico para cotización lista
export function WhatsAppQuotationButton({
  clientName,
  clientPhone,
  vehicleBrand,
  vehicleModel,
  amount,
  diagnosticResult,
  ...props
}: {
  clientName: string;
  clientPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  amount?: number;
  diagnosticResult?: string;
} & Omit<WhatsAppButtonProps, 'type' | 'data'>) {
  return (
    <WhatsAppButton
      type="quotation"
      data={{
        clientName,
        clientPhone,
        vehicleBrand,
        vehicleModel,
        amount,
        diagnosticResult,
      }}
      {...props}
    />
  );
}

// Componente específico para vehículo listo
export function WhatsAppVehicleReadyButton({
  clientName,
  clientPhone,
  vehicleBrand,
  vehicleModel,
  vehiclePlate,
  amount,
  ...props
}: {
  clientName: string;
  clientPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  amount?: number;
} & Omit<WhatsAppButtonProps, 'type' | 'data'>) {
  return (
    <WhatsAppButton
      type="ready"
      data={{
        clientName,
        clientPhone,
        vehicleBrand,
        vehicleModel,
        vehiclePlate,
        amount,
      }}
      {...props}
    />
  );
}

// Componente específico para seguimiento de oportunidades
export function WhatsAppFollowUpButton({
  clientName,
  clientPhone,
  vehicleBrand,
  vehicleModel,
  followUpService,
  ...props
}: {
  clientName: string;
  clientPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  followUpService?: string;
} & Omit<WhatsAppButtonProps, 'type' | 'data'>) {
  return (
    <WhatsAppButton
      type="followup"
      data={{
        clientName,
        clientPhone,
        vehicleBrand,
        vehicleModel,
        followUpService,
      }}
      {...props}
    />
  );
}