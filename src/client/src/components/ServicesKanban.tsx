import { useState } from 'react';
import { 
  Clock, 
  Search, 
  FileText, 
  CheckCircle, 
  Play, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Eye,
  Edit2,
  Wrench
} from 'lucide-react';

// Types (duplicated from ServicesPage for independence)
interface Service {
  id: number;
  appointmentId?: number;
  clientId: number;
  vehicleId: number;
  mechanicId?: number;
  statusId: number;
  problemDescription?: string;
  diagnosis?: string;
  quotationDetails?: string;
  totalAmount: number;
  mechanicCommission: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
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
    year: number;
  };
  mechanic?: {
    id: number;
    name: string;
    commissionPercentage: number;
  };
  status: {
    id: number;
    name: string;
    color: string;
    orderIndex: number;
  };
  appointment?: {
    id: number;
    scheduledDate: string;
    status: string;
  };
  createdByUser: {
    id: number;
    name: string;
  };
  _count: {
    opportunities: number;
    statusLogs: number;
  };
}

interface WorkStatus {
  id: number;
  name: string;
  color: string;
  orderIndex: number;
}

interface ServicesKanbanProps {
  services: Service[];
  workStatuses: WorkStatus[];
  onStatusChange: (serviceId: number, newStatusId: number) => void;
  onViewDetails: (service: Service) => void;
  onEdit: (service: Service) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  'RECIBIDO': 'bg-blue-100 text-blue-800 border-blue-200',
  'Recibido': 'bg-blue-100 text-blue-800 border-blue-200',
  'COTIZADO': 'bg-purple-100 text-purple-800 border-purple-200', 
  'Cotizado': 'bg-purple-100 text-purple-800 border-purple-200',
  'EN PROCESO': 'bg-orange-100 text-orange-800 border-orange-200',
  'En Progreso': 'bg-orange-100 text-orange-800 border-orange-200',
  'TERMINADO': 'bg-green-100 text-green-800 border-green-200',
  'Completado': 'bg-green-100 text-green-800 border-green-200',
  'Entregado': 'bg-green-100 text-green-800 border-green-200',
};

const columnColors: Record<string, string> = {
  'RECIBIDO': 'border-blue-200 bg-blue-50',
  'Recibido': 'border-blue-200 bg-blue-50',
  'COTIZADO': 'border-purple-200 bg-purple-50',
  'Cotizado': 'border-purple-200 bg-purple-50',
  'EN PROCESO': 'border-orange-200 bg-orange-50',
  'En Progreso': 'border-orange-200 bg-orange-50',
  'TERMINADO': 'border-green-200 bg-green-50',
  'Completado': 'border-green-200 bg-green-50',
  'Entregado': 'border-green-200 bg-green-50',
};

const getStatusIcon = (statusName: string) => {
  switch (statusName) {
    case 'RECIBIDO':
    case 'Recibido': return <Clock className="h-4 w-4" />;
    case 'COTIZADO':
    case 'Cotizado': return <FileText className="h-4 w-4" />;
    case 'EN PROCESO':
    case 'En Progreso': return <Play className="h-4 w-4" />;
    case 'PERDIDO':
    case 'Perdido': return <XCircle className="h-4 w-4" />;
    case 'TERMINADO':
    case 'Completado':
    case 'Entregado': return <CheckCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function ServicesKanban({
  services,
  workStatuses,
  onStatusChange,
  onViewDetails,
  onEdit,
  isLoading = false
}: ServicesKanbanProps) {
  const [draggedService, setDraggedService] = useState<Service | null>(null);

  // Define las 4 columnas del flujo activo de trabajo (sin PERDIDO)
  const simplifiedColumns = [
    { id: 1, name: 'RECIBIDO', color: 'bg-blue-50', orderIndex: 1 },
    { id: 2, name: 'COTIZADO', color: 'bg-yellow-50', orderIndex: 2 },
    { id: 4, name: 'EN PROCESO', color: 'bg-purple-50', orderIndex: 3 },
    { id: 5, name: 'TERMINADO', color: 'bg-green-50', orderIndex: 4 }
  ];

  // Mapear servicios directamente por statusId (excluyendo PERDIDO del Kanban)
  const mapServiceToColumn = (statusId: number) => {
    switch (statusId) {
      case 1: return 1; // RECIBIDO
      case 2: return 2; // COTIZADO  
      case 4: return 4; // EN PROCESO
      case 5: return 5; // TERMINADO
      case 6: return null; // PERDIDO - no mostrar en Kanban
      default: return 1; // default to RECIBIDO
    }
  };

  // Agrupar servicios por columnas simplificadas (excluyendo PERDIDOS)
  const servicesByColumn = simplifiedColumns.reduce((acc, column) => {
    acc[column.id] = services.filter(service => {
      const mappedColumn = mapServiceToColumn(service.statusId);
      return mappedColumn === column.id;
    });
    return acc;
  }, {} as Record<number, Service[]>);

  const handleDragStart = (e: React.DragEvent, service: Service) => {
    setDraggedService(service);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumn: number) => {
    e.preventDefault();
    if (draggedService) {
      const currentColumn = mapServiceToColumn(draggedService.statusId);
      if (currentColumn !== targetColumn) {
        // Target column is already the status ID we want
        onStatusChange(draggedService.id, targetColumn);
      }
    }
    setDraggedService(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {simplifiedColumns.map((column) => (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 ${column.color} border-2 rounded-lg p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(column.name)}
                <h3 className="font-semibold text-gray-800">{column.name}</h3>
              </div>
              <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full font-medium">
                {servicesByColumn[column.id]?.length || 0}
              </span>
            </div>

            {/* Service Cards */}
            <div className="space-y-3">
              {servicesByColumn[column.id]?.map((service) => (
                <div
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, service)}
                  className={`bg-white rounded-lg p-4 shadow-sm border cursor-move hover:shadow-md transition-shadow ${
                    draggedService?.id === service.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Service Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      statusColors[service.status.name] || 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {getStatusIcon(service.status.name)}
                      <span>#{service.id}</span>
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onViewDetails(service)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(service)}
                        className="text-gray-400 hover:text-orange-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      {service.vehicle.brand} {service.vehicle.model} ({service.vehicle.year})
                    </div>
                  </div>

                  {/* Problem Description */}
                  {service.problemDescription && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.problemDescription}
                      </p>
                    </div>
                  )}

                  {/* Mechanic */}
                  {service.mechanic && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Wrench className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{service.mechanic.name}</span>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="flex items-center mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(service.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Appointment Date */}
                  {service.appointment && (
                    <div className="mt-2 text-xs text-gray-500">
                      Cita: {formatDate(service.appointment.scheduledDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {(!servicesByColumn[column.id] || servicesByColumn[column.id].length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <div className="flex flex-col items-center space-y-2">
                  {getStatusIcon(column.name)}
                  <span className="text-sm">No hay servicios en este estado</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}