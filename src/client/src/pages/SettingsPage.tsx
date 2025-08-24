import { useState } from 'react';
import { 
  Building2, 
  Users, 
  Settings as SettingsIcon, 
  DollarSign, 
  Bell, 
  Zap,
  ChevronRight 
} from 'lucide-react';

// Types
interface ConfigSection {
  id: string;
  icon: any;
  title: string;
  description: string;
  isAvailable: boolean;
}

const configSections: ConfigSection[] = [
  {
    id: 'general',
    icon: Building2,
    title: 'Información General',
    description: 'Datos del taller y configuración básica',
    isAvailable: true
  },
  {
    id: 'services',
    icon: SettingsIcon,
    title: 'Servicios',
    description: 'Estados, tipos y configuración de servicios',
    isAvailable: false
  },
  {
    id: 'roles',
    icon: Users,
    title: 'Roles y Permisos',
    description: 'Gestión de usuarios y permisos',
    isAvailable: false
  },
  {
    id: 'finance',
    icon: DollarSign,
    title: 'Finanzas',
    description: 'Precios, impuestos y métodos de pago',
    isAvailable: false
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notificaciones',
    description: 'Alertas y comunicación automática',
    isAvailable: false
  },
  {
    id: 'integrations',
    icon: Zap,
    title: 'Integraciones',
    description: 'APIs externas y herramientas',
    isAvailable: false
  }
];

// Components
import GeneralSettingsSection from '../components/settings/GeneralSettingsSection';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettingsSection />;
      case 'services':
        return <div className="p-6 text-center text-gray-500">Próximamente disponible</div>;
      case 'roles':
        return <div className="p-6 text-center text-gray-500">Próximamente disponible</div>;
      case 'finance':
        return <div className="p-6 text-center text-gray-500">Próximamente disponible</div>;
      case 'notifications':
        return <div className="p-6 text-center text-gray-500">Próximamente disponible</div>;
      case 'integrations':
        return <div className="p-6 text-center text-gray-500">Próximamente disponible</div>;
      default:
        return <GeneralSettingsSection />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Personaliza y configura tu sistema de gestión de taller</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Secciones</h2>
          </div>
          <div className="p-2">
            {configSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                disabled={!section.isAvailable}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors mb-1 ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : section.isAvailable
                    ? 'hover:bg-gray-50 text-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <section.icon className={`h-5 w-5 mr-3 ${
                    activeSection === section.id
                      ? 'text-blue-500'
                      : section.isAvailable
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`} />
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm opacity-70">{section.description}</div>
                  </div>
                </div>
                {section.isAvailable && (
                  <ChevronRight className={`h-4 w-4 ${
                    activeSection === section.id ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                )}
                {!section.isAvailable && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    Próximamente
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}