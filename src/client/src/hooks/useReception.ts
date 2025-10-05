import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import type { VehicleReceptionInput } from '../../../shared/schemas/service.schema';

interface Appointment {
  id: number;
  clientId: number;
  vehicleId: number;
  scheduledDate: string;
  status: string;
  notes: string | null;
  client: {
    id: number;
    name: string;
    phone: string;
    whatsapp: string | null;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year: number | null;
    color: string | null;
  };
  services: Array<{
    id: number;
    statusId: number;
    status: {
      id: number;
      name: string;
      color: string;
    };
  }>;
}

interface Service {
  id: number;
  clientId: number;
  vehicleId: number;
  appointmentId: number | null;
  statusId: number;
  receivedBy: number | null;
  receivedAt: string | null;
  kilometraje: number | null;
  nivelCombustible: string | null;
  lucesOk: boolean;
  llantasOk: boolean;
  cristalesOk: boolean;
  carroceriaOk: boolean;
  observacionesRecepcion: string | null;
  firmaCliente: string | null;
  fotosRecepcion: string[] | null;
  client: {
    id: number;
    name: string;
    phone: string;
    whatsapp: string | null;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year: number | null;
    color: string | null;
  };
  receptionist?: {
    id: number;
    name: string;
    email: string | null;
  };
  status: {
    id: number;
    name: string;
    color: string;
  };
}

export const useReception = () => {
  const queryClient = useQueryClient();

  // Obtener citas del día
  const {
    data: todayAppointments = [],
    isLoading: isLoadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useQuery<Appointment[]>({
    queryKey: ['reception', 'today'],
    queryFn: async () => {
      const response = await api.get('/reception/today');
      return response.data;
    },
    refetchInterval: 60000, // Auto-refresh cada 60 segundos
  });

  // Recibir vehículo
  const receiveVehicleMutation = useMutation({
    mutationFn: async (data: VehicleReceptionInput) => {
      const response = await api.post('/reception/receive-vehicle', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Vehículo recibido exitosamente');
      queryClient.invalidateQueries({ queryKey: ['reception', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al recibir vehículo';
      toast.error(message);
      throw error;
    },
  });

  // Obtener detalles de un servicio
  const getServiceDetails = async (serviceId: number): Promise<Service> => {
    const response = await api.get(`/reception/service/${serviceId}`);
    return response.data;
  };

  return {
    // Queries
    todayAppointments,
    isLoadingAppointments,
    appointmentsError,
    refetchAppointments,

    // Mutations
    receiveVehicle: receiveVehicleMutation.mutate,
    receiveVehicleAsync: receiveVehicleMutation.mutateAsync,
    isReceivingVehicle: receiveVehicleMutation.isPending,

    // Utils
    getServiceDetails,
  };
};
