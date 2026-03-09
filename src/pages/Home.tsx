import React, { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { Calendar, Clock, Users, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Resource = 'Yoga Room' | 'Rec Center Turf';

interface Booking {
  id: number;
  resource: Resource;
  date: string;
  startTime: string;
  endTime: string;
  userName: string;
  reason: string;
  participants: string;
  status: 'pending' | 'approved' | 'rejected';
}

const RESOURCES: Resource[] = ['Yoga Room', 'Rec Center Turf'];

// Generate slots
const getSlots = (resource: Resource) => {
  const slots = [];
  if (resource === 'Yoga Room') {
    // 7-10 am
    for (let i = 7; i < 10; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
    // 5-10 pm (17-22)
    for (let i = 17; i < 22; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
  } else {
    // 6 am - 12 pm
    for (let i = 6; i < 12; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
    // 4 pm - 10 pm (16-22)
    for (let i = 16; i < 22; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

export default function Home() {
  const [resource, setResource] = useState<Resource>('Yoga Room');
  const [date, setDate] = useState<Date>(startOfToday());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [reason, setReason] = useState('');
  const [participants, setParticipants] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const dates = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    fetchBookings();
  }, [resource, date]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?resource=${encodeURIComponent(resource)}&date=${format(date, 'yyyy-MM-dd')}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !userName || !reason || (resource === 'Rec Center Turf' && !participants)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const startTime = selectedSlot;
    const endHour = parseInt(startTime.split(':')[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          date: format(date, 'yyyy-MM-dd'),
          startTime,
          endTime,
          userName,
          reason,
          participants: resource === 'Rec Center Turf' ? participants : null,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Booking request submitted successfully! Pending admin approval.');
        setSelectedSlot(null);
        setUserName('');
        setReason('');
        setParticipants('');
        fetchBookings();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit booking.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const slots = getSlots(resource);
  const getSlotStatus = (time: string) => {
    const booking = bookings.find(b => b.startTime === time);
    if (!booking) return 'available';
    if (booking.status === 'rejected') return 'available';
    return booking.status; // 'pending' or 'approved'
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-purple-900 tracking-tight sm:text-5xl">
          Reserve Your Space
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Book the Yoga Room or Rec Center Turf for your activities. All bookings require admin approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Selection & Slots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">1</span>
              Select Facility
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {RESOURCES.map(r => (
                <button
                  key={r}
                  onClick={() => { setResource(r); setSelectedSlot(null); setSuccessMsg(''); setErrorMsg(''); }}
                  className={`py-4 px-6 rounded-xl border-2 transition-all duration-200 font-medium text-lg ${
                    resource === r
                      ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">2</span>
              Select Date
            </h2>
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map(d => {
                const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setDate(d); setSelectedSlot(null); setSuccessMsg(''); setErrorMsg(''); }}
                    className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-500 hover:border-orange-300'
                    }`}
                  >
                    <span className="text-sm font-medium uppercase">{format(d, 'EEE')}</span>
                    <span className="text-2xl font-bold">{format(d, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">3</span>
                Select Time
              </div>
              {loading && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map(time => {
                const status = getSlotStatus(time);
                const isSelected = selectedSlot === time;
                
                let btnClass = "py-3 px-2 rounded-lg border text-sm font-medium transition-all flex flex-col items-center justify-center ";
                let disabled = false;

                if (status === 'approved') {
                  btnClass += "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed";
                  disabled = true;
                } else if (status === 'pending') {
                  btnClass += "bg-orange-50 border-orange-200 text-orange-500 cursor-not-allowed";
                  disabled = true;
                } else if (isSelected) {
                  btnClass += "bg-purple-600 border-purple-600 text-white shadow-md ring-2 ring-purple-600 ring-offset-2";
                } else {
                  btnClass += "bg-white border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50";
                }

                return (
                  <button
                    key={time}
                    disabled={disabled}
                    onClick={() => { setSelectedSlot(time); setSuccessMsg(''); setErrorMsg(''); }}
                    className={btnClass}
                  >
                    <span>{time}</span>
                    <span className="text-[10px] uppercase mt-1 opacity-80">
                      {status === 'available' ? 'Available' : status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100 sticky top-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Booking Details</h2>
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start">
                <XCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {!selectedSlot ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Please select a facility, date, and time slot to continue.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 mb-6">
                  <div className="text-sm text-purple-800 font-medium mb-1">{resource}</div>
                  <div className="text-lg font-bold text-purple-900">
                    {format(date, 'MMMM d, yyyy')}
                  </div>
                  <div className="text-purple-700 font-medium">
                    {selectedSlot} - {parseInt(selectedSlot.split(':')[0]) + 1}:00
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      className="pl-10 w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2.5 border"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {resource === 'Yoga Room' ? 'Reason for Booking' : 'Use of Booking'}
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      className="pl-10 w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2.5 border"
                      placeholder="e.g., Morning meditation session"
                      required
                    />
                  </div>
                </div>

                {resource === 'Rec Center Turf' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Participants</label>
                    <textarea
                      value={participants}
                      onChange={e => setParticipants(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2.5 px-3 border"
                      placeholder="List who will be there..."
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Submit Request'
                  )}
                </button>
                <p className="text-xs text-center text-slate-500 mt-3">
                  Your request will be reviewed by an administrator.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
