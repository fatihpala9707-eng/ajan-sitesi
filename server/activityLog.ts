import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type ActivityCategory =
  | 'auth'
  | 'scan'
  | 'solve'
  | 'stop'
  | 'tool'
  | 'download'
  | 'navigation';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  formattedDate: string;
  role: 'user' | 'developer';
  sessionId: string;
  agent: 'agent1' | 'agent2' | 'system';
  category: ActivityCategory;
  action: string;
  sentence: string;
  details?: string;
  url?: string;
}

const MAX_LOG_ENTRIES = 2000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'activity_logs.json');

function formatTurkishDateTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function loadLogsFromDisk(): ActivityLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLogsToDisk(entries: ActivityLogEntry[]) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch {
    // Ignore disk persistence errors in restricted environments
  }
}

const activityLogs: ActivityLogEntry[] = loadLogsFromDisk();

export function recordActivity(params: {
  role?: 'user' | 'developer';
  sessionId?: string;
  agent?: 'agent1' | 'agent2' | 'system';
  category: ActivityCategory;
  action: string;
  summary: string;
  details?: string;
  url?: string;
}): ActivityLogEntry {
  const now = new Date();
  const formattedDate = formatTurkishDateTime(now);
  const entry: ActivityLogEntry = {
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
    formattedDate,
    role: params.role || 'user',
    sessionId: params.sessionId || 'oturum-yok',
    agent: params.agent || 'system',
    category: params.category,
    action: params.action,
    sentence: `${formattedDate} tarihinde ${params.summary}`,
    details: params.details,
    url: params.url,
  };

  activityLogs.unshift(entry);
  if (activityLogs.length > MAX_LOG_ENTRIES) {
    activityLogs.length = MAX_LOG_ENTRIES;
  }
  saveLogsToDisk(activityLogs);
  return entry;
}

export function getActivityLogs(): ActivityLogEntry[] {
  return activityLogs;
}

export function clearActivityLogs(): void {
  activityLogs.length = 0;
  saveLogsToDisk(activityLogs);
}
