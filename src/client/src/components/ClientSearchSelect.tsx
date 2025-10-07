import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, User, Phone, Loader2 } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
}

interface ClientSearchSelectProps {
  selectedClientId?: number;
  onClientSelect: (clientId: number) => void;
  clients: Client[];
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ClientSearchSelect({
  selectedClientId,
  onClientSelect,
  clients,
  isLoading = false,
  error,
  disabled = false,
  placeholder = 'Buscar cliente por nombre, teléfono o email...',
  className = '',
}: ClientSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Encontrar el cliente seleccionado
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClients = searchTerm
    ? clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.whatsapp && client.whatsapp.includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : clients;

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (clientId: number) => {
    onClientSelect(clientId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClientSelect(0);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg text-left transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white hover:border-blue-500 cursor-pointer'
        } ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-gray-500">Cargando clientes...</span>
            </>
          ) : selectedClient ? (
            <>
              <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 block truncate">
                  {selectedClient.name}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {selectedClient.phone}
                </span>
              </div>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{placeholder}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {selectedClient && !disabled && (
            <div
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} disponible{clients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? (
                  <>
                    <p>No se encontraron clientes</p>
                    <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                  </>
                ) : (
                  <p>No hay clientes disponibles</p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                      client.id === selectedClientId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      client.id === selectedClientId ? 'bg-blue-200' : 'bg-blue-100'
                    }`}>
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        client.id === selectedClientId ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {client.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </span>
                        {client.whatsapp && client.whatsapp !== client.phone && (
                          <span>• WhatsApp: {client.whatsapp}</span>
                        )}
                        {client.email && (
                          <span className="truncate">• {client.email}</span>
                        )}
                      </div>
                    </div>
                    {client.id === selectedClientId && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
