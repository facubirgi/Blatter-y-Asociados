import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Datos de ejemplo para las operaciones
  const operaciones = [
    {
      id: 1,
      cliente: 'Juan Pérez',
      tipo: 'Venta',
      monto: 1500.00,
      estado: 'Pendiente',
      fecha: '2025-10-20'
    },
    {
      id: 2,
      cliente: 'María García',
      tipo: 'Servicio',
      monto: 2300.00,
      estado: 'Parcial',
      fecha: '2025-10-18'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-full flex flex-col">
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">{user?.nombre || 'utn'}</h3>
              <p className="text-sm text-gray-600">{user?.nombre}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finanzas
            </Link>

            <Link
              to="/clientes"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive('/clientes')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Clientes
            </Link>

            <Link
              to="/perfil"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive('/perfil')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil de Usuario
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500 mb-1">Desarrollado por</p>
            <p className="text-sm text-center font-medium text-gray-700">Facundo Birgi</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-normal text-gray-900">{user?.nombre || 'utn'}</h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Title and Action */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finanzas
            </h2>
            <button className="inline-flex items-center px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Operación
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Operaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Operaciones</p>
                  <p className="text-3xl font-semibold text-gray-900">$3800.00</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                  <p className="text-3xl font-semibold text-orange-600">$1500.00</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Parciales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parciales</p>
                  <p className="text-3xl font-semibold text-blue-600">$2300.00</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Operations List */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Operaciones de Clientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {operaciones.map((op) => (
                <div key={op.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {/* Cliente */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="text-base font-semibold text-gray-900">{op.cliente}</p>
                    </div>
                  </div>

                  {/* Tipo de Operación */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Tipo de Operación</p>
                    <p className="text-sm text-gray-900">{op.tipo}</p>
                  </div>

                  {/* Monto */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Monto</p>
                    <p className="text-xl font-semibold text-gray-900">${op.monto.toFixed(2)}</p>
                  </div>

                  {/* Estado */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                      op.estado === 'Pendiente'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {op.estado}
                    </span>
                  </div>

                  {/* Fecha */}
                  <div>
                    <p className="text-xs text-gray-500">Fecha: {op.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
