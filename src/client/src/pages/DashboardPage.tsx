import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Loader2, Users, Car, Calendar, Wrench, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardData {
  overview: {
    totalClients: number;
    totalVehicles: number;
    totalMechanics: number;
    totalAppointments: number;
    totalServices: number;
    totalOpportunities: number;
  };
  active: {
    activeClients: number;
    activeMechanics: number;
    pendingAppointments: number;
    inProgressServices: number;
    pendingOpportunities: number;
  };
  revenue: {
    total: number;
    period: string;
  };
  recentServices: Array<{
    id: number;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
    status: { name: string; color: string };
    totalAmount: number;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get('/reports/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h2>
          <p className="text-gray-600">No se pudieron cargar las métricas del taller.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Bienvenido, {user?.name} - Henry Diagnostics
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString('es-CO')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Clientes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Totales</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalClients || 0}</p>
                <p className="text-sm text-green-600">
                  {dashboardData?.active.activeClients || 0} activos
                </p>
              </div>
            </div>
          </div>

          {/* Vehículos */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehículos</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalVehicles || 0}</p>
                <p className="text-sm text-gray-500">Registrados</p>
              </div>
            </div>
          </div>

          {/* Citas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Citas</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalAppointments || 0}</p>
                <p className="text-sm text-yellow-600">
                  {dashboardData?.active.pendingAppointments || 0} pendientes
                </p>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalServices || 0}</p>
                <p className="text-sm text-purple-600">
                  {dashboardData?.active.inProgressServices || 0} en progreso
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ingresos */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.revenue.total || 0)}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {dashboardData?.revenue.period === 'all-time' ? 'Histórico' : 'Periodo personalizado'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Mecánicos */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mecánicos</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalMechanics || 0}</p>
                <p className="text-sm text-blue-600">
                  {dashboardData?.active.activeMechanics || 0} activos
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Oportunidades */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.overview.totalOpportunities || 0}</p>
                <p className="text-sm text-orange-600">
                  {dashboardData?.active.pendingOpportunities || 0} pendientes
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Servicios Recientes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Servicios Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.recentServices?.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.vehicle.brand} {service.vehicle.model} ({service.vehicle.plate})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: service.status.color }}
                      >
                        {service.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(service.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(service.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!dashboardData?.recentServices || dashboardData.recentServices.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No hay servicios recientes para mostrar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}