import { useState } from 'react';
import { Plus, Trash2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  AvailabilitySummary,
  BerthType,
  Booking,
  ClassCode,
  Gender,
  PassengerInput,
  Train,
  TrainClass
} from '../engine/railwayEngine';

interface BookingViewProps {
  trains: Train[];
  selectedTrainId: string;
  selectedClass: ClassCode;
  onSelectTrain: (trainId: string) => void;
  onSelectClass: (classCode: ClassCode) => void;
  availability: AvailabilitySummary;
  trainClass: TrainClass;
  onBook: (userId: string, passengers: PassengerInput[]) => Booking;
  onNavigateToPnr: (pnr: string) => void;
}

const CLASS_TAB_STYLES: Record<ClassCode, string> = {
  SL: 'bg-teal-600 text-white shadow-xs',
  '3A': 'bg-blue-600 text-white shadow-xs',
  '2A': 'bg-indigo-600 text-white shadow-xs',
  '1A': 'bg-amber-600 text-white shadow-xs'
};

function emptyPassenger(): PassengerInput {
  return {
    name: '',
    age: 30,
    gender: 'MALE',
    berthPreference: null
  };
}

export function BookingView({
  trains,
  selectedTrainId,
  selectedClass,
  onSelectTrain,
  onSelectClass,
  availability,
  trainClass,
  onBook,
  onNavigateToPnr
}: BookingViewProps) {
  const [userId, setUserId] = useState('alice');
  const [passengers, setPassengers] = useState<PassengerInput[]>([emptyPassenger()]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const selectedTrain = trains.find((t) => t.trainId === selectedTrainId) ?? trains[0];
  const availableClassCodes = Object.keys(selectedTrain.classes) as ClassCode[];

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      setErrorMsg('Maximum 6 passengers allowed per PNR booking.');
      return;
    }
    setErrorMsg(null);
    setPassengers((prev) => [...prev, emptyPassenger()]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const updatePassenger = <K extends keyof PassengerInput>(
    index: number,
    key: K,
    value: PassengerInput[K]
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConfirmedBooking(null);
    try {
      const booking = onBook(userId, passengers);
      setConfirmedBooking(booking);
      setPassengers([emptyPassenger()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete booking.');
    }
  };

  const formatDeparture = (date: Date) =>
    date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getSeatCardStyle = (booked: boolean, berth: BerthType) => {
    if (booked) {
      return 'bg-slate-100 border-slate-200 text-slate-500';
    }
    switch (berth) {
      case 'LOWER':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950';
      case 'MIDDLE':
        return 'bg-sky-50 border-sky-300 text-sky-950';
      case 'UPPER':
        return 'bg-indigo-50 border-indigo-300 text-indigo-950';
      case 'SIDE':
        return 'bg-teal-50 border-teal-300 text-teal-950';
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
      {/* Vibrant Banner Header */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Train Selection &amp; Ticket Booking
        </h1>
        <p className="text-sm text-indigo-100 mt-1">
          Choose your train and coach class to inspect live berth availability, priority lower-berth rules, and reserve tickets.
        </p>
      </section>

      {/* Train Selection Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {trains.map((train) => {
          const isSelected = train.trainId === selectedTrainId;
          const departed = Date.now() >= train.departureTime.getTime();
          const classes = Object.keys(train.classes) as ClassCode[];
          return (
            <button
              key={train.trainId}
              type="button"
              onClick={() => {
                onSelectTrain(train.trainId);
                setErrorMsg(null);
              }}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                  : departed
                    ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-sky-50/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                <span className="font-mono font-bold text-indigo-700">{train.trainId}</span>
                <span className={departed ? 'text-rose-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {departed ? 'Departed' : 'Scheduled'}
                </span>
              </div>
              <div className="mt-1.5 font-semibold text-sm text-slate-900 truncate">
                {train.name}
              </div>
              <div className="mt-1 text-xs text-slate-600 truncate">
                {train.source} → {train.destination}
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>{formatDeparture(train.departureTime)}</span>
                <span className="font-mono font-medium text-indigo-700">{classes.join(' / ')}</span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Class Selector & Live Availability Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              {selectedTrain.trainId} · {selectedTrain.name}
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {selectedTrain.source} to {selectedTrain.destination} · Departure {formatDeparture(selectedTrain.departureTime)}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {availableClassCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onSelectClass(code);
                  setErrorMsg(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedClass === code
                    ? CLASS_TAB_STYLES[code]
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* 4-column Color-Coded Availability Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-medium text-emerald-800">Confirmed Berths Free</div>
            <div className="mt-1 text-xl font-bold text-emerald-900 tabular-nums">
              {availability.availableConfirmed}
              <span className="text-sm font-normal text-emerald-700/70"> / {availability.seatCapacity}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-xs font-medium text-amber-800">RAC Slots Available</div>
            <div className="mt-1 text-xl font-bold text-amber-900 tabular-nums">
              {availability.availableRac}
              <span className="text-sm font-normal text-amber-700/70"> / {availability.racLimit}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-xs font-medium text-orange-800">Waiting List Slots Free</div>
            <div className="mt-1 text-xl font-bold text-orange-900 tabular-nums">
              {availability.availableWaiting}
              <span className="text-sm font-normal text-orange-700/70"> / {availability.wlLimit}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="text-xs font-medium text-indigo-800">Base Fare ({availability.displayName})</div>
            <div className="mt-1 text-xl font-bold text-indigo-900 tabular-nums">
              Rs. {availability.fare.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Color-Coded Coach Seat Map */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Live Coach Seat Layout</span>
            <span className="text-indigo-700 font-medium">
              Seniors (60+) &amp; solo women receive LOWER berth priority
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {trainClass.seats.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`p-2.5 rounded-lg border text-xs tabular-nums ${getSeatCardStyle(
                  seat.booked,
                  seat.berthType
                )}`}
              >
                <div className="flex items-center justify-between font-mono font-bold">
                  <span>{seat.coach}-{seat.seatNumber}</span>
                  <span className={seat.booked ? 'text-slate-500 font-medium' : 'text-emerald-700'}>
                    {seat.booked ? 'Booked' : 'Open'}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] opacity-80">
                  {seat.berthType}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passenger Details & Booking Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Passenger Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Book 1 to 6 passengers per PNR. Status automatically flows Confirmed → RAC → Waiting List.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-indigo-900" htmlFor="booking-user-id">
              User ID
            </label>
            <input
              id="booking-user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. alice"
              className="w-36 px-3 py-1.5 text-sm border border-indigo-200 bg-indigo-50/40 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {passengers.map((p, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-sky-50/50 border border-sky-200/80"
            >
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Passenger {index + 1} Name
                </label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={Number.isNaN(p.age) ? '' : p.age}
                  onChange={(e) =>
                    updatePassenger(index, 'age', e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={p.gender}
                  onChange={(e) => updatePassenger(index, 'gender', e.target.value as Gender)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Berth Preference
                </label>
                <select
                  value={p.berthPreference ?? 'NONE'}
                  onChange={(e) =>
                    updatePassenger(
                      index,
                      'berthPreference',
                      e.target.value === 'NONE' ? null : (e.target.value as BerthType)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="NONE">No Preference</option>
                  <option value="LOWER">Lower</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="UPPER">Upper</option>
                  <option value="SIDE">Side</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemovePassenger(index)}
                  disabled={passengers.length <= 1}
                  aria-label={`Remove passenger ${index + 1}`}
                  className="p-2 text-slate-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleAddPassenger}
            disabled={passengers.length >= 6}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 rounded-lg transition-colors self-start whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Passenger ({passengers.length}/6)</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500">Total Fare</div>
              <div className="text-lg font-bold text-indigo-700 tabular-nums">
                Rs. {(availability.fare * passengers.length).toFixed(2)}
              </div>
            </div>
            <button
              type="submit"
              disabled={availability.departed}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{availability.departed ? 'Train Departed' : 'Confirm Booking'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {/* Booking Confirmation Receipt */}
      {confirmedBooking && (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Booking Confirmed · PNR <span className="font-mono text-emerald-800">{confirmedBooking.pnr}</span>
                </h3>
                <p className="text-xs text-slate-600 tabular-nums">
                  Train {confirmedBooking.trainId} ({confirmedBooking.classCode}) · User {confirmedBooking.userId} · Total Paid Rs. {confirmedBooking.totalFare.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToPnr(confirmedBooking.pnr)}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-800 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage / Cancel PNR
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-emerald-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-600 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Ticket ID</th>
                  <th className="py-2.5 px-3 font-semibold">Passenger</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Seat / Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {confirmedBooking.tickets.map((t) => (
                  <tr key={t.ticketId}>
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-800">{t.ticketId}</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {t.passenger.name} ({t.passenger.age}/{t.passenger.gender.charAt(0)})
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        t.status === 'CONFIRMED'
                          ? 'text-emerald-700'
                          : t.status === 'RAC'
                            ? 'text-amber-700'
                            : 'text-orange-700'
                      }`}
                    >
                      {t.status}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {t.status === 'CONFIRMED'
                        ? t.seatLabel
                        : t.status === 'RAC'
                          ? `RAC-${t.queuePosition}`
                          : `WL-${t.queuePosition}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
