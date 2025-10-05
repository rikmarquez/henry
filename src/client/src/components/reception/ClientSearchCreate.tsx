import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  Search,
  User,
  Phone,
  Plus,
  ChevronRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// Schema para crear cliente
const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .regex(/^[+]?[\d\s-()]+$/, 'Formato de teléfono inválido'),
  whatsapp: z
    .string()
    .min(10, 'El WhatsApp debe tener al menos 10 dígitos')
    .regex(/^[+]?[\d\s-()]+$/, 'Formato de WhatsApp inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientSearchCreateProps {
  onClientSelected: (client: any) => void;
  onCancel: () => void;
}

export const ClientSearchCreate: React.FC<ClientSearchCreateProps> = ({
  onClientSelected,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Query para buscar clientes (carga todos y filtra en frontend)
  const { data: clients = [], isLoading: isSearching } = useQuery({
    queryKey: ['clients-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // Cargar todos los clientes
      const { data } = await api.get('/clients?limit=1000');
      const allClients = data.data?.clients || data.clients || [];

      // Filtrar en el frontend
      const filteredClients = allClients.filter((client: any) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.whatsapp && client.whatsapp.includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredClients;
    },
    enabled: searchTerm.length >= 2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const handleCreateClient = async (formData: ClientFormData) => {
    try {
      setIsCreating(true);

      // Copiar whatsapp a phone si es necesario
      const dataToSend = {
        ...formData,
        phone: formData.whatsapp, // Backend requiere phone
      };

      const { data } = await api.post('/clients', dataToSend);
      toast.success('Cliente creado exitosamente');
      onClientSelected(data);
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    } finally {
      setIsCreating(false);
    }
  };

  // Vista del formulario de creación
  if (showCreateForm) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Crear Cliente Nuevo
        </h2>

        <form onSubmit={handleSubmit(handleCreateClient)} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Juan Pérez García"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('whatsapp')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 3331234567"
            />
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: cliente@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección (opcional)
            </label>
            <textarea
              {...register('address')}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Calle Principal #123, Colonia Centro"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Crear Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Vista de búsqueda
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <User className="h-6 w-6 text-blue-600" />
        Paso 1: Buscar o Crear Cliente
      </h2>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            autoFocus
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Escribe al menos 2 caracteres para buscar
        </p>
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Buscando...</span>
        </div>
      )}

      {/* Resultados */}
      {!isSearching && searchTerm.length >= 2 && (
        <div className="space-y-3 mb-6">
          {clients.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-600 mb-4">No se encontró ningún cliente</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                Crear Cliente Nuevo
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}:
              </p>
              {clients.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => onClientSelected(client)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                        {client.whatsapp && client.whatsapp !== client.phone && (
                          <span>• WhatsApp: {client.whatsapp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Botón Crear Nuevo (visible siempre) */}
      {!isSearching && searchTerm.length < 2 && (
        <div className="text-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            Crear Cliente Nuevo
          </button>
        </div>
      )}

      {/* Botón Cancelar */}
      <div className="mt-6 pt-6 border-t">
        <button
          onClick={onCancel}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
