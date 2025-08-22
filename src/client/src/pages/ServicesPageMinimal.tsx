import { useState, useEffect } from 'react';

function ServicesPageMinimal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ServicesPageMinimal: useEffect ejecutado');
    
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('ServicesPageMinimal: Carga completada');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  console.log('ServicesPageMinimal: Renderizando', { loading, error });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Módulo de Servicios - Versión Mínima
        </h1>
        <p className="text-gray-600">
          ✅ La página se está renderizando correctamente
        </p>
        <p className="text-gray-600 mt-2">
          ✅ No hay errores de JavaScript
        </p>
        <p className="text-gray-600 mt-2">
          ✅ Los hooks están funcionando
        </p>
      </div>
    </div>
  );
}

export default ServicesPageMinimal;