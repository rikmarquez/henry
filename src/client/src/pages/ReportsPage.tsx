import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Wrench,
  Users,
  Car,
  Calendar,
  Package,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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
    total: string | number;
    period: string;
  };
  recentServices: Array<{
    id: number;
    problemDescription: string;
    totalAmount: string;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
    status: { name: string; color: string };
    createdAt: string;
  }>;
}

interface ServiceReportData {
  servicesByStatus: Array<{
    statusId: number;
    _count: { id: number };
    status: { name: string; color: string };
  }>;
  servicesByMechanic: Array<{
    mechanicId: number;
    _count: { id: number };
    _sum: { totalAmount: string; mechanicCommission: string };
    mechanic: { name: string };
  }>;
  averageServiceValue: number;
  totalServices: number;
  completion: {
    completed: number;
    total: number;
    completionRate: number;
  };
}

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(num);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all-time');

  // Main dashboard data
  const { data: dashboardData, isLoading: loadingDashboard, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ['dashboard', selectedPeriod],
    queryFn: async () => {
      const params = selectedPeriod !== 'all-time' ? `?period=${selectedPeriod}` : '';
      const response = await api.get(`/reports/dashboard${params}`);
      return response.data.data;
    },
  });

  // Services report data for charts
  const { data: servicesData, isLoading: loadingServices } = useQuery<ServiceReportData>({
    queryKey: ['services-report', selectedPeriod],
    queryFn: async () => {
      const params = selectedPeriod !== 'all-time' ? `?period=${selectedPeriod}` : '';
      const response = await api.get(`/reports/services${params}`);
      return response.data.data;
    },
  });

  if (loadingDashboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando reportes...</span>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Error al cargar reportes</h2>
          <p className="text-gray-600">No se pudieron cargar los datos del dashboard</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Chart data preparation
  const statusChartData = servicesData ? {
    labels: servicesData.servicesByStatus.map(item => item.status?.name || 'Sin estado'),
    datasets: [
      {
        label: 'Servicios por Estado',
        data: servicesData.servicesByStatus.map(item => item._count.id),
        backgroundColor: servicesData.servicesByStatus.map(item => 
          item.status?.color ? `${item.status.color}80` : '#6B728080'
        ),
        borderColor: servicesData.servicesByStatus.map(item => 
          item.status?.color || '#6B7280'
        ),
        borderWidth: 2,
      },
    ],
  } : null;

  const mechanicProductivityData = servicesData ? {
    labels: servicesData.servicesByMechanic.map(item => item.mechanic?.name || 'Sin asignar'),
    datasets: [
      {
        label: 'Servicios Realizados',
        data: servicesData.servicesByMechanic.map(item => item._count.id),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Ingresos Generados',
        data: servicesData.servicesByMechanic.map(item => parseFloat(item._sum.totalAmount || '0')),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  const mechanicChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Mecánicos'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Número de Servicios'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Ingresos (MXN)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            Dashboard de Reportes
          </h1>
          <p className="text-gray-600 mt-1">Métricas y análisis del taller</p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all-time">Todo el tiempo</option>
            <option value="last-month">Último mes</option>
            <option value="last-week">Última semana</option>
            <option value="today">Hoy</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Ingresos</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.revenue.total)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Servicios Totales</p>
              <p className="text-2xl font-bold">{dashboardData.overview.totalServices}</p>
            </div>
            <Wrench className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Clientes</p>
              <p className="text-2xl font-bold">{dashboardData.overview.totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Vehículos</p>
              <p className="text-2xl font-bold">{dashboardData.overview.totalVehicles}</p>
            </div>
            <Car className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Servicios por Estado
          </h3>
          {statusChartData ? (
            <div className="h-80">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Mechanic Productivity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Productividad por Mecánico
          </h3>
          {mechanicProductivityData ? (
            <div className="h-80">
              <Bar data={mechanicProductivityData} options={mechanicChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Recent Services & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas Rápidas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mecánicos Activos</span>
              <span className="font-semibold">{dashboardData.active.activeMechanics}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Servicios en Progreso</span>
              <span className="font-semibold text-orange-600">{dashboardData.active.inProgressServices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Citas Pendientes</span>
              <span className="font-semibold text-blue-600">{dashboardData.active.pendingAppointments}</span>
            </div>
            {servicesData && (
              <>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor Promedio Servicio</span>
                    <span className="font-semibold">{formatCurrency(servicesData.averageServiceValue)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tasa de Finalización</span>
                  <span className="font-semibold text-green-600">
                    {servicesData.completion.completionRate.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Services */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Servicios Recientes
          </h3>
          <div className="space-y-3">
            {dashboardData.recentServices.length > 0 ? (
              dashboardData.recentServices.map((service) => (
                <div key={service.id} className="border-l-4 pl-4 py-2" style={{ borderColor: service.status.color }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {service.problemDescription || 'Sin descripción'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {service.client.name} - {service.vehicle.brand} {service.vehicle.model} ({service.vehicle.plate})
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(service.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(service.totalAmount)}</p>
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${service.status.color}20`,
                          color: service.status.color 
                        }}
                      >
                        {service.status.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No hay servicios recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}