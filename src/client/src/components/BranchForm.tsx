import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Code, AlertCircle } from 'lucide-react';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string | null;
  city: string;
  isActive: boolean;
}

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BranchForm({ branch, onSubmit, onCancel, isLoading }: BranchFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone,
        email: branch.email || '',
        city: branch.city,
        isActive: branch.isActive,
      });
    }
  }, [branch]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (formData.code.length < 3) {
      newErrors.code = 'El código debe tener al menos 3 caracteres';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      email: formData.email || null,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Building2 className="w-4 h-4 inline mr-2" />
          Nombre de la Sucursal *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: Henry Diagnostics Central"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Code className="w-4 h-4 inline mr-2" />
          Código de Sucursal *
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.code ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: HD001"
          maxLength={10}
        />
        {errors.code && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.code}
          </p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <MapPin className="w-4 h-4 inline mr-2" />
          Ciudad *
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.city ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: Ciudad de México"
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.city}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <MapPin className="w-4 h-4 inline mr-2" />
          Dirección Completa *
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.address ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: Calle Reforma 123, Col. Centro, CP 06000"
          rows={2}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.address}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Phone className="w-4 h-4 inline mr-2" />
          Teléfono *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: +52-555-000-0000"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Mail className="w-4 h-4 inline mr-2" />
          Email (Opcional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: central@henrydiagnostics.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Active Status - Only show when editing */}
      {branch && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Sucursal activa
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <span>{branch ? 'Actualizar' : 'Crear'} Sucursal</span>
          )}
        </button>
      </div>
    </form>
  );
}