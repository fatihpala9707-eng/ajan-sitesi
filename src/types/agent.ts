export type AgentId = 'agent1' | 'agent2';

export type ModelProvider = 'gemini' | 'ollama';

export type AgentRunStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'awaiting_selection'
  | 'completed'
  | 'stopped'
  | 'error';

export type CourseAgentPhase = 'idle' | 'crawl' | 'explore' | 'select' | 'tasks' | 'solve' | 'done';

export interface AgentLogEntry {
  id: string;
  step: number;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'summary';
  durationMs?: number;
  message: string;
}

export interface CrawledPageItem {
  url: string;
  title: string;
  kind: 'page' | 'source' | 'resource';
  isTask: boolean;
  hasIdentity?: boolean;
  textLength: number;
  codeBlockCount: number;
  linkCount: number;
}

export interface SiteSectionItem {
  id: string;
  kind: 'week' | 'task' | 'page';
  label: string;
  description: string;
  weekNumber?: number | null;
  url: string;
  charCount: number;
  sourceHints: number;
  isTaskCandidate: boolean;
  defaultSelected?: boolean;
}

export interface SiteSectionsPayload {
  question: string;
  sections: SiteSectionItem[];
}

export interface UncertainTaskItem {
  url: string;
  reason: string;
}

export interface UsedSourceItem {
  url: string;
  chars: number;
  reason?: string;
}

export interface SkippedSourceItem {
  url: string;
  reason: string;
}

export interface DryRunTaskItem {
  url: string;
  title: string;
  score: number;
  reasons: string[];
  textLength: number;
  usedSources: UsedSourceItem[];
  skippedSources?: SkippedSourceItem[];
}

export interface CodeVerificationResult {
  fileName: string;
  code: string;
  error: string | null;
  riskyCalls: string[];
}

export interface CourseTaskSolution {
  id: string;
  taskUrl: string;
  taskTitle: string;
  fileName: string;
  index: number;
  total: number;
  week?: number | null;
  hasSources: boolean;
  reasons?: string[];
  usedSources?: UsedSourceItem[];
  skippedSources?: SkippedSourceItem[];
  codeResults?: CodeVerificationResult[];
  solutionText: string;
  durationMs: number;
  timestamp: string;
}

export interface IdentityReport {
  pages: Array<{ url: string; reason: string }>;
  forms: Array<{ url: string; label: string }>;
  chosenUrl: string;
}

export interface DebugScreenshotItem {
  id: string;
  url: string;
  reason: string;
  dataUrl: string;
  timestamp: string;
}

export interface CourseAgentProgress {
  phase: CourseAgentPhase;
  visitedCount: number;
  maxPages: number;
  resourceCount: number;
  sourceCount: number;
  sourceReadCount: number;
  taskCount: number;
  solvedCount: number;
  currentUrl: string;
}

export interface CoursePreset {
  id: string;
  title: string;
  subtitle: string;
  startUrl: string;
  maxPages: number;
  maxTasks: number;
}

export interface SelfTestResult {
  passed: boolean;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
}

export type AuthRole = 'user' | 'developer';

export type ActivityCategory =
  | 'auth'
  | 'scan'
  | 'solve'
  | 'stop'
  | 'tool'
  | 'download'
  | 'navigation';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  formattedDate: string;
  role: AuthRole;
  sessionId: string;
  agent: 'agent1' | 'agent2' | 'system';
  category: ActivityCategory;
  action: string;
  sentence: string;
  details?: string;
  url?: string;
}

