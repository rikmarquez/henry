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
  Wrench,
  Target
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
  onCreateOpportunity: (service: Service) => void;
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
  onCreateOpportunity,
  isLoading = false
}: ServicesKanbanProps) {
  const [draggedService, setDraggedService] = useState<Service | null>(null);

  // Define las 4 columnas del flujo activo de trabajo (sin RECHAZADO)
  const simplifiedColumns = [
    { id: 1, name: 'RECIBIDO', color: 'bg-blue-50', orderIndex: 1 },
    { id: 2, name: 'COTIZADO', color: 'bg-yellow-50', orderIndex: 2 },
    { id: 3, name: 'EN PROCESO', color: 'bg-purple-50', orderIndex: 3 },
    { id: 4, name: 'TERMINADO', color: 'bg-green-50', orderIndex: 4 }
  ];

  // Mapear servicios directamente por statusId (excluyendo RECHAZADO del Kanban)
  const mapServiceToColumn = (statusId: number) => {
    switch (statusId) {
      case 1: return 1; // RECIBIDO
      case 2: return 2; // COTIZADO
      case 3: return 3; // EN PROCESO
      case 4: return 4; // TERMINADO
      case 5: return null; // RECHAZADO - NO mostrar en Kanban
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
                  {/* ID SERVICIO PROMINENTE */}
                  <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-blue-200">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">ID Servicio</div>
                      <div className="text-2xl font-black">#{service.id}</div>
                    </div>
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
                      {/* Show create opportunity button only for completed/finished services */}
                      {(service.status.name === 'Terminado' || service.status.name === 'Completado' || service.status.name === 'Entregado') && (
                        <button
                          onClick={() => onCreateOpportunity(service)}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          title="Crear Oportunidad"
                        >
                          <Target className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-gray-800">
                      {service.vehicle.brand} {service.vehicle.model} ({service.vehicle.year})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Placa: {service.vehicle.plate}
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