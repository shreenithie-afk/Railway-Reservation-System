import { useCallback, useRef, useState } from 'react';
import { Download, TrainFront } from 'lucide-react';
import {
  Booking,
  ClassCode,
  PassengerInput,
  RailwayEngine,
  Ticket
} from './engine/railwayEngine';
import { BookingView } from './components/BookingView';
import { PnrCancelView } from './components/PnrCancelView';
import { TrainChartView } from './components/TrainChartView';
import { HistoryView } from './components/HistoryView';
import { JavaCodeView } from './components/JavaCodeView';
import { generateJavaCodePdf } from './utils/pdfExport';

type AppTab = 'book' | 'pnr' | 'chart' | 'history' | 'java';

const NAV_TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'book', label: 'Book Tickets' },
  { id: 'pnr', label: 'PNR & Cancel' },
  { id: 'chart', label: 'Train Chart' },
  { id: 'history', label: 'History' },
  { id: 'java', label: 'Java & PDF' }
];

export default function App() {
  const engineRef = useRef<RailwayEngine>(new RailwayEngine(true));
  const [, setVersion] = useState(0);

  const [activeTab, setActiveTab] = useState<AppTab>('book');
  const [selectedTrainId, setSelectedTrainId] = useState('12951');
  const [selectedClass, setSelectedClass] = useState<ClassCode>('3A');
  const [activePnr, setActivePnr] = useState('PNR100001');
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  const engine = engineRef.current;
  const trains = engine.getAllTrains();

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const handleSelectTrain = (trainId: string) => {
    setSelectedTrainId(trainId);
    const train = engine.getTrain(trainId);
    if (!train.classes[selectedClass]) {
      const firstClass = Object.keys(train.classes)[0] as ClassCode;
      setSelectedClass(firstClass);
    }
  };

  const handleBook = (userId: string, passengers: PassengerInput[]): Booking => {
    const booking = engine.bookTickets(userId, selectedTrainId, selectedClass, passengers);
    setActivePnr(booking.pnr);
    refresh();
    return booking;
  };

  const handleLookupPnr = useCallback(
    (pnr: string) => engine.getBookingByPnr(pnr),
    [engine]
  );

  const handleCancelFull = (pnr: string) => {
    const result = engine.cancelFullPnr(pnr);
    refresh();
    return result;
  };

  const handleCancelTickets = (pnr: string, ticketIds: string[]) => {
    const result = engine.cancelTickets(pnr, ticketIds);
    refresh();
    return result;
  };

  const handleEstimateRefund = (booking: Booking, ticket: Ticket) => {
    const train = engine.getTrain(booking.trainId);
    return engine.computeRefund(ticket, train, new Date());
  };

  const handleNavigateToPnr = (pnr: string) => {
    setActivePnr(pnr);
    setActiveTab('pnr');
  };

  const handleDownloadPdf = () => {
    const pages = generateJavaCodePdf({ includeDocs: true });
    setPdfMessage(`Downloaded PDF (${pages} pages)`);
    window.setTimeout(() => setPdfMessage(null), 4000);
  };

  const availability = engine.getAvailability(selectedTrainId, selectedClass);
  const trainClass = engine.getTrainClass(selectedTrainId, selectedClass);
  const allBookings = engine.getAllBookings();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50/50 via-sky-50/30 to-slate-50 text-slate-900">
      {/* 3-Zone Top Bar */}
      <header className="h-16 bg-indigo-950 text-white px-6 flex items-center justify-between gap-8 shadow-sm shrink-0">
        <a
          href="#book"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('book');
          }}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <TrainFront className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>RailReserve</span>
        </a>

        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Primary navigation">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'text-indigo-200 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {pdfMessage && (
            <span className="hidden lg:inline text-xs font-medium text-emerald-300 whitespace-nowrap">
              {pdfMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Java PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'book' && (
          <BookingView
            trains={trains}
            selectedTrainId={selectedTrainId}
            selectedClass={selectedClass}
            onSelectTrain={handleSelectTrain}
            onSelectClass={setSelectedClass}
            availability={availability}
            trainClass={trainClass}
            onBook={handleBook}
            onNavigateToPnr={handleNavigateToPnr}
          />
        )}

        {activeTab === 'pnr' && (
          <PnrCancelView
            initialPnr={activePnr}
            allBookings={allBookings}
            onLookupPnr={handleLookupPnr}
            onCancelFull={handleCancelFull}
            onCancelTickets={handleCancelTickets}
            onEstimateRefund={handleEstimateRefund}
          />
        )}

        {activeTab === 'chart' && (
          <TrainChartView
            trains={trains}
            getTicketsForClass={(trainId, classCode) =>
              engine.getTicketsForTrainClass(trainId, classCode)
            }
            onRunStressTest={() => engine.runStressTestSimulation()}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            allBookings={allBookings}
            getUserBookings={(uid) => engine.getUserBookings(uid)}
            onManagePnr={handleNavigateToPnr}
          />
        )}

        {activeTab === 'java' && <JavaCodeView />}
      </div>
    </div>
  );
}
