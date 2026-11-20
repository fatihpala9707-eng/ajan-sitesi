import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type { ActivityCategory, ActivityLogItem } from '../types/agent';

interface DeveloperConsoleProps {
  devToken: string;
  onLogout: () => void;
}

type FilterKey = 'all' | 'scan' | 'solve' | 'tool' | 'auth';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  auth: 'Giriş',
  scan: 'Site Tarama',
  solve: 'Çözüm',
  stop: 'Durdurma',
  tool: 'Araç / Test',
  download: 'İndirme / Kopya',
  navigation: 'Gezinme',
};

const AGENT_LABELS: Record<ActivityLogItem['agent'], string> = {
  agent1: 'Ajan 1 (v7)',
  agent2: 'Ajan 2 (v8)',
  system: 'Sistem',
};

function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DeveloperConsole({ devToken, onLogout }: DeveloperConsoleProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterKey>('all');
  const [onlyUserLogs, setOnlyUserLogs] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dev/logs', {
        headers: { 'x-dev-token': devToken },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'İşlem kayıtları yüklenemedi.');
        return;
      }
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      setError('Sunucudan işlem kayıtları alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [devToken]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    try {
      const response = await fetch('/api/dev/logs', {
        method: 'DELETE',
        headers: { 'x-dev-token': devToken },
      });
      if (response.ok) {
        setLogs([]);
        setConfirmClear(false);
      }
    } catch {
      setError('Kayıtlar temizlenemedi.');
    }
  };

  const baseLogs = useMemo(
    () => (onlyUserLogs ? logs.filter((l) => l.role === 'user') : logs),
    [logs, onlyUserLogs]
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return baseLogs.filter((item) => {
      if (categoryFilter === 'scan' && item.category !== 'scan') return false;
      if (categoryFilter === 'solve' && item.category !== 'solve') return false;
      if (categoryFilter === 'auth' && item.category !== 'auth') return false;
      if (
        categoryFilter === 'tool' &&
        item.category !== 'tool' &&
        item.category !== 'download' &&
        item.category !== 'stop' &&
        item.category !== 'navigation'
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = `${item.formattedDate} ${item.action} ${item.sentence} ${item.details || ''} ${item.url || ''} ${item.sessionId}`.toLocaleLowerCase('tr');
      return haystack.includes(q);
    });
  }, [baseLogs, categoryFilter, search]);

  const stats = useMemo(() => {
    const total = baseLogs.length;
    const scans = baseLogs.filter((l) => l.category === 'scan').length;
    const solves = baseLogs.filter((l) => l.category === 'solve').length;
    const other = total - scans - solves;
    return { total, scans, solves, other };
  }, [baseLogs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6">
        {/* Üst Araç Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-900">
              Geliştirici Ekranı · Kullanıcı İşlem Kayıtları
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Kullanıcıların yaptığı tarama, bölüm seçimi, çözüm ve indirme işlemleri tarih bilgisiyle
              kalıcı olarak listelenir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void fetchLogs()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Yenile
            </button>
            <button
              type="button"
              disabled={filteredLogs.length === 0}
              onClick={() => downloadJsonFile('kullanici-islem-kayitlari.json', filteredLogs)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              JSON İndir
            </button>
            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleClearLogs()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap cursor-pointer"
                >
                  Silmeyi Onayla
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={logs.length === 0}
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Kayıtları Temizle
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* 4 Sütunlu Özet Şeridi */}
        <section
          aria-label="İşlem Özeti"
          className="grid grid-cols-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          <div className="px-5 py-3.5">
            <p className="text-xs text-slate-500">Toplam Kayıt</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-slate-500">Site Taramaları</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
              {stats.scans}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-slate-500">Çözüm İşlemleri</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
              {stats.solves}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <p className="text-xs text-slate-500">Giriş &amp; Araç İşlemleri</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900 tabular-nums">
              {stats.other}
            </p>
          </div>
        </section>

        {/* Filtreler ve İşlem Tablosu */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-0.5">
              {(
                [
                  { id: 'all', label: 'Tümü' },
                  { id: 'scan', label: 'Tarama' },
                  { id: 'solve', label: 'Çözüm' },
                  { id: 'tool', label: 'Araç & İndirme' },
                  { id: 'auth', label: 'Giriş' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUserLogs}
                  onChange={(e) => setOnlyUserLogs(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Yalnızca kullanıcı işlemleri</span>
              </label>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tarih, URL veya işlem ara..."
                  aria-label="Kayıtlarda ara"
                  className="w-60 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="divide-y divide-slate-100 p-4">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center gap-4 py-3">
                  <div className="h-4 w-36 rounded bg-slate-100" />
                  <div className="h-4 flex-1 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">
                Gösterilecek işlem kaydı bulunmuyor
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Kullanıcılar sisteme giriş yapıp site taraması veya çözüm ürettiğinde yapılan her işlem
                tarih ve saatiyle burada görünür.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Tarih / Saat</th>
                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">İşlem Türü</th>
                    <th className="px-4 py-2.5 font-semibold">Yapılan İşlem Kaydı</th>
                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Ayrıntı / Adres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 align-top">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700 tabular-nums whitespace-nowrap">
                        {item.formattedDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {CATEGORY_LABELS[item.category]}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {AGENT_LABELS[item.agent]} · {item.role === 'developer' ? 'Geliştirici' : 'Kullanıcı'} ({item.sessionId})
                        </div>
                      </td>
                      <td className="max-w-[480px] px-4 py-3">
                        <p className="font-medium text-slate-900">{item.action}</p>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">{item.sentence}</p>
                      </td>
                      <td className="max-w-[320px] px-4 py-3 text-[11px] text-slate-600">
                        {item.details && (
                          <p className="break-words text-slate-700">{item.details}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-blue-700 hover:underline break-all"
                          >
                            {item.url}
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                          </a>
                        )}
                        {!item.details && !item.url && <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
