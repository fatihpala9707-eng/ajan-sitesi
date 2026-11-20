import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Globe,
  Loader2,
  Play,
  Terminal,
  XCircle,
} from 'lucide-react';
import { AJAN_PYTHON_CODE, AJAN_V8_PYTHON_CODE } from '../data/presets';
import type {
  AgentId,
  AgentLogEntry,
  AgentRunStatus,
  CourseAgentProgress,
  CourseTaskSolution,
  CrawledPageItem,
  DebugScreenshotItem,
  DryRunTaskItem,
  IdentityReport,
  SelfTestResult,
  SiteSectionItem,
  UncertainTaskItem,
} from '../types/agent';

export type CourseTabId = 'solutions' | 'pages' | 'logs' | 'debug' | 'code';

interface CourseAgentWorkspaceProps {
  agentType: AgentId;
  activeTab: CourseTabId;
  onTabChange: (tab: CourseTabId) => void;
  status: AgentRunStatus;
  startUrl: string;
  viewportImage: string | null;
  viewportUrl: string;
  viewportTitle: string;
  progress: CourseAgentProgress;
  crawledPages: CrawledPageItem[];
  siteSections: SiteSectionItem[];
  siteQuestion: string | null;
  selectedSectionIds: string[];
  onToggleSection: (id: string) => void;
  onSolveSelected: () => void;
  uncertainTasks: UncertainTaskItem[];
  dryRunTasks: DryRunTaskItem[];
  solutions: CourseTaskSolution[];
  debugScreenshots: DebugScreenshotItem[];
  solvingUrl: string | null;
  identityReport: IdentityReport | null;
  logs: AgentLogEntry[];
  finalSummary: string | null;
  errorMessage: string | null;
  errorDetails?: string | null;
  selfTestResult: SelfTestResult | null;
  onRunSelfTest?: () => void;
  onRunAgent: () => void;
  onLogAction?: (action: string, summary: string, details?: string, url?: string) => void;
}

const STATUS_LABELS: Record<AgentRunStatus, { label: string; colorClass: string }> = {
  idle: { label: 'Hazır', colorClass: 'text-slate-600' },
  starting: { label: 'Başlatılıyor', colorClass: 'text-blue-700' },
  running: { label: 'Çalışıyor', colorClass: 'text-blue-700' },
  awaiting_selection: { label: 'Seçim Bekleniyor', colorClass: 'text-amber-700' },
  completed: { label: 'Tamamlandı', colorClass: 'text-emerald-700' },
  stopped: { label: 'Durduruldu', colorClass: 'text-slate-600' },
  error: { label: 'Hata oluştu', colorClass: 'text-red-700' },
};

const PHASE_LABELS: Record<CourseAgentProgress['phase'], string> = {
  idle: 'Beklemede',
  crawl: 'Site ve kaynaklar taranıyor',
  explore: 'Düğme ve sekmeler keşfediliyor',
  select: 'Bölümler bulundu — seçiminiz bekleniyor',
  tasks: 'Görev sayfaları belirleniyor',
  solve: 'Çözümler üretiliyor',
  done: 'Tamamlandı',
};

function renderFormattedSolution(text: string) {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3).replace(/^[a-zA-Z0-9+#-]+\n/, '').trim();
      return (
        <pre
          key={idx}
          className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100"
        >
          <code>{inner}</code>
        </pre>
      );
    }
    const trimmed = part.trim();
    if (!trimmed) return null;
    return (
      <div
        key={idx}
        className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800"
      >
        {trimmed}
      </div>
    );
  });
}

function downloadTextFile(filename: string, content: string, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function CourseAgentWorkspace({
  agentType,
  activeTab,
  onTabChange,
  status,
  startUrl,
  viewportImage,
  viewportUrl,
  viewportTitle,
  progress,
  crawledPages,
  siteSections,
  siteQuestion,
  selectedSectionIds,
  onToggleSection,
  onSolveSelected,
  uncertainTasks,
  dryRunTasks,
  solutions,
  debugScreenshots,
  solvingUrl,
  identityReport,
  logs,
  finalSummary,
  errorMessage,
  errorDetails,
  selfTestResult,
  onRunSelfTest,
  onRunAgent,
  onLogAction,
}: CourseAgentWorkspaceProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSolutionId, setCopiedSolutionId] = useState<string | null>(null);
  const [pageFilter, setPageFilter] = useState<'all' | 'source' | 'resource' | 'task'>('all');

  const statusInfo = STATUS_LABELS[status];
  const isBusy = status === 'starting' || status === 'running';
  const isAgent2 = agentType === 'agent2';
  const pythonCode = isAgent2 ? AJAN_V8_PYTHON_CODE : AJAN_PYTHON_CODE;
  const pythonFileName = isAgent2 ? 'ajan_v8.py' : 'ajan_v7.py';

  const filteredPages = crawledPages.filter((p) => {
    if (pageFilter === 'source') return p.kind === 'source';
    if (pageFilter === 'resource') return p.kind === 'resource';
    if (pageFilter === 'task') return p.isTask;
    return true;
  });

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
      onLogAction?.(
        'Python Kodu Kopyalandı',
        `${isAgent2 ? 'Ajan 2' : 'Ajan 1'} referans kodu (${pythonFileName}) panoya kopyalandı.`,
        pythonFileName
      );
    } catch {
      // Clipboard unavailable
    }
  };

  const handleCopySolution = async (id: string, text: string, title?: string, url?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSolutionId(id);
      setTimeout(() => setCopiedSolutionId(null), 1800);
      onLogAction?.(
        'Çözüm Kopyalandı',
        `${isAgent2 ? 'Ajan 2' : 'Ajan 1'} çözümü panoya kopyalandı (${title || id}).`,
        title,
        url
      );
    } catch {
      // Clipboard unavailable
    }
  };

  const tabs: Array<{ id: CourseTabId; label: string; count?: number }> = [
    {
      id: 'solutions',
      label: 'Görev Çözümleri',
      count: solutions.length > 0 ? solutions.length : dryRunTasks.length,
    },
    { id: 'pages', label: 'Taranan Sayfalar & Kaynaklar', count: crawledPages.length },
    { id: 'logs', label: 'Adım Günlüğü', count: logs.length },
    ...(debugScreenshots.length > 0
      ? [{ id: 'debug' as const, label: 'Hata Görüntüleri', count: debugScreenshots.length }]
      : []),
    { id: 'code', label: `Python Kodu (${pythonFileName})` },
  ];

  return (
    <div className="space-y-6">
      {/* Canlı Tarama & Görsel Ekran Kartı */}
      <section
        aria-label="Canlı Tarama Ekranı"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        {/* Adres & Durum Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Globe className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <div className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-700">
              {progress.currentUrl || viewportUrl || startUrl}
            </div>
            {viewportTitle && (
              <span className="hidden max-w-[200px] truncate text-xs text-slate-500 xl:inline">
                {viewportTitle}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs">
            <span className={`flex items-center gap-1.5 font-medium whitespace-nowrap ${statusInfo.colorClass}`}>
              {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
              {status === 'error' && <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
              {statusInfo.label}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600 whitespace-nowrap">
              {PHASE_LABELS[progress.phase]}
            </span>
          </div>
        </div>

        {/* 4 Sütunlu Canlı İlerleme Şeridi */}
        <div className="grid grid-cols-2 divide-y divide-slate-200 border-b border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Taranan Sayfa</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
              {progress.visitedCount} / {progress.maxPages}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Kaynak · JS/JSON</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
              {progress.sourceReadCount}/{progress.sourceCount}
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                · {progress.resourceCount} JS
              </span>
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Görev Sayfası</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
              {progress.taskCount}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Üretilen Çözüm</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
              {progress.solvedCount}
            </p>
          </div>
        </div>

        {/* Hata Bildirimi */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Çalıştırma Hatası</p>
              <p className="mt-0.5 text-xs text-red-800 break-words">{errorMessage}</p>
              {errorDetails && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-red-900 hover:underline">
                    Hata ayrıntılarını göster (traceback)
                  </summary>
                  <pre className="mt-1.5 max-h-40 overflow-auto rounded-md border border-red-200 bg-white/80 p-2.5 font-mono text-[11px] leading-relaxed text-red-900">
                    {errorDetails}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Canlı Site Önizleme Sahnesi */}
        <div className="relative bg-slate-950">
          {viewportImage ? (
            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <img
                src={viewportImage}
                alt={viewportTitle ? `Taranan sayfa: ${viewportTitle}` : 'Taranan ders sayfası görünümü'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full flex-col items-center justify-center px-6 py-12 text-center">
              {status === 'starting' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" />
                  <p className="font-display text-base font-semibold text-white">
                    Ders Kaynak Ajanı başlatılıyor
                  </p>
                  <p className="max-w-md text-xs text-slate-400">
                    Sayfalar, JS/JSON veri akışları, düzenleyici blokları ve kaynak arşivleri taranıyor.
                  </p>
                </div>
              ) : (
                <div className="flex max-w-md flex-col items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300">
                    <BookOpen className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">
                      {isAgent2
                        ? 'Ajan 2 · Yerel / Hafta Çözücü Hazır (Sürüm 8)'
                        : 'Ajan 1 · Ders Kaynak & Görev Çözücü Hazır (Sürüm 7)'}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {isAgent2
                        ? 'Siteyi tarayıp bulduğu bölüm ve haftaları listeler; seçtiğiniz kısmı Gemini veya yerel Ollama ile çözüp AST ve güvenlik kurallarıyla doğrular.'
                        : 'Siteyi salt-okunur korumayla tarar; sitede bulduğu bölüm, hafta ve sayfaları size sorarak seçtiğiniz kısmı Python 3 çözümlerine dönüştürür.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRunAgent}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Siteyi Tara
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* İnceleme ve Çözüm Sekmeleri */}
      <section
        aria-label="Ajan Çıktı Paneli"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="flex items-center justify-between gap-4 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div role="tablist" className="flex items-center gap-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border border-slate-200 bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      ({tab.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {finalSummary && activeTab === 'solutions' && (
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-950">
            <p className="text-xs font-semibold text-emerald-800">Tarama &amp; Çözüm Özeti</p>
            <p className="mt-1">{finalSummary}</p>
          </div>
        )}

        {identityReport &&
          activeTab === 'solutions' &&
          (identityReport.pages.length > 0 ||
            identityReport.forms.length > 0 ||
            (identityReport.chosenUrl && identityReport.chosenUrl !== startUrl)) && (
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Ad / Okul No ve Harici Form Bağlantıları
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Ajan yalnızca okur; form doldurmaz ve göndermez. Elle açmak için bağlantıyı
                    kullanabilirsiniz.
                  </p>
                </div>
                {identityReport.chosenUrl && (
                  <a
                    href={identityReport.chosenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 whitespace-nowrap shrink-0"
                  >
                    Önerilen Kimlik Sayfasını Aç
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                )}
              </div>

              {identityReport.pages.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-xs">
                  {identityReport.pages.map((p) => (
                    <li key={p.url} className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">[{p.reason}]</span>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 hover:underline break-all"
                      >
                        {p.url}
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {identityReport.forms.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {identityReport.forms.map((f) => (
                    <li key={f.url} className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">[harici form]</span>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 hover:underline break-all"
                      >
                        {f.label ? `${f.label} — ${f.url}` : f.url}
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        <div className="min-h-[280px]">
          {activeTab === 'solutions' && (
            <div className="divide-y divide-slate-200">
              {solvingUrl && (
                <div className="flex items-center gap-3 bg-blue-50/70 px-5 py-3.5 text-xs text-blue-900">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden="true" />
                  <span className="truncate">
                    Çözüm üretiliyor: <span className="font-mono">{solvingUrl}</span>
                  </span>
                </div>
              )}

              {status === 'awaiting_selection' && siteSections.length > 0 && !solvingUrl && (
                <div className="bg-amber-50/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        {siteQuestion || 'Sitedeki bölümler bulundu. Hangi kısmı yapmamı istersin?'}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        Sol panelden veya aşağıdan bir ya da daha fazla bölüm seçip &ldquo;Seçili Kısmı
                        Yap&rdquo; düğmesine tıklayın.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={selectedSectionIds.length === 0}
                      onClick={onSolveSelected}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Seçili Kısmı Yap ({selectedSectionIds.length})
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {siteSections.map((sec) => {
                      const checked = selectedSectionIds.includes(sec.id);
                      return (
                        <label
                          key={sec.id}
                          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors cursor-pointer ${
                            checked
                              ? 'border-blue-300 bg-white text-slate-900'
                              : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleSection(sec.id)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-slate-900">{sec.label}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                              {sec.description}
                            </span>
                            <span className="mt-1 block font-mono text-[10px] text-slate-500 tabular-nums">
                              {sec.charCount.toLocaleString('tr-TR')} karakter
                              {sec.sourceHints > 0 ? ` · ${sec.sourceHints} kaynak` : ''}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {uncertainTasks.length > 0 && (
                <div className="bg-amber-50/40 px-5 py-3.5 text-xs text-amber-950">
                  <p className="font-semibold text-amber-900">
                    Hafta Bilgisi Belirsiz — Atanmadı ({uncertainTasks.length})
                  </p>
                  <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-amber-800">
                    {uncertainTasks.map((u) => (
                      <li key={u.url} className="truncate">
                        {u.url} — {u.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {solutions.length === 0 &&
                dryRunTasks.length === 0 &&
                !solvingUrl &&
                status !== 'awaiting_selection' && (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <FileCode2 className="h-6 w-6 text-slate-400" aria-hidden="true" />
                    <p className="mt-2.5 text-sm font-medium text-slate-900">
                      Henüz görev çözümü üretilmedi
                    </p>
                    <p className="mt-1 max-w-md text-xs text-slate-500">
                      Önce &ldquo;Siteyi Tara&rdquo; ile sayfadaki bölümleri keşfedin, ardından
                      seçtiğiniz kısım için Python 3 çözümlerini üretin.
                    </p>
                  </div>
                )}

              {solutions.length === 0 && dryRunTasks.length > 0 && (
                <div className="divide-y divide-slate-200">
                  {dryRunTasks.map((task, idx) => (
                    <article key={task.url} className="p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700 tabular-nums">
                          Görev Adayı {idx + 1} / {dryRunTasks.length}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Puan: {task.score}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {task.textLength.toLocaleString('tr-TR')} karakter
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                        {task.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-blue-700 break-all">
                        {task.url}
                      </p>
                      {task.reasons.length > 0 && (
                        <p className="mt-1.5 text-xs text-slate-600">
                          Neden: {task.reasons.join(' | ')}
                        </p>
                      )}
                      <div className="mt-2.5 text-xs text-slate-700">
                        {task.usedSources.length === 0 ? (
                          <span className="text-slate-500">Eşleşen harici kaynak: (yok)</span>
                        ) : (
                          <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                            {task.usedSources.map((src) => (
                              <li key={src.url} className="truncate">
                                + kaynak: {src.url} ({src.chars} karakter
                                {src.reason ? ` — ${src.reason}` : ''})
                              </li>
                            ))}
                          </ul>
                        )}
                        {isAgent2 && task.skippedSources && task.skippedSources.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-mono text-[11px] text-slate-500 hover:text-slate-800">
                              Elenen kaynaklar ({task.skippedSources.length})
                            </summary>
                            <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-500">
                              {task.skippedSources.slice(0, 12).map((sk) => (
                                <li key={`${sk.url}-${sk.reason}`} className="truncate">
                                  - {sk.url} ({sk.reason})
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {solutions.map((sol) => (
                <article key={sol.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700 tabular-nums">
                          Görev {sol.index} / {sol.total}
                        </span>
                        {typeof sol.week === 'number' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-600 tabular-nums">
                              {sol.week}. Hafta
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{sol.durationMs} ms</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-600">
                          cozumler/{sol.fileName}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                        {sol.taskTitle}
                      </h3>
                      <a
                        href={sol.taskUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-blue-700 hover:underline break-all"
                      >
                        {sol.taskUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                      {sol.reasons && sol.reasons.length > 0 && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Tespit: {sol.reasons.join(' · ')}
                        </p>
                      )}
                      {!sol.hasSources && (
                        <p className="mt-1.5 text-xs text-amber-700">
                          Ayrı kaynak kod bulunamadı; çözüm görev metnindeki bilgilerle üretildi.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {sol.codeResults?.map((cr) => (
                        <button
                          key={cr.fileName}
                          type="button"
                          onClick={() => {
                            downloadTextFile(
                              cr.fileName,
                              cr.code,
                              'text/x-python;charset=utf-8'
                            );
                            onLogAction?.(
                              'Çözüm Kodu İndirildi',
                              `${isAgent2 ? 'Ajan 2' : 'Ajan 1'} çözümü indirildi: ${cr.fileName}`,
                              sol.taskTitle,
                              sol.taskUrl
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          {cr.error ? '.HATALI.txt İndir' : '.py İndir'}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const mdName = sol.fileName || 'cozum.md';
                          downloadTextFile(
                            mdName,
                            `# ${sol.taskTitle}\n\n${sol.taskUrl}\n\n${sol.solutionText}\n`
                          );
                          onLogAction?.(
                            'Markdown Çözüm İndirildi',
                            `${isAgent2 ? 'Ajan 2' : 'Ajan 1'} Markdown çözümü indirildi: ${mdName}`,
                            sol.taskTitle,
                            sol.taskUrl
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        .md İndir
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySolution(sol.id, sol.solutionText, sol.taskTitle, sol.taskUrl)
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                      >
                        {copiedSolutionId === sol.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            Kopyalandı
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            Kopyala
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {((sol.usedSources && sol.usedSources.length > 0) ||
                    (isAgent2 && sol.skippedSources && sol.skippedSources.length > 0)) && (
                    <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs">
                      {sol.usedSources && sol.usedSources.length > 0 && (
                        <div>
                          <p className="font-semibold text-slate-700">Kullanılan Kaynaklar</p>
                          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-600">
                            {sol.usedSources.map((src) => (
                              <li key={src.url} className="truncate">
                                + {src.url} ({src.chars} karakter
                                {src.reason ? ` — ${src.reason}` : ''})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {isAgent2 && sol.skippedSources && sol.skippedSources.length > 0 && (
                        <details>
                          <summary className="cursor-pointer font-mono text-[11px] text-slate-500 hover:text-slate-800">
                            Elenen kaynaklar ({sol.skippedSources.length})
                          </summary>
                          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-500">
                            {sol.skippedSources.slice(0, 12).map((sk) => (
                              <li key={`${sk.url}-${sk.reason}`} className="truncate">
                                - {sk.url} ({sk.reason})
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}

                  {sol.codeResults && sol.codeResults.length > 0 && (
                    <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs">
                      {sol.codeResults.map((cr) => (
                        <div key={cr.fileName} className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                            <span className="font-semibold text-slate-800">{cr.fileName}:</span>
                            {cr.error ? (
                              <span className="text-red-700">HATALI ({cr.error})</span>
                            ) : (
                              <span className="text-emerald-700">sözdizimi geçerli (AST)</span>
                            )}
                          </div>
                          {cr.riskyCalls.length > 0 && (
                            <p className="font-mono text-[11px] text-amber-800">
                              [uyarı] dikkat gerektiren çağrılar: {cr.riskyCalls.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {renderFormattedSolution(sol.solutionText)}
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'pages' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-2.5">
                <span className="text-xs text-slate-600">
                  Toplam {filteredPages.length} kayıt gösteriliyor
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                  {(
                    [
                      { id: 'all', label: 'Tümü' },
                      { id: 'task', label: 'Görevler' },
                      { id: 'source', label: 'Kaynaklar' },
                      { id: 'resource', label: 'JS/JSON' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPageFilter(f.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        pageFilter === f.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPages.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-slate-500">
                  Seçili filtre için taranmış kayıt bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="px-4 py-2.5 font-semibold">Sayfa / Dosya</th>
                        <th className="px-4 py-2.5 font-semibold">Sınıf</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Kod Bloğu</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Karakter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPages.map((item) => {
                        const kindLabel =
                          item.kind === 'source'
                            ? 'Kaynak / Kod'
                            : item.kind === 'resource'
                              ? 'JS/JSON Veri'
                              : item.hasIdentity
                                ? 'Kimlik / Giriş Alanı'
                                : item.isTask
                                  ? 'Görev Sayfası'
                                  : 'Sayfa';
                        return (
                          <tr key={item.url} className="hover:bg-slate-50/70">
                            <td className="max-w-[420px] px-4 py-2.5">
                              <p className="truncate font-medium text-slate-900">{item.title}</p>
                              <p className="truncate font-mono text-[11px] text-slate-500">
                                {item.url}
                              </p>
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                              {kindLabel}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                              {item.codeBlockCount}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                              {item.textLength.toLocaleString('tr-TR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Terminal className="h-6 w-6 text-slate-400" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-medium text-slate-900">
                    Henüz tarama günlüğü yok
                  </p>
                </div>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} className="px-4 py-2.5 hover:bg-slate-50/70">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-700 tabular-nums">
                        #{String(entry.step).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(entry.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                      {entry.durationMs !== undefined && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{entry.durationMs} ms</span>
                        </>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 text-xs break-words ${
                        entry.type === 'error'
                          ? 'text-red-700'
                          : entry.type === 'warning'
                            ? 'text-amber-800'
                            : entry.type === 'summary'
                              ? 'font-medium text-emerald-900'
                              : 'text-slate-800'
                      }`}
                    >
                      {entry.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {debugScreenshots.map((shot) => (
                <div
                  key={shot.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <img
                    src={shot.dataUrl}
                    alt={`${shot.reason} — ${shot.url}`}
                    className="aspect-video w-full bg-slate-950 object-contain"
                  />
                  <div className="border-t border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-amber-800">
                        [{shot.reason}]
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {new Date(shot.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600">
                      {shot.url}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4 p-4">
              {isAgent2 && selfTestResult && (
                <div
                  className={`rounded-lg border p-4 text-xs ${
                    selfTestResult.passed
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                      : 'border-red-200 bg-red-50/70 text-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      Self-Test Sonucu:{' '}
                      {selfTestResult.passed ? 'TÜM TESTLER GEÇTİ' : 'BAZI TESTLER BAŞARISIZ'}
                    </p>
                    <span className="font-mono text-[11px] tabular-nums">
                      {selfTestResult.checks.filter((c) => c.ok).length}/{selfTestResult.checks.length}
                    </span>
                  </div>
                  <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {selfTestResult.checks.map((chk) => (
                      <li key={chk.name} className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className={chk.ok ? 'text-emerald-700' : 'text-red-700'}>
                          {chk.ok ? '[GEÇTİ]' : '[KALDI]'}
                        </span>
                        <span className="truncate">{chk.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Code2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <span>
                    {isAgent2
                      ? 'Referans Python Kodu (ajan_v8.py — sürüm 8)'
                      : 'Referans Python Kodu (ajan_v7.py — sürüm 7)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isAgent2 && onRunSelfTest && (
                    <button
                      type="button"
                      onClick={onRunSelfTest}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Self-Test Çalıştır
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      downloadTextFile(pythonFileName, pythonCode, 'text/x-python;charset=utf-8');
                      onLogAction?.(
                        'Referans Kod İndirildi',
                        `${isAgent2 ? 'Ajan 2' : 'Ajan 1'} referans kodu indirildi: ${pythonFileName}`,
                        pythonFileName
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    {pythonFileName} İndir
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPython}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Kopyala
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="max-h-[460px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
                {pythonCode}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
