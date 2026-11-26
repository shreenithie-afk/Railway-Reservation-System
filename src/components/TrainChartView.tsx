import { useState } from 'react';
import { Play } from 'lucide-react';
import {
  ClassCode,
  StressTestReport,
  Ticket,
  Train,
  TrainClass
} from '../engine/railwayEngine';

interface TrainChartViewProps {
  trains: Train[];
  getTicketsForClass: (trainId: string, classCode: ClassCode) => Ticket[];
  onRunStressTest: () => StressTestReport;
}

const CLASS_HEADER_ACCENTS: Record<ClassCode, string> = {
  SL: 'bg-teal-50 border-teal-200 text-teal-950',
  '3A': 'bg-blue-50 border-blue-200 text-blue-950',
  '2A': 'bg-indigo-50 border-indigo-200 text-indigo-950',
  '1A': 'bg-amber-50 border-amber-200 text-amber-950'
};

export function TrainChartView({
  trains,
  getTicketsForClass,
  onRunStressTest
}: TrainChartViewProps) {
  const [selectedTrainId, setSelectedTrainId] = useState(trains[0]?.trainId ?? '12951');
  const [stressReport, setStressReport] = useState<StressTestReport | null>(null);

  const train = trains.find((t) => t.trainId === selectedTrainId) ?? trains[0];
  const classEntries = Object.entries(train.classes) as Array<[ClassCode, TrainClass]>;

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 text-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Train Reservation Chart &amp; Stress Test
          </h1>
          <p className="text-sm text-cyan-100 mt-1">
            Inspect passenger allocations across Confirmed, RAC, Waiting List, and Cancelled states.
          </p>
        </div>

        <select
          value={selectedTrainId}
          onChange={(e) => setSelectedTrainId(e.target.value)}
          aria-label="Select train for reservation chart"
          className="px-3.5 py-2 text-sm bg-white text-slate-900 border border-white/20 rounded-lg focus:outline-none font-medium"
        >
          {trains.map((t) => (
            <option key={t.trainId} value={t.trainId}>
              {t.trainId} — {t.name} ({t.source} → {t.destination})
            </option>
          ))}
        </select>
      </div>

      {/* Class Charts */}
      <div className="space-y-5">
        {classEntries.map(([code, tc]) => {
          const tickets = getTicketsForClass(train.trainId, code);
          const confirmed = tickets.filter((t) => t.status === 'CONFIRMED');
          const rac = tc.racQueue;
          const wl = tc.waitingQueue;
          const cancelled = tickets.filter((t) => t.status === 'CANCELLED');

          return (
            <section key={code} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2 ${CLASS_HEADER_ACCENTS[code]}`}>
                <div className="font-bold text-sm">
                  Class {code} · {tc.displayName}
                </div>
                <div className="text-xs font-medium tabular-nums">
                  Confirmed: {confirmed.length}/{tc.seatCapacity} · RAC: {rac.length}/{tc.racLimit} · WL: {wl.length}/{tc.wlLimit} · Cancelled: {cancelled.length}
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="p-5 text-xs text-slate-500">
                  No reservations recorded in {code} yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-600 bg-slate-50">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">PNR</th>
                        <th className="py-2.5 px-4 font-semibold">Ticket ID</th>
                        <th className="py-2.5 px-4 font-semibold">Passenger</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Seat / Queue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {tickets.map((t) => (
                        <tr key={t.ticketId} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-mono text-indigo-700 font-semibold">{t.pnr}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{t.ticketId}</td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {t.passenger.name} ({t.passenger.age}/{t.passenger.gender.charAt(0)})
                          </td>
                          <td
                            className={`py-2.5 px-4 font-bold ${
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
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-700">
                            {t.status === 'CONFIRMED'
                              ? t.seatLabel
                              : t.status === 'RAC'
                                ? `RAC-${t.queuePosition}`
                                : t.status === 'WAITING'
                                  ? `WL-${t.queuePosition}`
                                  : `Refund Rs. ${t.refundAmount.toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Stress Test Runner */}
      <section className="rounded-xl border border-indigo-200 bg-white p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Concurrency &amp; Invariant Stress Test Simulation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulates 60 workers racing for the last 5 seats plus mixed bookings/cancellations to verify uniqueness and FIFO invariants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStressReport(onRunStressTest())}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Run Stress Test</span>
          </button>
        </div>

        {stressReport && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900">
                Phase 1: 60 Workers Racing for Last 5 Seats —{' '}
                <span className={stressReport.racePassed ? 'text-emerald-700' : 'text-rose-700'}>
                  {stressReport.racePassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="text-slate-600 tabular-nums">
                Confirmed: {stressReport.raceConfirmed} · Unique Seats: {stressReport.raceUniqueSeats} · Rejected: {stressReport.raceRejected}
              </div>
              <div className="pt-2 space-y-1 font-mono text-emerald-950">
                {stressReport.raceAssignments.map((a) => (
                  <div key={a.ticketId}>
                    {a.worker} → {a.pnr} | {a.ticketId} | {a.seatLabel}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs tabular-nums">
              <div className="font-bold text-slate-900">
                Phase 2: Mixed Bookings &amp; Cancellations —{' '}
                <span className={stressReport.mixedInvariantsPassed ? 'text-emerald-700' : 'text-rose-700'}>
                  {stressReport.mixedInvariantsPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="text-slate-600">
                Bookings Succeeded: {stressReport.mixedBookingsOk} · Cancellations Succeeded: {stressReport.mixedCancelsOk}
              </div>
              <ul className="pt-2 space-y-1 text-indigo-950 font-mono">
                <li>
                  confirmed ({stressReport.mixedConfirmed}) &lt;= capacity ({stressReport.mixedCapacity}): PASS
                </li>
                <li>
                  duplicate seat numbers: {String(stressReport.mixedDuplicateSeats)}
                </li>
                <li>
                  RAC FIFO valid ({stressReport.mixedRacCount}/{stressReport.mixedRacLimit}): {String(stressReport.mixedRacFifoValid)}
                </li>
                <li>
                  WL FIFO valid ({stressReport.mixedWlCount}/{stressReport.mixedWlLimit}): {String(stressReport.mixedWlFifoValid)}
                </li>
                <li>
                  Cancelled tickets processed: {stressReport.mixedCancelledCount}
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
