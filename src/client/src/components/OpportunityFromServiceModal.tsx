import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  XCircle,
  Target,
  Calendar,
  FileText,
  User,
  Car,
  Wrench,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

// Types
interface Service {
  id: number;
  clientId: number;
  vehicleId: number;
  problemDescription?: string;
  diagnosis?: string;
  totalAmount: number;
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
  status: {
    id: number;
    name: string;
    color: string;
  };
}

interface OpportunityFromServiceModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Form schema - simplified for service-based opportunity
const createOpportunityFromServiceSchema = z.object({
  type: z.string().min(2, 'El tipo debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  followUpDate: z.string().min(1, 'Fecha de seguimiento requerida'),
  notes: z.string().optional(),
});

type CreateOpportunityFromServiceForm = z.infer<typeof createOpportunityFromServiceSchema>;

// Helper function for currency formatting (Mexican format)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export default function OpportunityFromServiceModal({
  service,
  isOpen,
  onClose,
  onSuccess,
}: OpportunityFromServiceModalProps) {
  const form = useForm<CreateOpportunityFromServiceForm>({
    resolver: zodResolver(createOpportunityFromServiceSchema),
    defaultValues: {
      type: 'Mantenimiento', // Default suggestion
      followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
  });

  const handleSubmit = async (data: CreateOpportunityFromServiceForm) => {
    try {
      const opportunityData = {
        clientId: service.clientId,
        vehicleId: service.vehicleId,
        serviceId: service.id, // Link to originating service
        type: data.type,
        description: data.description,
        followUpDate: data.followUpDate,
        status: 'pending' as const,
        notes: data.notes || `Oportunidad generada desde servicio completado: ${formatCurrency(service.totalAmount)}`,
      };

      const response = await api.post('/opportunities', opportunityData);
      
      if (response.data.success) {
        toast.success('¡Oportunidad creada exitosamente!');
        form.reset();
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      toast.error(error.response?.data?.message || 'Error al crear oportunidad');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Crear Oportunidad</h2>
              <p className="text-sm text-gray-600">Desde servicio completado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Service Info Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Servicio Origen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{service.client.name}</span>
                <span className="text-gray-500">- {service.client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-green-600" />
                <span className="font-medium">{service.vehicle.plate}</span>
                <span className="text-gray-500">
                  - {service.vehicle.brand} {service.vehicle.model} ({service.vehicle.year})
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Monto:</span>
                <span className="text-purple-600 font-semibold">
                  {formatCurrency(service.totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.status.color }}></div>
                <span className="font-medium">Estado:</span>
                <span>{service.status.name}</span>
              </div>
            </div>
          </div>
          {service.problemDescription && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Problema resuelto:</span>
                <span className="text-gray-600 ml-1">{service.problemDescription}</span>
              </p>
            </div>
          )}
        </div>

        {/* Opportunity Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Information Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  ¿Qué es una oportunidad?
                </h4>
                <p className="text-sm text-blue-800">
                  Una oportunidad es un trabajo futuro potencial para este cliente y vehículo. 
                  Puede ser mantenimiento preventivo, reparaciones adicionales identificadas, 
                  o servicios de seguimiento recomendados.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Oportunidad *
              </label>
              <select
                {...form.register('type')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="Mantenimiento">Mantenimiento Preventivo</option>
                <option value="Trabajo Pendiente">Trabajo Pendiente</option>
                <option value="Revisión">Revisión Programada</option>
                <option value="Garantía">Seguimiento de Garantía</option>
                <option value="Reparación Adicional">Reparación Adicional Identificada</option>
                <option value="Mejora">Mejora o Actualización</option>
                <option value="Otros">Otros</option>
              </select>
              {form.formState.errors.type && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.type.message}</p>
              )}
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Seguimiento *
              </label>
              <input
                type="date"
                {...form.register('followUpDate')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
              {form.formState.errors.followUpDate && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.followUpDate.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Fecha sugerida para contactar al cliente sobre esta oportunidad
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Trabajo Propuesto *
            </label>
            <textarea
              {...form.register('description')}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describa el trabajo o mantenimiento que se puede realizar. Ej: 'Cambio de aceite y filtros en 10,000 km', 'Revisión de frenos recomendada', 'Alineación y balanceo pendiente'..."
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales (opcional)
            </label>
            <textarea
              {...form.register('notes')}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones adicionales, presupuesto estimado, prioridad, etc..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Crear Oportunidad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}