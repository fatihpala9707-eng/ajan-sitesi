import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  LogOut,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from 'lucide-react';
import {
  CourseAgentWorkspace,
  type CourseTabId,
} from './components/CourseAgentWorkspace';
import { DeveloperConsole } from './components/DeveloperConsole';
import { PasscodeGate, type AuthVerifyResult } from './components/PasscodeGate';
import {
  COURSE_PRESETS,
  DEFAULT_SOLVE_PROMPT,
  DEFAULT_START_URL,
  DEFAULT_V8_SYSTEM_PROMPT,
} from './data/presets';
import type {
  ActivityCategory,
  AgentId,
  AgentLogEntry,
  AgentRunStatus,
  CourseAgentProgress,
  CourseTaskSolution,
  CrawledPageItem,
  DebugScreenshotItem,
  DryRunTaskItem,
  IdentityReport,
  ModelProvider,
  SelfTestResult,
  SiteSectionItem,
  SiteSectionsPayload,
  UncertainTaskItem,
} from './types/agent';

interface AgentSessionState {
  startUrl: string;
  systemPrompt: string;
  showSystemPrompt: boolean;
  modelProvider: ModelProvider;
  ollamaUrl: string;
  ollamaModel: string;
  numCtx: number;
  ollamaStatus: { ok: boolean; message: string } | null;
  ollamaChecking: boolean;
  selfTestResult: SelfTestResult | null;
  selfTestRunning: boolean;
  activeTab: CourseTabId;
  runId: string | null;
  status: AgentRunStatus;
  viewportImage: string | null;
  viewportUrl: string;
  viewportTitle: string;
  progress: CourseAgentProgress;
  crawledPages: CrawledPageItem[];
  siteSections: SiteSectionItem[];
  siteQuestion: string | null;
  selectedSectionIds: string[];
  uncertainTasks: UncertainTaskItem[];
  dryRunTasks: DryRunTaskItem[];
  solutions: CourseTaskSolution[];
  debugScreenshots: DebugScreenshotItem[];
  solvingUrl: string | null;
  identityReport: IdentityReport | null;
  logs: AgentLogEntry[];
  finalSummary: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
}

function createEmptyProgress(): CourseAgentProgress {
  return {
    phase: 'idle',
    visitedCount: 0,
    maxPages: 60,
    resourceCount: 0,
    sourceCount: 0,
    sourceReadCount: 0,
    taskCount: 0,
    solvedCount: 0,
    currentUrl: '',
  };
}

function createInitialSession(agentId: AgentId): AgentSessionState {
  return {
    startUrl: DEFAULT_START_URL,
    systemPrompt: agentId === 'agent2' ? DEFAULT_V8_SYSTEM_PROMPT : DEFAULT_SOLVE_PROMPT,
    showSystemPrompt: false,
    modelProvider: 'gemini',
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen2.5-coder:7b',
    numCtx: 8192,
    ollamaStatus: null,
    ollamaChecking: false,
    selfTestResult: null,
    selfTestRunning: false,
    activeTab: 'solutions',
    runId: null,
    status: 'idle',
    viewportImage: null,
    viewportUrl: '',
    viewportTitle: '',
    progress: createEmptyProgress(),
    crawledPages: [],
    siteSections: [],
    siteQuestion: null,
    selectedSectionIds: [],
    uncertainTasks: [],
    dryRunTasks: [],
    solutions: [],
    debugScreenshots: [],
    solvingUrl: null,
    identityReport: null,
    logs: [],
    finalSummary: null,
    errorMessage: null,
    errorDetails: null,
  };
}

export default function App() {
  const [auth, setAuth] = useState<AuthVerifyResult | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentId>('agent1');
  const [sessions, setSessions] = useState<Record<AgentId, AgentSessionState>>(() => ({
    agent1: createInitialSession('agent1'),
    agent2: createInitialSession('agent2'),
  }));

  const esMapRef = useRef<Record<AgentId, EventSource | null>>({
    agent1: null,
    agent2: null,
  });

  useEffect(() => {
    const map = esMapRef.current;
    return () => {
      map.agent1?.close();
      map.agent2?.close();
    };
  }, []);

  const recordClientActivity = (params: {
    agent?: AgentId | 'system';
    category: ActivityCategory;
    action: string;
    summary: string;
    details?: string;
    url?: string;
  }) => {
    if (!auth || auth.role !== 'user') return;
    void fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: auth.sessionId,
        agent: params.agent || activeAgent,
        category: params.category,
        action: params.action,
        summary: params.summary,
        details: params.details,
        url: params.url,
      }),
    }).catch(() => {});
  };

  const updateSession = (
    agentId: AgentId,
    updater: (prev: AgentSessionState) => AgentSessionState
  ) => {
    setSessions((prev) => ({
      ...prev,
      [agentId]: updater(prev[agentId]),
    }));
  };

  const session = sessions[activeAgent];
  const isRunning = session.status === 'starting' || session.status === 'running';

  const closeAgentStream = (agentId: AgentId) => {
    esMapRef.current[agentId]?.close();
    esMapRef.current[agentId] = null;
  };

  const handleLogout = () => {
    if (auth?.role === 'user') {
      recordClientActivity({
        agent: 'system',
        category: 'auth',
        action: 'Kullanıcı Çıkışı',
        summary: `kullanıcı (${auth.sessionId}) oturumu kilitledi ve çıkış yaptı.`,
      });
    }
    closeAgentStream('agent1');
    closeAgentStream('agent2');
    setAuth(null);
  };

  const resetRun = (agentId: AgentId = activeAgent, logClear = false) => {
    closeAgentStream(agentId);
    if (logClear) {
      recordClientActivity({
        agent: agentId,
        category: 'navigation',
        action: 'Çalışma Alanı Temizlendi',
        summary: `${agentId === 'agent2' ? 'Ajan 2' : 'Ajan 1'} çalışma alanı temizlendi.`,
      });
    }
    updateSession(agentId, (prev) => ({
      ...prev,
      runId: null,
      status: 'idle',
      viewportImage: null,
      viewportUrl: '',
      viewportTitle: '',
      progress: createEmptyProgress(),
      crawledPages: [],
      siteSections: [],
      siteQuestion: null,
      selectedSectionIds: [],
      uncertainTasks: [],
      dryRunTasks: [],
      solutions: [],
      debugScreenshots: [],
      solvingUrl: null,
      identityReport: null,
      logs: [],
      finalSummary: null,
      errorMessage: null,
      errorDetails: null,
    }));
  };

  const handleRunAgent = async (agentId: AgentId = activeAgent) => {
    const current = sessions[agentId];
    if (current.status === 'starting' || current.status === 'running') return;

    resetRun(agentId);
    updateSession(agentId, (prev) => ({ ...prev, status: 'starting', activeTab: 'solutions' }));

    try {
      const response = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: agentId,
          sessionId: auth?.sessionId,
          startUrl: current.startUrl,
          explore: true,
          debugMode: false,
          systemPrompt: current.systemPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        updateSession(agentId, (prev) => ({
          ...prev,
          status: 'error',
          errorMessage: data.error || 'Ajan başlatılamadı.',
        }));
        return;
      }

      const newRunId = data.runId as string;
      updateSession(agentId, (prev) => ({ ...prev, runId: newRunId }));

      const es = new EventSource(`/api/agent/stream/${newRunId}`);
      esMapRef.current[agentId] = es;

      es.addEventListener('status', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as { status: AgentRunStatus };
        updateSession(agentId, (prev) => ({
          ...prev,
          status: payload.status,
          solvingUrl:
            payload.status === 'completed' ||
            payload.status === 'stopped' ||
            payload.status === 'error' ||
            payload.status === 'awaiting_selection'
              ? null
              : prev.solvingUrl,
        }));
        if (payload.status === 'stopped' || payload.status === 'error') {
          es.close();
          if (esMapRef.current[agentId] === es) {
            esMapRef.current[agentId] = null;
          }
        }
      });

      es.addEventListener('viewport', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as {
          dataUrl: string;
          url: string;
          title: string;
        };
        updateSession(agentId, (prev) => ({
          ...prev,
          viewportImage: payload.dataUrl,
          viewportUrl: payload.url,
          viewportTitle: payload.title,
        }));
      });

      es.addEventListener('progress', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as CourseAgentProgress;
        updateSession(agentId, (prev) => ({ ...prev, progress: payload }));
      });

      es.addEventListener('page_crawled', (evt) => {
        const item = JSON.parse((evt as MessageEvent).data) as CrawledPageItem;
        updateSession(agentId, (prev) => {
          if (prev.crawledPages.some((p) => p.url === item.url)) return prev;
          return { ...prev, crawledPages: [...prev.crawledPages, item] };
        });
      });

      es.addEventListener('identity_links', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as IdentityReport;
        updateSession(agentId, (prev) => ({ ...prev, identityReport: payload }));
      });

      es.addEventListener('site_sections', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as SiteSectionsPayload;
        const defaults = payload.sections.filter((s) => s.defaultSelected).map((s) => s.id);
        updateSession(agentId, (prev) => ({
          ...prev,
          siteQuestion: payload.question,
          siteSections: payload.sections,
          selectedSectionIds:
            defaults.length > 0
              ? defaults
              : payload.sections.length === 1
                ? [payload.sections[0].id]
                : [],
        }));
      });

      es.addEventListener('uncertain_tasks', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as {
          uncertain: UncertainTaskItem[];
        };
        updateSession(agentId, (prev) => ({ ...prev, uncertainTasks: payload.uncertain }));
      });

      es.addEventListener('tasks_found', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as {
          tasks: DryRunTaskItem[];
        };
        updateSession(agentId, (prev) => ({
          ...prev,
          dryRunTasks: payload.tasks,
          progress: {
            ...prev.progress,
            phase: payload.tasks.length > 0 ? 'tasks' : prev.progress.phase,
            taskCount: payload.tasks.length,
          },
        }));
      });

      es.addEventListener('solution_started', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as { taskUrl: string };
        updateSession(agentId, (prev) => ({ ...prev, solvingUrl: payload.taskUrl }));
      });

      es.addEventListener('solution_done', (evt) => {
        const sol = JSON.parse((evt as MessageEvent).data) as CourseTaskSolution;
        updateSession(agentId, (prev) => ({
          ...prev,
          solvingUrl: null,
          solutions: [...prev.solutions, sol],
          progress: { ...prev.progress, solvedCount: prev.progress.solvedCount + 1 },
        }));
      });

      es.addEventListener('debug_screenshot', (evt) => {
        const shot = JSON.parse((evt as MessageEvent).data) as DebugScreenshotItem;
        updateSession(agentId, (prev) => ({
          ...prev,
          debugScreenshots: [...prev.debugScreenshots, shot],
        }));
      });

      es.addEventListener('log', (evt) => {
        const entry = JSON.parse((evt as MessageEvent).data) as AgentLogEntry;
        updateSession(agentId, (prev) => ({ ...prev, logs: [...prev.logs, entry] }));
      });

      es.addEventListener('completed', (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as { summary: string };
        updateSession(agentId, (prev) => ({ ...prev, finalSummary: payload.summary }));
      });

      es.addEventListener('error', (evt) => {
        if (evt instanceof MessageEvent && evt.data) {
          const payload = JSON.parse(evt.data) as { message: string; details?: string };
          updateSession(agentId, (prev) => ({
            ...prev,
            errorMessage: payload.message,
            errorDetails: payload.details || null,
          }));
        }
      });
    } catch (err) {
      updateSession(agentId, (prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Sunucuyla bağlantı kurulamadı.',
      }));
    }
  };

  const handleSolveSelected = async (agentId: AgentId = activeAgent) => {
    const current = sessions[agentId];
    if (!current.runId || current.selectedSectionIds.length === 0) return;
    if (current.status === 'starting' || current.status === 'running') return;

    updateSession(agentId, (prev) => ({
      ...prev,
      activeTab: 'solutions',
      solutions: [],
      dryRunTasks: [],
      uncertainTasks: [],
      finalSummary: null,
      errorMessage: null,
      errorDetails: null,
      progress: { ...prev.progress, solvedCount: 0 },
    }));

    try {
      const response = await fetch(`/api/agent/${current.runId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIds: current.selectedSectionIds,
          dryRun: false,
          systemPrompt: current.systemPrompt,
          modelProvider: agentId === 'agent2' ? current.modelProvider : 'gemini',
          ollamaUrl: current.ollamaUrl,
          ollamaModel: current.ollamaModel,
          numCtx: current.numCtx,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        updateSession(agentId, (prev) => ({
          ...prev,
          errorMessage: data.error || 'Seçili kısım başlatılamadı.',
        }));
      }
    } catch (err) {
      updateSession(agentId, (prev) => ({
        ...prev,
        errorMessage: err instanceof Error ? err.message : 'Sunucuyla bağlantı kurulamadı.',
      }));
    }
  };

  const handleStopAgent = async (agentId: AgentId = activeAgent) => {
    const rid = sessions[agentId].runId;
    if (!rid) return;
    try {
      await fetch(`/api/agent/${rid}/stop`, { method: 'POST' });
    } catch {
      // Ignore stop error
    }
  };

  const handleToggleSection = (id: string) => {
    updateSession(activeAgent, (prev) => {
      const exists = prev.selectedSectionIds.includes(id);
      return {
        ...prev,
        selectedSectionIds: exists
          ? prev.selectedSectionIds.filter((x) => x !== id)
          : [...prev.selectedSectionIds, id],
      };
    });
  };

  const handleCheckOllama = async () => {
    const current = sessions.agent2;
    updateSession('agent2', (prev) => ({ ...prev, ollamaChecking: true, ollamaStatus: null }));
    try {
      const res = await fetch('/api/agent2/ollama-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: auth?.sessionId,
          ollamaUrl: current.ollamaUrl,
          ollamaModel: current.ollamaModel,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      updateSession('agent2', (prev) => ({
        ...prev,
        ollamaChecking: false,
        ollamaStatus: data,
      }));
    } catch (err) {
      updateSession('agent2', (prev) => ({
        ...prev,
        ollamaChecking: false,
        ollamaStatus: {
          ok: false,
          message: err instanceof Error ? err.message : 'Ollama kontrolü başarısız oldu.',
        },
      }));
    }
  };

  const handleRunSelfTest = async () => {
    updateSession('agent2', (prev) => ({ ...prev, selfTestRunning: true }));
    try {
      const res = await fetch('/api/agent2/self-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: auth?.sessionId }),
      });
      const data = (await res.json()) as SelfTestResult;
      updateSession('agent2', (prev) => ({
        ...prev,
        selfTestRunning: false,
        selfTestResult: data,
        activeTab: 'code',
      }));
    } catch {
      updateSession('agent2', (prev) => ({ ...prev, selfTestRunning: false }));
    }
  };

  if (!auth) {
    return <PasscodeGate onAuthenticated={(result) => setAuth(result)} />;
  }

  if (auth.role === 'developer' && auth.devToken) {
    return <DeveloperConsole devToken={auth.devToken} onLogout={handleLogout} />;
  }

  const canSolve =
    Boolean(session.runId) &&
    session.siteSections.length > 0 &&
    session.selectedSectionIds.length > 0 &&
    !isRunning;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Ana Çalışma Alanı */}
      <main id="top" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* Ajan Sekmeleri ve Çıkış */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Ajan Seçimi"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1"
          >
            {(
              [
                { id: 'agent1', title: 'Ajan 1', sub: 'Ders Kaynak · v7' },
                { id: 'agent2', title: 'Ajan 2', sub: 'Yerel / Hafta · v8' },
              ] as const
            ).map((item) => {
              const active = activeAgent === item.id;
              const st = sessions[item.id].status;
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => {
                    setActiveAgent(item.id);
                    recordClientActivity({
                      agent: item.id,
                      category: 'navigation',
                      action: 'Ajan Sekmesi Değiştirildi',
                      summary: `kullanıcı ${item.title} sekmesine geçti.`,
                    });
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="font-semibold">{item.title}</span>
                  <span className={active ? 'text-slate-300' : 'text-slate-400'}>{item.sub}</span>
                  {(st === 'running' || st === 'starting') && (
                    <span className="font-mono text-[10px] text-blue-400">[çalışıyor]</span>
                  )}
                  {st === 'awaiting_selection' && (
                    <span className="font-mono text-[10px] text-amber-400">[seçim]</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Kilitle / Çıkış
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
          {/* Sol Kenar Çubuğu: Sade Yapılandırma ve Dinamik Bölüm Seçimi */}
          <aside className="space-y-6">
            <section
              aria-label="Ajan Yapılandırması"
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <h1 className="font-display text-base font-semibold text-slate-900">
                  {activeAgent === 'agent2'
                    ? 'Ajan 2 · Tarama & Bölüm Seçimi (v8)'
                    : 'Ajan 1 · Tarama & Bölüm Seçimi (v7)'}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeAgent === 'agent2'
                    ? 'Siteyi tarar, bulduğu kısımları sorar; Gemini veya yerel Ollama ile çözüp doğrular.'
                    : 'Siteyi tarar; sitede ne varsa size sorar, seçtiğiniz kısmı Python 3 ile çözer.'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="url-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Başlangıç URL&apos;si (START_URL)
                </label>
                <input
                  id="url-input"
                  type="url"
                  value={session.startUrl}
                  disabled={isRunning}
                  onChange={(e) =>
                    updateSession(activeAgent, (prev) => ({ ...prev, startUrl: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Dinamik Bölüm Seçimi: Hangi kısmı yapayım? */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">Hangi Kısmı Yapayım?</p>
                  {session.siteSections.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() =>
                          updateSession(activeAgent, (prev) => ({
                            ...prev,
                            selectedSectionIds: prev.siteSections.map((s) => s.id),
                          }))
                        }
                        className="font-medium text-blue-700 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Tümünü Seç
                      </button>
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() =>
                          updateSession(activeAgent, (prev) => ({
                            ...prev,
                            selectedSectionIds: [],
                          }))
                        }
                        className="font-medium text-slate-500 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                  )}
                </div>

                {session.siteSections.length === 0 ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    Önce &ldquo;Siteyi Tara&rdquo; düğmesine tıklayın. Ajan girdiği sitede bulduğu
                    hafta, görev ve sayfaları burada listeleyip hangi kısmı yapacağını soracaktır.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2.5">
                    {session.siteQuestion && (
                      <p className="text-[11px] font-medium text-slate-700">
                        {session.siteQuestion}
                      </p>
                    )}
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                      {session.siteSections.map((sec) => {
                        const checked = session.selectedSectionIds.includes(sec.id);
                        return (
                          <label
                            key={sec.id}
                            className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                              checked
                                ? 'border-blue-300 bg-white text-slate-900'
                                : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isRunning}
                              onChange={() => handleToggleSection(sec.id)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-slate-900">
                                {sec.label}
                              </span>
                              <span className="block truncate text-[11px] text-slate-500">
                                {sec.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!canSolve}
                      onClick={() => handleSolveSelected(activeAgent)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Seçili Kısmı Yap ({session.selectedSectionIds.length})
                    </button>
                  </div>
                )}
              </div>

              {activeAgent === 'agent2' && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">Model Sağlayıcı</span>
                    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                      {(
                        [
                          { id: 'gemini', label: 'Gemini' },
                          { id: 'ollama', label: 'Yerel Ollama' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isRunning}
                          onClick={() =>
                            updateSession('agent2', (prev) => ({ ...prev, modelProvider: opt.id }))
                          }
                          className={`rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                            session.modelProvider === opt.id
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {session.modelProvider === 'ollama' && (
                    <div className="space-y-2 border-t border-slate-200 pt-2.5">
                      <div>
                        <label
                          htmlFor="ollama-url-input"
                          className="block text-[11px] font-semibold text-slate-700"
                        >
                          Ollama URL (yalnızca localhost/127.0.0.1)
                        </label>
                        <input
                          id="ollama-url-input"
                          type="url"
                          value={session.ollamaUrl}
                          disabled={isRunning}
                          onChange={(e) =>
                            updateSession('agent2', (prev) => ({
                              ...prev,
                              ollamaUrl: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="ollama-model-input"
                            className="block text-[11px] font-semibold text-slate-700"
                          >
                            Model
                          </label>
                          <input
                            id="ollama-model-input"
                            type="text"
                            value={session.ollamaModel}
                            disabled={isRunning}
                            onChange={(e) =>
                              updateSession('agent2', (prev) => ({
                                ...prev,
                                ollamaModel: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="ollama-ctx-input"
                            className="block text-[11px] font-semibold text-slate-700"
                          >
                            num_ctx
                          </label>
                          <input
                            id="ollama-ctx-input"
                            type="number"
                            min={4096}
                            step={1024}
                            value={session.numCtx}
                            disabled={isRunning}
                            onChange={(e) =>
                              updateSession('agent2', (prev) => ({
                                ...prev,
                                numCtx: Number(e.target.value) || 8192,
                              }))
                            }
                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 tabular-nums"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={session.ollamaChecking || isRunning}
                        onClick={handleCheckOllama}
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        {session.ollamaChecking ? 'Kontrol ediliyor...' : 'Ollama Bağlantısını Kontrol Et'}
                      </button>
                      {session.ollamaStatus && (
                        <p
                          className={`flex items-start gap-1.5 text-[11px] ${
                            session.ollamaStatus.ok ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {session.ollamaStatus.ok ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          <span>{session.ollamaStatus.message}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2.5">
                    <button
                      type="button"
                      disabled={session.selfTestRunning}
                      onClick={handleRunSelfTest}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                      {session.selfTestRunning
                        ? 'Self-Test Çalışıyor...'
                        : 'Self-Test Çalıştır (--self-test)'}
                    </button>
                    {session.selfTestResult && (
                      <p
                        className={`mt-1.5 text-center font-mono text-[11px] font-medium ${
                          session.selfTestResult.passed ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {session.selfTestResult.passed
                          ? `TÜM TESTLER GEÇTİ (${session.selfTestResult.checks.length}/${session.selfTestResult.checks.length})`
                          : 'TEST HATASI'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    updateSession(activeAgent, (prev) => ({
                      ...prev,
                      showSystemPrompt: !prev.showSystemPrompt,
                    }))
                  }
                  className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <span>Çözüm İstemi (Prompt)</span>
                  {session.showSystemPrompt ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  )}
                </button>
                {session.showSystemPrompt && (
                  <textarea
                    rows={6}
                    value={session.systemPrompt}
                    disabled={isRunning}
                    onChange={(e) =>
                      updateSession(activeAgent, (prev) => ({
                        ...prev,
                        systemPrompt: e.target.value,
                      }))
                    }
                    aria-label="Çözüm İstemi"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none disabled:text-slate-500"
                  />
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={() => handleStopAgent(activeAgent)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap cursor-pointer"
                  >
                    <Square className="h-4 w-4" aria-hidden="true" />
                    Durdur
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRunAgent(activeAgent)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Siteyi Tara
                  </button>
                )}

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => resetRun(activeAgent, true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Temizle
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-xs font-semibold text-slate-700">Hazır Ders Siteleri</h2>
                <div className="mt-2.5 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {COURSE_PRESETS.map((preset) => {
                    const selected = session.startUrl === preset.startUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={isRunning}
                        onClick={() => {
                          updateSession(activeAgent, (prev) => ({
                            ...prev,
                            startUrl: preset.startUrl,
                          }));
                          recordClientActivity({
                            agent: activeAgent,
                            category: 'navigation',
                            action: 'Hazır Ders Sitesi Seçildi',
                            summary: `${activeAgent === 'agent2' ? 'Ajan 2' : 'Ajan 1'} için hazır site seçildi: ${preset.title}`,
                            url: preset.startUrl,
                          });
                        }}
                        className={`block w-full px-3.5 py-2.5 text-left transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-60 cursor-pointer ${
                          selected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900">{preset.title}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {preset.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </aside>

          {/* Sağ Çalışma Alanı */}
          <div className="min-w-0">
            <CourseAgentWorkspace
              agentType={activeAgent}
              activeTab={session.activeTab}
              onTabChange={(tab) =>
                updateSession(activeAgent, (prev) => ({ ...prev, activeTab: tab }))
              }
              status={session.status}
              startUrl={session.startUrl}
              viewportImage={session.viewportImage}
              viewportUrl={session.viewportUrl}
              viewportTitle={session.viewportTitle}
              progress={session.progress}
              crawledPages={session.crawledPages}
              siteSections={session.siteSections}
              siteQuestion={session.siteQuestion}
              selectedSectionIds={session.selectedSectionIds}
              onToggleSection={handleToggleSection}
              onSolveSelected={() => handleSolveSelected(activeAgent)}
              uncertainTasks={session.uncertainTasks}
              dryRunTasks={session.dryRunTasks}
              solutions={session.solutions}
              debugScreenshots={session.debugScreenshots}
              solvingUrl={session.solvingUrl}
              identityReport={session.identityReport}
              logs={session.logs}
              finalSummary={session.finalSummary}
              errorMessage={session.errorMessage}
              errorDetails={session.errorDetails}
              selfTestResult={session.selfTestResult}
              onRunSelfTest={activeAgent === 'agent2' ? handleRunSelfTest : undefined}
              onRunAgent={() => handleRunAgent(activeAgent)}
              onLogAction={(action, summary, details, url) =>
                recordClientActivity({
                  agent: activeAgent,
                  category: 'download',
                  action,
                  summary,
                  details,
                  url,
                })
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
