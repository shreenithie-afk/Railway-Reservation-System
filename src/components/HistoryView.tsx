import { useState } from 'react';
import { Search } from 'lucide-react';
import { Booking } from '../engine/railwayEngine';

interface HistoryViewProps {
  allBookings: Booking[];
  getUserBookings: (userId: string) => Booking[];
  onManagePnr: (pnr: string) => void;
}

export function HistoryView({
  allBookings,
  getUserBookings,
  onManagePnr
}: HistoryViewProps) {
  const [userId, setUserId] = useState('alice');
  const bookings = userId.trim() ? getUserBookings(userId) : allBookings;

  const knownUsers = Array.from(new Set(allBookings.map((b) => b.userId)));

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          User Booking History
        </h1>
        <p className="text-sm text-blue-100 mt-1">
          Filter reservation history by User ID or inspect all active and cancelled PNRs.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Filter by User ID (leave empty for all users)"
              aria-label="Filter booking history by User ID"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setUserId('')}
            className="px-4 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            Show All Users
          </button>
        </div>

        {knownUsers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Users:</span>
            {knownUsers.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUserId(u)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  userId.toLowerCase() === u.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No bookings found for user &ldquo;{userId}&rdquo;.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.pnr} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    <span className="font-mono text-indigo-700">{b.pnr}</span> · {b.trainId} ({b.trainName})
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    User: {b.userId} · Class: {b.classCode} · Fare: Rs. {b.totalFare.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onManagePnr(b.pnr)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg self-start whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open in PNR &amp; Cancel
                </button>
              </div>

              <div className="space-y-1.5 text-xs tabular-nums">
                {b.tickets.map((t) => (
                  <div key={t.ticketId} className="flex flex-wrap items-center justify-between gap-2 text-slate-700">
                    <span>
                      <span className="font-mono font-semibold text-slate-900">{t.ticketId}</span> · {t.passenger.name} ({t.passenger.age}/{t.passenger.gender.charAt(0)})
                    </span>
                    <span
                      className={`font-mono font-semibold ${
                        t.status === 'CONFIRMED'
                          ? 'text-emerald-700'
                          : t.status === 'RAC'
                            ? 'text-amber-700'
                            : t.status === 'WAITING'
                              ? 'text-orange-700'
                              : 'text-rose-700'
                      }`}
                    >
                      {t.status}
                      {t.status === 'CONFIRMED' && t.seatLabel ? ` · ${t.seatLabel}` : ''}
                      {t.status === 'RAC' ? ` · RAC-${t.queuePosition}` : ''}
                      {t.status === 'WAITING' ? ` · WL-${t.queuePosition}` : ''}
                      {t.status === 'CANCELLED' ? ` · Refund Rs. ${t.refundAmount.toFixed(2)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
