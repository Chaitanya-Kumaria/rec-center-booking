import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="bg-purple-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-orange-400" />
              <span className="font-bold text-xl tracking-tight">Rec & Yoga Booking</span>
            </Link>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/' ? 'bg-purple-800 text-white' : 'text-purple-100 hover:bg-purple-600'
                }`}
              >
                Book
              </Link>
              <Link
                to="/admin"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/admin' ? 'bg-purple-800 text-white' : 'text-purple-100 hover:bg-purple-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
