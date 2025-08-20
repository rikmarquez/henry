import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-primary mb-4">
                    Henry Diagnostics
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Sistema de Gestión de Taller Mecánico
                  </p>
                  <div className="mt-8 text-sm text-muted-foreground">
                    🚀 Frontend inicializado correctamente
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-background text-foreground border',
        }}
      />
    </QueryClientProvider>
  );
}

export default App;