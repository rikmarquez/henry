import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useBranch } from '../contexts/BranchContext';
import { 
  Home, 
  Users, 
  Car, 
  Calendar, 
  Wrench, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Target,
  UserCog,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { currentBranch, isAdmin } = useBranch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Create navigation array dynamically based on permissions
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Citas', href: '/appointments', icon: Calendar },
      { name: 'Servicios', href: '/services', icon: Wrench },
      { name: 'Oportunidades', href: '/opportunities', icon: Target },
      { name: 'Clientes', href: '/clients', icon: Users },
      { name: 'Vehículos', href: '/vehicles', icon: Car },
      { name: 'Mecánicos', href: '/mechanics', icon: UserCog },
      { name: 'Reportes', href: '/reports', icon: BarChart3 },
    ];

    // Add admin-only routes
    if (isAdmin) {
      baseNavigation.push({ name: 'Usuarios', href: '/users', icon: Users });
      baseNavigation.push({ name: 'Sucursales', href: '/branches', icon: Building2 });
    }

    baseNavigation.push({ name: 'Configuración', href: '/settings', icon: Settings });
    
    return baseNavigation;
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HD</span>
                </div>
                <span className="ml-2 font-bold text-gray-900">Henry Diagnostics</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors`}
                    >
                      <item.icon className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-5 w-5`} />
                      {item.name}
                    </a>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-500">
                  <span className="text-sm font-medium leading-none text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {user?.role.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          {/* Header del sidebar */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <img 
              src="/logo.png" 
              alt="Henry Diagnostics" 
              className="h-8 w-auto"
            />
            <span className="ml-2 font-bold text-gray-900">Henry Diagnostics</span>
          </div>

          {/* Navegación */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors`}
                  >
                    <item.icon className={`${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5`} />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Usuario footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-500 flex-shrink-0">
                  <span className="text-sm font-medium leading-none text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs font-medium text-gray-500 truncate">
                    {user?.role.name}
                  </p>
                  {currentBranch && (
                    <p className="text-xs text-blue-600 truncate flex items-center">
                      <Building2 className="w-3 h-3 mr-1" />
                      {currentBranch.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500 transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
            <div className="flex items-center">
              <button
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-2">
                <img 
                  src="/logo.png" 
                  alt="Henry Diagnostics" 
                  className="h-6 w-auto"
                />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}