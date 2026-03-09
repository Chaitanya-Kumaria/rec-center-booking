import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, X, Clock, Calendar as CalendarIcon, MapPin, Users, FileText, Loader2 } from 'lucide-react';

interface Booking {
  id: number;
  resource: string;
  date: string;
  startTime: string;
  endTime: string;
  userName: string;
  reason: string;
  participants: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">Manage booking requests for all facilities.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No bookings found</h3>
          <p className="mt-1 text-slate-500">There are no {filter !== 'all' ? filter : ''} booking requests at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className={`p-4 border-b ${
                booking.status === 'pending' ? 'bg-orange-50 border-orange-100' :
                booking.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                      booking.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {booking.status}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{booking.userName}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{format(parseISO(booking.date), 'MMM d, yyyy')}</div>
                    <div className="text-sm text-slate-500">{booking.startTime} - {booking.endTime}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Facility</p>
                    <p className="text-sm text-slate-600">{booking.resource}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Reason</p>
                    <p className="text-sm text-slate-600">{booking.reason}</p>
                  </div>
                </div>

                {booking.participants && (
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Participants</p>
                      <p className="text-sm text-slate-600">{booking.participants}</p>
                    </div>
                  </div>
                )}
              </div>

              {booking.status === 'pending' && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'approved')}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
