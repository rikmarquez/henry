import { Plus, Calendar, List, Clock } from 'lucide-react';

interface MobileNavigationProps {
  viewMode: 'day' | 'week' | 'month' | 'list';
  onViewModeChange: (mode: 'day' | 'week' | 'month' | 'list') => void;
  onCreateAppointment: () => void;
  canCreate?: boolean;
}

const MobileNavigation = ({
  viewMode,
  onViewModeChange,
  onCreateAppointment,
  canCreate = true
}: MobileNavigationProps) => {
  const navItems = [
    {
      id: 'list',
      label: 'Lista',
      icon: List,
      active: viewMode === 'list'
    },
    {
      id: 'day',
      label: 'Hoy',
      icon: Clock,
      active: viewMode === 'day'
    },
    {
      id: 'month',
      label: 'Mes',
      icon: Calendar,
      active: viewMode === 'month'
    }
  ];

  return (
    <div className="flex flex-col space-y-3">
      {/* Main Navigation Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewModeChange(item.id as 'day' | 'week' | 'month' | 'list')}
              className={`flex-1 flex flex-col items-center py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                item.active
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-200'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Create Button */}
      {canCreate && (
        <button
          onClick={onCreateAppointment}
          className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg shadow-sm transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Cita
        </button>
      )}
    </div>
  );
};

export default MobileNavigation;