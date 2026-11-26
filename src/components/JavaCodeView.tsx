import { useMemo, useState } from 'react';
import { Check, Copy, FileCode2, FileText, Search } from 'lucide-react';
import {
  ARCHITECTURE_OVERVIEW,
  CLASS_DIAGRAM_ASCII,
  COMPILE_RUN_INSTRUCTIONS,
  CONCURRENCY_NOTE,
  JAVA_SOURCE_FILES,
  JavaSourceFile,
  SAMPLE_OUTPUT
} from '../data/railwaySourceData';

type CodeViewSelection =
  | { kind: 'docs' }
  | { kind: 'file'; file: JavaSourceFile };

const PACKAGE_ORDER: Array<{ key: JavaSourceFile['pkg']; label: string }> = [
  { key: 'root', label: 'Entry Point' },
  { key: 'model', label: 'com.railway.model' },
  { key: 'service', label: 'com.railway.service' },
  { key: 'exception', label: 'com.railway.exception' },
  { key: 'util', label: 'com.railway.util' }
];

export function JavaCodeView() {
  const [selection, setSelection] = useState<CodeViewSelection>({ kind: 'docs' });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return JAVA_SOURCE_FILES;
    return JAVA_SOURCE_FILES.filter(
      (f) =>
        f.fileName.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      <aside className="w-full lg:w-76 border-b lg:border-b-0 lg:border-r border-indigo-100 bg-indigo-50/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-indigo-100">
          <div className="relative">
            <Search
              className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter Java files..."
              aria-label="Filter Java source files"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <nav className="p-3 overflow-y-auto flex-1 space-y-5" aria-label="Java Source Files">
          <div>
            <div className="px-2 mb-1.5 text-xs font-semibold text-indigo-700">Documentation</div>
            <button
              type="button"
              onClick={() => setSelection({ kind: 'docs' })}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                selection.kind === 'docs'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-700 hover:bg-indigo-100/70'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Architecture &amp; Run Guide</span>
            </button>
          </div>

          {PACKAGE_ORDER.map(({ key, label }) => {
            const files = filteredFiles.filter((f) => f.pkg === key);
            if (!files.length) return null;
            return (
              <div key={key}>
                <div className="px-2 mb-1.5 flex items-center justify-between text-xs font-semibold text-indigo-700">
                  <span className="truncate">{label}</span>
                  <span className="tabular-nums font-normal text-indigo-400">{files.length}</span>
                </div>
                <div className="space-y-0.5">
                  {files.map((file) => {
                    const active = selection.kind === 'file' && selection.file.id === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setSelection({ kind: 'file', file })}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-700 hover:bg-indigo-100/70'
                        }`}
                      >
                        <FileCode2 className="w-4 h-4 shrink-0 opacity-75" aria-hidden="true" />
                        <span className="truncate font-mono text-xs">{file.fileName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 bg-white overflow-y-auto">
        {selection.kind === 'docs' ? (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-950">Architecture Overview</h2>
              <pre className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                {ARCHITECTURE_OVERVIEW}
              </pre>
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-950">Class Diagram</h2>
              <div className="overflow-x-auto rounded-lg border border-sky-200 bg-sky-50/40 p-4">
                <pre className="text-xs leading-snug text-slate-800 font-mono">
                  {CLASS_DIAGRAM_ASCII}
                </pre>
              </div>
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-950">Compile &amp; Run</h2>
              <pre className="p-4 rounded-lg border border-teal-200 bg-teal-50/40 text-xs leading-relaxed text-slate-800 font-mono overflow-x-auto">
                {COMPILE_RUN_INSTRUCTIONS}
              </pre>
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-950">Sample Console Output</h2>
              <pre className="p-4 rounded-lg border border-slate-800 bg-slate-900 text-xs leading-relaxed text-emerald-300 font-mono overflow-x-auto">
                {SAMPLE_OUTPUT}
              </pre>
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-indigo-950">Double Booking Prevention</h2>
              <pre className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                {CONCURRENCY_NOTE}
              </pre>
            </section>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="min-w-0">
                <div className="font-mono text-sm font-bold text-indigo-800 truncate">
                  {selection.file.filePath}
                </div>
                <p className="mt-1 text-xs text-slate-500">{selection.file.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(selection.file.id, selection.file.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === selection.file.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono leading-relaxed text-slate-100 overflow-x-auto">
              {selection.file.code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
