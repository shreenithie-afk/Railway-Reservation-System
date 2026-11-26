import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import {
  Booking,
  CancellationSummary,
  Ticket
} from '../engine/railwayEngine';

interface PnrCancelViewProps {
  initialPnr: string;
  allBookings: Booking[];
  onLookupPnr: (pnr: string) => Booking;
  onCancelFull: (pnr: string) => CancellationSummary;
  onCancelTickets: (pnr: string, ticketIds: string[]) => CancellationSummary;
  onEstimateRefund: (booking: Booking, ticket: Ticket) => number;
}

export function PnrCancelView({
  initialPnr,
  allBookings,
  onLookupPnr,
  onCancelFull,
  onCancelTickets,
  onEstimateRefund
}: PnrCancelViewProps) {
  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [loadedBooking, setLoadedBooking] = useState<Booking | null>(() => {
    if (!initialPnr) return allBookings[0] ?? null;
    try {
      return onLookupPnr(initialPnr);
    } catch {
      return null;
    }
  });
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<CancellationSummary | null>(null);

  useEffect(() => {
    if (initialPnr) {
      setPnrInput(initialPnr);
      try {
        const b = onLookupPnr(initialPnr);
        setLoadedBooking(b);
        setSelectedTicketIds([]);
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'PNR not found.');
      }
    }
  }, [initialPnr, onLookupPnr]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCancelResult(null);
    try {
      const b = onLookupPnr(pnrInput);
      setLoadedBooking(b);
      setSelectedTicketIds([]);
    } catch (err) {
      setLoadedBooking(null);
      setErrorMsg(err instanceof Error ? err.message : 'PNR not found.');
    }
  };

  const handleQuickSelect = (pnr: string) => {
    setPnrInput(pnr);
    setErrorMsg(null);
    setCancelResult(null);
    try {
      const b = onLookupPnr(pnr);
      setLoadedBooking(b);
      setSelectedTicketIds([]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'PNR not found.');
    }
  };

  const toggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleCancelSelected = () => {
    if (!loadedBooking) return;
    setErrorMsg(null);
    setCancelResult(null);
    try {
      const result = onCancelTickets(loadedBooking.pnr, selectedTicketIds);
      setCancelResult(result);
      setLoadedBooking(onLookupPnr(loadedBooking.pnr));
      setSelectedTicketIds([]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cancellation failed.');
    }
  };

  const handleCancelAll = () => {
    if (!loadedBooking) return;
    setErrorMsg(null);
    setCancelResult(null);
    try {
      const result = onCancelFull(loadedBooking.pnr);
      setCancelResult(result);
      setLoadedBooking(onLookupPnr(loadedBooking.pnr));
      setSelectedTicketIds([]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cancellation failed.');
    }
  };

  const activeTickets = loadedBooking
    ? loadedBooking.tickets.filter((t) => t.status !== 'CANCELLED')
    : [];

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          PNR Status &amp; Ticket Cancellation
        </h1>
        <p className="text-sm text-indigo-100 mt-1">
          Check live PNR status, cancel individual passengers or entire bookings, and observe automatic FIFO RAC/WL promotions.
        </p>
      </div>

      {/* Search Bar & Recent PNRs */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              placeholder="Enter PNR (e.g. PNR100001)"
              aria-label="PNR Number"
              className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Lookup PNR
          </button>
        </form>

        {allBookings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Recent PNRs:</span>
            {allBookings.slice(0, 6).map((b) => (
              <button
                key={b.pnr}
                type="button"
                onClick={() => handleQuickSelect(b.pnr)}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold transition-colors cursor-pointer ${
                  loadedBooking?.pnr === b.pnr
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                {b.pnr}
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cancelResult && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900">
              Cancellation Processed for <span className="font-mono text-emerald-800">{cancelResult.pnr}</span> · Total Refund: Rs. {cancelResult.totalRefund.toFixed(2)}
            </h3>
          </div>
          {cancelResult.promotionLogs.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/80 space-y-1">
              <div className="text-xs font-semibold text-slate-700">Automatic FIFO Promotions Triggered:</div>
              {cancelResult.promotionLogs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-emerald-800">
                  → {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loaded PNR Details */}
      {loadedBooking && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-5 bg-indigo-50/60 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="font-mono text-indigo-700">{loadedBooking.pnr}</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>{loadedBooking.trainId} ({loadedBooking.trainName})</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                Class {loadedBooking.classCode} · User: {loadedBooking.userId} · Total Fare: Rs. {loadedBooking.totalFare.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelSelected}
                disabled={selectedTicketIds.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 hover:bg-amber-200 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel Selected ({selectedTicketIds.length})
              </button>
              <button
                type="button"
                onClick={handleCancelAll}
                disabled={activeTickets.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel Entire PNR
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 w-10">Select</th>
                  <th className="py-3 px-4 font-semibold">Ticket ID</th>
                  <th className="py-3 px-4 font-semibold">Passenger</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Allocation</th>
                  <th className="py-3 px-4 font-semibold text-right">Fare / Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {loadedBooking.tickets.map((t) => {
                  const isCancelled = t.status === 'CANCELLED';
                  const estRefund = isCancelled ? t.refundAmount : onEstimateRefund(loadedBooking, t);
                  const statusColor =
                    t.status === 'CONFIRMED'
                      ? 'text-emerald-700'
                      : t.status === 'RAC'
                        ? 'text-amber-700'
                        : t.status === 'WAITING'
                          ? 'text-orange-700'
                          : 'text-rose-700';

                  return (
                    <tr key={t.ticketId} className="hover:bg-indigo-50/30">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          disabled={isCancelled}
                          checked={selectedTicketIds.includes(t.ticketId)}
                          onChange={() => toggleTicket(t.ticketId)}
                          aria-label={`Select ticket ${t.ticketId}`}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-800">
                        {t.ticketId}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {t.passenger.name} ({t.passenger.age}/{t.passenger.gender.charAt(0)})
                      </td>
                      <td className={`py-3 px-4 font-bold ${statusColor}`}>
                        {t.status}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {t.status === 'CONFIRMED'
                          ? t.seatLabel
                          : t.status === 'RAC'
                            ? `RAC-${t.queuePosition}`
                            : t.status === 'WAITING'
                              ? `WL-${t.queuePosition}`
                              : 'Released'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {isCancelled
                          ? `Refunded Rs. ${t.refundAmount.toFixed(2)}`
                          : `Rs. ${t.fare.toFixed(2)} (Est. Refund: Rs. ${estRefund.toFixed(2)})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
