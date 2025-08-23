import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  History, 
  Car, 
  User, 
  Wrench, 
  Calendar, 
  DollarSign, 
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';

interface ServiceHistoryProps {
  type: 'client' | 'vehicle';
  id: number;
  compact?: boolean;
  limit?: number;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
}

interface Service {
  id: number;
  clientId: number;
  vehicleId: number;
  mechanicId: number | null;
  statusId: number;
  problemDescription: string;
  diagnosis: string;
  totalAmount: string;
  mechanicCommission: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year: number;
  };
  client?: {
    id: number;
    name: string;
    phone: string;
  };
  mechanic?: {
    id: number;
    name: string;
  } | null;
  status: {
    id: number;
    name: string;
    color: string;
  };
}

interface ServiceHistoryData {
  services: Service[];
  summary: {
    totalServices: number;
    totalAmount: string;
    totalPages: number;
    currentPage: number;
  };
  vehicle?: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year: number;
    client: {
      id: number;
      name: string;
      phone: string;
    };
  };
}

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(num);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusIcon = (statusName: string) => {
  const name = statusName.toLowerCase();
  if (name.includes('recibido')) return <Package className="w-4 h-4" />;
  if (name.includes('cotizado')) return <DollarSign className="w-4 h-4" />;
  if (name.includes('progreso') || name.includes('autorizado')) return <Clock className="w-4 h-4" />;
  if (name.includes('completado') || name.includes('entregado')) return <CheckCircle className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
};

export default function ServiceHistoryTable({ 
  type, 
  id, 
  compact = false, 
  limit = 5,
  showViewAllButton = true,
  onViewAll 
}: ServiceHistoryProps) {
  const { data, isLoading, error } = useQuery<ServiceHistoryData>({
    queryKey: ['serviceHistory', type, id, limit],
    queryFn: async () => {
      const response = await api.get(`/services/history/${type}/${id}?limit=${limit}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600">Error al cargar el historial de servicios</p>
      </div>
    );
  }

  if (!data || !data.services.length) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Sin historial de servicios</p>
        <p className="text-gray-500 text-sm">
          {type === 'client' ? 'Este cliente no ha realizado servicios aún' : 'Este vehículo no ha tenido servicios aún'}
        </p>
      </div>
    );
  }

  const { services, summary } = data;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Servicios</p>
              <p className="text-2xl font-bold text-blue-800">{summary.totalServices}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Monto Total</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="space-y-2">
        <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
          <History className="w-5 h-5 mr-2" />
          Historial de Servicios
        </h4>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Status Badge */}
                      <div 
                        className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${service.status.color}20`,
                          color: service.status.color 
                        }}
                      >
                        {getStatusIcon(service.status.name)}
                        <span>{service.status.name}</span>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(service.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(service.totalAmount)}
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="text-sm text-gray-800 font-medium">
                    {service.problemDescription || 'Sin descripción'}
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    {/* Vehicle Info (only for client history) */}
                    {type === 'client' && service.vehicle && (
                      <div className="flex items-center space-x-1">
                        <Car className="w-3 h-3" />
                        <span>{service.vehicle.plate} - {service.vehicle.brand} {service.vehicle.model}</span>
                      </div>
                    )}
                    
                    {/* Client Info (only for vehicle history) */}
                    {type === 'vehicle' && service.client && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{service.client.name}</span>
                      </div>
                    )}
                    
                    {/* Mechanic */}
                    {service.mechanic && (
                      <div className="flex items-center space-x-1">
                        <Wrench className="w-3 h-3" />
                        <span>{service.mechanic.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                {!compact && (
                  <button 
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => console.log('View service details:', service.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View All Button */}
      {showViewAllButton && summary.totalServices > limit && onViewAll && (
        <div className="text-center pt-2">
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center space-x-1 mx-auto"
          >
            <span>Ver historial completo ({summary.totalServices} servicios)</span>
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}