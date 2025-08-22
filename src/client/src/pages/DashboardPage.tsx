import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Loader2, Users, Car, Calendar, Wrench, TrendingUp, AlertCircle, Target, Clock, ArrowRight } from 'lucide-react';

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
  upcomingOpportunities: Array<{
    id: number;
    type: string;
    description: string;
    followUpDate: string;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
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

        {/* Grid para Servicios Recientes y Oportunidades Próximas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Oportunidades Próximas */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Seguimientos Próximos
                </h2>
                <span className="text-sm text-orange-600 font-medium">
                  {dashboardData?.upcomingOpportunities?.length || 0} requieren atención
                </span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.upcomingOpportunities && dashboardData.upcomingOpportunities.length > 0 ? (
                <div className="space-y-4 p-6">
                  {dashboardData.upcomingOpportunities.map((opportunity) => {
                    const followUpDate = new Date(opportunity.followUpDate);
                    const today = new Date();
                    const diffTime = followUpDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays < 0;
                    const isDueToday = diffDays === 0;
                    const isDueSoon = diffDays > 0 && diffDays <= 7;
                    
                    return (
                      <div key={opportunity.id} className={`border rounded-lg p-4 ${
                        isOverdue ? 'border-red-200 bg-red-50' : 
                        isDueToday ? 'border-orange-200 bg-orange-50' :
                        isDueSoon ? 'border-yellow-200 bg-yellow-50' : 
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`h-4 w-4 ${
                                isOverdue ? 'text-red-600' : 
                                isDueToday ? 'text-orange-600' :
                                'text-yellow-600'
                              }`} />
                              <span className="font-medium text-gray-900">
                                {opportunity.client.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {opportunity.vehicle.plate} - {opportunity.vehicle.brand} {opportunity.vehicle.model}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">{opportunity.type}:</span> {opportunity.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className={`font-medium ${
                                isOverdue ? 'text-red-600' : 
                                isDueToday ? 'text-orange-600' :
                                'text-yellow-600'
                              }`}>
                                {isOverdue ? `Vencido hace ${Math.abs(diffDays)} días` :
                                 isDueToday ? 'Vence hoy' :
                                 `Vence en ${diffDays} días`}
                              </span>
                              <span className="text-gray-500">
                                {followUpDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button className="ml-3 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors">
                            <ArrowRight className="h-3 w-3" />
                            Contactar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No hay oportunidades próximas</p>
                  <p className="text-sm mt-1">Todas las oportunidades están al día</p>
                </div>
              )}
            </div>
          </div>

          {/* Servicios Recientes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Servicios Recientes
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {dashboardData?.recentServices && dashboardData.recentServices.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dashboardData.recentServices.map((service) => (
                    <div key={service.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {service.client.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {service.vehicle.brand} {service.vehicle.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">
                              {service.vehicle.plate}
                            </span>
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: service.status.color }}
                            >
                              {service.status.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(service.totalAmount)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(service.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No hay servicios recientes</p>
                  <p className="text-sm mt-1">Los servicios aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}