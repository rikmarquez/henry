import { useState, useEffect } from 'react';
import { X, Phone, Car, User, Calendar, Clock, AlertCircle, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

// Schema para cita telefónica (datos mínimos)
const phoneAppointmentSchema = z.object({
  type: z.literal('phone'),
  clientName: z.string().min(1, 'Nombre del cliente es requerido'),
  clientPhone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  vehicleDescription: z.string().min(1, 'Descripción del vehículo es requerida'),
  scheduledDate: z.string().min(1, 'Fecha y hora son requeridas'),
  notes: z.string().optional(),
});

// Schema para cita desde oportunidad (datos completos)
const opportunityAppointmentSchema = z.object({
  type: z.literal('opportunity'),
  clientId: z.number().min(1, 'Cliente es requerido'),
  vehicleId: z.number().min(1, 'Vehículo es requerido'),
  opportunityId: z.number().optional(),
  scheduledDate: z.string().min(1, 'Fecha y hora son requeridas'),
  notes: z.string().optional(),
});

type PhoneAppointmentForm = z.infer<typeof phoneAppointmentSchema>;
type OpportunityAppointmentForm = z.infer<typeof opportunityAppointmentSchema>;

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedDate?: Date;
  preselectedOpportunity?: {
    id: number;
    clientId: number;
    vehicleId: number;
    description: string;
  };
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  clientId: number;
}

interface Opportunity {
  id: number;
  type: string;
  description: string;
  client: {
    id: number;
    name: string;
  };
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
  };
}

const CreateAppointmentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  preselectedDate,
  preselectedOpportunity 
}: CreateAppointmentModalProps) => {
  const [appointmentType, setAppointmentType] = useState<'phone' | 'opportunity'>(
    preselectedOpportunity ? 'opportunity' : 'phone'
  );
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [phoneClientSuggestion, setPhoneClientSuggestion] = useState<Client | null>(null);

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get default date (preselected or current time)
  const getDefaultDateTime = () => {
    if (preselectedDate) {
      // Use preselected date but set a default time (e.g., 9:00 AM)
      const defaultTime = new Date(preselectedDate);
      defaultTime.setHours(9, 0, 0, 0);
      return formatDateTimeLocal(defaultTime);
    }
    // Default to current time + 1 hour
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1, 0, 0, 0);
    return formatDateTimeLocal(defaultTime);
  };

  // Form for phone appointments
  const phoneForm = useForm<PhoneAppointmentForm>({
    resolver: zodResolver(phoneAppointmentSchema),
    defaultValues: {
      type: 'phone',
      clientName: '',
      clientPhone: '',
      vehicleDescription: '',
      scheduledDate: getDefaultDateTime(),
      notes: '',
    }
  });

  // Form for opportunity appointments
  const opportunityForm = useForm<OpportunityAppointmentForm>({
    resolver: zodResolver(opportunityAppointmentSchema),
    defaultValues: {
      type: 'opportunity',
      clientId: preselectedOpportunity?.clientId || 0,
      vehicleId: preselectedOpportunity?.vehicleId || 0,
      opportunityId: preselectedOpportunity?.id,
      scheduledDate: getDefaultDateTime(),
      notes: preselectedOpportunity?.description || '',
    }
  });

  // Search clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'search', clientSearch],
    queryFn: async () => {
      if (!clientSearch.trim()) return { data: { clients: [] } };
      const response = await api.get(`/clients?search=${clientSearch}&limit=10`);
      return response.data;
    },
    enabled: appointmentType === 'opportunity' && clientSearch.length > 0,
  });

  // Get vehicles for selected client
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'client', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return { data: { vehicles: [] } };
      const response = await api.get(`/vehicles?clientId=${selectedClient.id}`);
      return response.data;
    },
    enabled: !!selectedClient?.id,
  });

  // Get opportunities for creating appointments
  const { data: opportunitiesData } = useQuery({
    queryKey: ['opportunities', 'pending'],
    queryFn: async () => {
      const response = await api.get('/opportunities?status=pending&limit=20');
      return response.data;
    },
    enabled: appointmentType === 'opportunity' && !preselectedOpportunity,
  });

  // Check if client exists by phone for phone appointments
  const phoneNumber = phoneForm.watch('clientPhone');
  const { data: phoneClientData } = useQuery({
    queryKey: ['client', 'phone', phoneNumber],
    queryFn: async () => {
      if (!phoneNumber || phoneNumber.length < 10) return null;
      try {
        const response = await api.get(`/clients?search=${phoneNumber}&limit=1`);
        const clients = response.data?.data?.clients || [];
        return clients.length > 0 ? clients[0] : null;
      } catch {
        return null;
      }
    },
    enabled: appointmentType === 'phone' && !!phoneNumber && phoneNumber.length >= 10,
  });

  // Update suggestion when phone client data changes
  useEffect(() => {
    if (phoneClientData) {
      setPhoneClientSuggestion(phoneClientData);
    } else {
      setPhoneClientSuggestion(null);
    }
  }, [phoneClientData]);

  // Update forms when preselected date changes
  useEffect(() => {
    if (preselectedDate) {
      const newDateTime = getDefaultDateTime();
      phoneForm.setValue('scheduledDate', newDateTime);
      opportunityForm.setValue('scheduledDate', newDateTime);
    }
  }, [preselectedDate, phoneForm, opportunityForm]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (appointmentType === 'phone') {
        // For phone appointments, we need to create client and vehicle first or find existing ones
        return await api.post('/appointments/phone', data);
      } else {
        // For opportunity appointments, use existing client/vehicle data
        return await api.post('/appointments', data);
      }
    },
    onSuccess: () => {
      toast.success('Cita creada exitosamente');
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la cita');
    }
  });

  const handleClose = () => {
    phoneForm.reset({
      type: 'phone',
      clientName: '',
      clientPhone: '',
      vehicleDescription: '',
      scheduledDate: getDefaultDateTime(),
      notes: '',
    });
    opportunityForm.reset({
      type: 'opportunity',
      clientId: preselectedOpportunity?.clientId || 0,
      vehicleId: preselectedOpportunity?.vehicleId || 0,
      opportunityId: preselectedOpportunity?.id,
      scheduledDate: getDefaultDateTime(),
      notes: preselectedOpportunity?.description || '',
    });
    setSelectedClient(null);
    setSelectedVehicle(null);
    setClientSearch('');
    onClose();
  };

  const onSubmitPhone = (data: PhoneAppointmentForm) => {
    createMutation.mutate({
      type: 'phone',
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      vehicleDescription: data.vehicleDescription,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      notes: data.notes,
    });
  };

  const onSubmitOpportunity = (data: OpportunityAppointmentForm) => {
    createMutation.mutate({
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      opportunityId: data.opportunityId,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      notes: data.notes,
      isFromOpportunity: !!data.opportunityId,
    });
  };

  // Set minimum date/time to now
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Cita</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Appointment Type Selection */}
          {!preselectedOpportunity && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Tipo de Cita
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setAppointmentType('phone')}
                  className={`flex items-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                    appointmentType === 'phone'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div>Cita Telefónica</div>
                    <div className="text-xs text-gray-500">Datos mínimos - cliente nuevo</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setAppointmentType('opportunity')}
                  className={`flex items-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                    appointmentType === 'opportunity'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div>Cliente Existente</div>
                    <div className="text-xs text-gray-500">Datos completos - desde oportunidad</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Phone Appointment Form */}
          {appointmentType === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Cita Telefónica - Información Mínima</p>
                    <p>Solo nombre, teléfono y descripción básica del vehículo. Los datos completos se capturarán cuando llegue el cliente.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline h-4 w-4 mr-1" />
                    Nombre del Cliente *
                  </label>
                  <input
                    {...phoneForm.register('clientName')}
                    type="text"
                    placeholder="Ej: Ricardo Márquez"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {phoneForm.formState.errors.clientName && (
                    <p className="mt-1 text-sm text-red-600">
                      {phoneForm.formState.errors.clientName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Teléfono/WhatsApp *
                  </label>
                  <input
                    {...phoneForm.register('clientPhone')}
                    type="tel"
                    placeholder="Ej: 3121069077"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {phoneForm.formState.errors.clientPhone && (
                    <p className="mt-1 text-sm text-red-600">
                      {phoneForm.formState.errors.clientPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Client Suggestion for existing phone number */}
              {phoneClientSuggestion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Cliente Existente Detectado</p>
                      <p className="text-sm text-blue-700 mb-2">
                        Encontramos un cliente con este teléfono: <strong>{phoneClientSuggestion.name}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          phoneForm.setValue('clientName', phoneClientSuggestion.name);
                          toast.success('Nombre actualizado con cliente existente');
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                      >
                        Usar nombre existente
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Car className="inline h-4 w-4 mr-1" />
                  Descripción del Vehículo *
                </label>
                <input
                  {...phoneForm.register('vehicleDescription')}
                  type="text"
                  placeholder="Ej: Honda HRV, Nissan Versa 2020, Toyota Corolla blanco"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Solo marca/modelo. La placa y datos específicos se capturarán al llegar.
                </p>
                {phoneForm.formState.errors.vehicleDescription && (
                  <p className="mt-1 text-sm text-red-600">
                    {phoneForm.formState.errors.vehicleDescription.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Fecha y Hora *
                </label>
                <input
                  {...phoneForm.register('scheduledDate')}
                  type="datetime-local"
                  min={getMinDateTime()}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {phoneForm.formState.errors.scheduledDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {phoneForm.formState.errors.scheduledDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  {...phoneForm.register('notes')}
                  rows={3}
                  placeholder="Problema reportado, observaciones..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear Cita Telefónica'}
                </button>
              </div>
            </form>
          )}

          {/* Opportunity Appointment Form */}
          {appointmentType === 'opportunity' && (
            <form onSubmit={opportunityForm.handleSubmit(onSubmitOpportunity)} className="space-y-4">
              {preselectedOpportunity ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium">Cita desde Oportunidad</p>
                      <p>Cliente y vehículo ya seleccionados. Solo elige fecha y hora.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Cliente Existente</p>
                      <p>Todos los datos del cliente y vehículo ya están registrados en el sistema.</p>
                    </div>
                  </div>
                </div>
              )}

              {!preselectedOpportunity && (
                <>
                  {/* Client Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Search className="inline h-4 w-4 mr-1" />
                      Buscar Cliente
                    </label>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar por nombre o teléfono..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    
                    {clientsData?.data?.clients?.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-md max-h-32 overflow-y-auto">
                        {clientsData.data.clients.map((client: Client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(client);
                              opportunityForm.setValue('clientId', client.id);
                              setClientSearch(client.name);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vehicle Selection */}
                  {selectedClient && vehiclesData?.data?.vehicles?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Car className="inline h-4 w-4 mr-1" />
                        Seleccionar Vehículo
                      </label>
                      <select
                        {...opportunityForm.register('vehicleId', { valueAsNumber: true })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value={0}>Selecciona un vehículo</option>
                        {vehiclesData.data.vehicles.map((vehicle: Vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} - {vehicle.plate}
                            {vehicle.year && ` (${vehicle.year})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Fecha y Hora *
                </label>
                <input
                  {...opportunityForm.register('scheduledDate')}
                  type="datetime-local"
                  min={getMinDateTime()}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {opportunityForm.formState.errors.scheduledDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {opportunityForm.formState.errors.scheduledDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  {...opportunityForm.register('notes')}
                  rows={3}
                  placeholder="Detalles adicionales de la cita..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || (!preselectedOpportunity && (!selectedClient || !opportunityForm.watch('vehicleId')))}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear Cita'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;