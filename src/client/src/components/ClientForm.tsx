import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { X, Loader2 } from 'lucide-react';

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
}).refine((data) => data.whatsapp || data.phone, {
  message: 'Al menos WhatsApp o teléfono es requerido',
  path: ['phone'],
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: number;
  name: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface ClientFormProps {
  client?: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClientForm({ client, isOpen, onClose, onSuccess }: ClientFormProps) {
  const [error, setError] = useState<string>('');
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
    },
  });

  // Update form values when client prop changes
  useEffect(() => {
    if (client) {
      reset({
        name: client.name || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        address: client.address || '',
      });
    } else {
      // Reset form for new client
      reset({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
      });
    }
  }, [client, reset]);

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const payload = {
        name: data.name.toUpperCase(),
        whatsapp: data.whatsapp || data.phone,
        phone: data.phone || data.whatsapp,
        email: data.email?.toUpperCase() || null,
        address: data.address?.toUpperCase() || null,
      };
      const response = await api.post('/clients', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al crear el cliente');
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!client) throw new Error('Cliente no encontrado');
      // Solo enviar los campos específicos que necesitamos
      const payload = {
        name: data.name.toUpperCase(),
        whatsapp: data.whatsapp || data.phone,
        phone: data.phone || data.whatsapp,
        email: data.email?.toUpperCase() || null,
        address: data.address?.toUpperCase() || null,
      };
      const response = await api.put(`/clients/${client.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al actualizar el cliente');
    },
  });

  const onSubmit = (data: ClientFormData) => {
    setError('');
    if (isEditing) {
      updateClientMutation.mutate(data);
    } else {
      createClientMutation.mutate(data);
    }
  };

  const isLoading = createClientMutation.isPending || updateClientMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del cliente"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="3001234567"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              id="whatsapp"
              {...register('whatsapp')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="3001234567 (opcional)"
              disabled={isLoading}
            />
            {errors.whatsapp && (
              <p className="text-red-500 text-sm mt-1">{errors.whatsapp.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="correo@ejemplo.com (opcional)"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              id="address"
              {...register('address')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Dirección (opcional)"
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}