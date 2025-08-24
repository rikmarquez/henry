import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Building2, Clock, Globe, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

// Validation schema
const generalSettingsSchema = z.object({
  // Información básica del taller
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado/provincia es requerido'),
  zipCode: z.string().optional(),
  country: z.string().default('México'),

  // Información de contacto
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),

  // Horarios de trabajo
  workingHours: z.object({
    monday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    tuesday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    wednesday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    thursday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    friday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    saturday: z.object({
      isOpen: z.boolean().default(false),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('14:00')
    }),
    sunday: z.object({
      isOpen: z.boolean().default(false),
      openTime: z.string().default('09:00'),
      closeTime: z.string().default('13:00')
    })
  }),

  // Configuraciones regionales
  currency: z.string().default('MXN'),
  timezone: z.string().default('America/Mexico_City'),
  language: z.string().default('es-MX'),

  // Información fiscal
  taxId: z.string().optional().or(z.literal('')), // RFC en México
  taxRegime: z.string().optional().or(z.literal('')),
  
  // Logo y branding
  logoUrl: z.string().optional(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;

const days = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function GeneralSettingsSection() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'México',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      workingHours: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        saturday: { isOpen: false, openTime: '08:00', closeTime: '14:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '13:00' },
      },
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es-MX',
      taxId: '',
      taxRegime: '',
      logoUrl: '',
    }
  });

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/general');
      if (response.data.success && response.data.data) {
        form.reset(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      // No mostrar error si es que no existen configuraciones previas
      if (error.response?.status !== 404) {
        toast.error('Error al cargar configuraciones');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: GeneralSettingsData) => {
    try {
      setSaving(true);
      const response = await api.post('/settings/general', data);
      
      if (response.data.success) {
        toast.success('Configuración guardada correctamente');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Building2 className="h-6 w-6 mr-2 text-blue-600" />
          Información General del Taller
        </h2>
        <p className="text-gray-600 mt-1">
          Configura la información básica de tu taller mecánico
        </p>
      </div>

      {/* Información Básica */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-gray-600" />
          Información Básica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Taller *
            </label>
            <input
              {...form.register('name')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. Taller Mecánico Henry"
            />
            {form.formState.errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono Principal *
            </label>
            <input
              {...form.register('phone')}
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. 5551234567"
            />
            {form.formState.errors.phone && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...form.register('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Breve descripción de tu taller y servicios..."
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-gray-600" />
          Dirección
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              {...form.register('address')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Calle, número, colonia..."
            />
            {form.formState.errors.address && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              {...form.register('city')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. Ciudad de México"
            />
            {form.formState.errors.city && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.city.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado/Provincia *
            </label>
            <input
              {...form.register('state')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. CDMX"
            />
            {form.formState.errors.state && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.state.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              {...form.register('zipCode')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. 01234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              {...form.register('country')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="México"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              {...form.register('whatsapp')}
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. 5551234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              {...form.register('email')}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. contacto@mitaller.com"
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              {...form.register('website')}
              type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.mitaller.com"
            />
            {form.formState.errors.website && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.website.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Horarios de Trabajo */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-600" />
          Horarios de Trabajo
        </h3>
        
        <div className="space-y-4">
          {days.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-24 flex-shrink-0">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    {...form.register(`workingHours.${key}.isOpen` as const)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  {...form.register(`workingHours.${key}.openTime` as const)}
                  disabled={!form.watch(`workingHours.${key}.isOpen`)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  {...form.register(`workingHours.${key}.closeTime` as const)}
                  disabled={!form.watch(`workingHours.${key}.isOpen`)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información Fiscal */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Información Fiscal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFC
            </label>
            <input
              {...form.register('taxId')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. XAXX010101000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Régimen Fiscal
            </label>
            <input
              {...form.register('taxRegime')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. Persona Física con Actividades Empresariales"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </form>
  );
}