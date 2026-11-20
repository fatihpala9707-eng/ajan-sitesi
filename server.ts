import dotenv from 'dotenv';
dotenv.config();

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {
  checkOllamaServer,
  courseRuns,
  executeCourseAgentRun,
  executeCourseAgentSolveSelection,
  runV8SelfTest,
  type CourseAgentRun,
  type CourseSSEClient,
} from './server/courseAgent.ts';
import {
  clearActivityLogs,
  getActivityLogs,
  recordActivity,
  type ActivityCategory,
} from './server/activityLog.ts';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const USER_PASSCODE = '1324657';
const DEV_PASSCODE = '7777777';
const devTokens = new Set<string>();

function findChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  const roots = ['/ms-playwright', `${process.env.HOME || ''}/.cache/ms-playwright`];
  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const sub = path.join(root, entry.name);
        const candidates = [
          path.join(sub, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
          path.join(sub, 'chrome-linux', 'chrome'),
          path.join(sub, 'chrome-linux64', 'chrome'),
        ];
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    } catch {
      // Ignore permission or read errors while scanning candidate roots
    }
  }
  return undefined;
}

function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const chromiumPath = findChromiumExecutable();
    res.json({
      ok: true,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasChromium: Boolean(chromiumPath),
      chromiumPath: chromiumPath ? path.basename(chromiumPath) : null,
    });
  });

  app.post('/api/auth/verify', (req, res) => {
    const rawCode = String(req.body?.code || '');
    const normalized = rawCode.replace(/\D/g, '');
    if (normalized.length !== 7) {
      res.status(400).json({ ok: false, error: 'Lütfen 7 haneli şifreyi eksiksiz girin.' });
      return;
    }

    if (normalized === USER_PASSCODE) {
      const sessionId = crypto.randomUUID().slice(0, 8);
      recordActivity({
        role: 'user',
        sessionId,
        agent: 'system',
        category: 'auth',
        action: 'Kullanıcı Girişi',
        summary: `kullanıcı (${sessionId}) sisteme 7 haneli şifre ile giriş yaptı.`,
      });
      res.json({ ok: true, role: 'user', sessionId });
      return;
    }

    if (normalized === DEV_PASSCODE) {
      const sessionId = crypto.randomUUID().slice(0, 8);
      const devToken = crypto.randomUUID();
      devTokens.add(devToken);
      recordActivity({
        role: 'developer',
        sessionId,
        agent: 'system',
        category: 'auth',
        action: 'Geliştirici Girişi',
        summary: `geliştirici (${sessionId}) geliştirici ekranına giriş yaptı.`,
      });
      res.json({ ok: true, role: 'developer', sessionId, devToken });
      return;
    }

    res.status(401).json({ ok: false, error: 'Hatalı şifre. Lütfen 7 haneli şifreyi kontrol edin.' });
  });

  app.post('/api/activity', (req, res) => {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : 'oturum';
    const agent =
      req.body?.agent === 'agent1' || req.body?.agent === 'agent2' ? req.body.agent : 'system';
    const allowedCategories = new Set<ActivityCategory>([
      'auth',
      'scan',
      'solve',
      'stop',
      'tool',
      'download',
      'navigation',
    ]);
    const category: ActivityCategory = allowedCategories.has(req.body?.category)
      ? req.body.category
      : 'navigation';
    const action = String(req.body?.action || 'Kullanıcı İşlemi').slice(0, 120);
    const summary = String(req.body?.summary || 'işlem gerçekleştirildi.').slice(0, 400);
    const details =
      typeof req.body?.details === 'string' ? req.body.details.slice(0, 400) : undefined;
    const url = typeof req.body?.url === 'string' ? req.body.url.slice(0, 400) : undefined;

    const entry = recordActivity({
      role: 'user',
      sessionId,
      agent,
      category,
      action,
      summary,
      details,
      url,
    });
    res.json({ ok: true, entry });
  });

  app.get('/api/dev/logs', (req, res) => {
    const token = String(req.headers['x-dev-token'] || '');
    if (!token || !devTokens.has(token)) {
      res.status(401).json({ error: 'Geliştirici yetkisi gerekli.' });
      return;
    }
    res.json({ logs: getActivityLogs() });
  });

  app.delete('/api/dev/logs', (req, res) => {
    const token = String(req.headers['x-dev-token'] || '');
    if (!token || !devTokens.has(token)) {
      res.status(401).json({ error: 'Geliştirici yetkisi gerekli.' });
      return;
    }
    clearActivityLogs();
    res.json({ ok: true });
  });

  app.post('/api/agent/start', (req, res) => {
    const agentType = req.body?.agentType === 'agent2' ? 'agent2' : 'agent1';
    const sessionId =
      typeof req.body?.sessionId === 'string' && req.body.sessionId.trim()
        ? req.body.sessionId.trim()
        : undefined;
    const startUrl = String(req.body?.startUrl || '').trim();
    const systemPrompt = String(req.body?.systemPrompt || '').trim();
    const debugMode = Boolean(req.body?.debugMode);
    const explore = req.body?.explore === undefined ? true : Boolean(req.body.explore);
    const taskPattern =
      typeof req.body?.taskPattern === 'string' && req.body.taskPattern.trim()
        ? req.body.taskPattern.trim()
        : undefined;
    const identityPattern =
      typeof req.body?.identityPattern === 'string' && req.body.identityPattern.trim()
        ? req.body.identityPattern.trim()
        : undefined;

    if (!isSafeHttpUrl(startUrl)) {
      res.status(400).json({ error: 'Geçerli bir http:// veya https:// başlangıç URL adresi girin.' });
      return;
    }

    const runId = crypto.randomUUID();
    const run: CourseAgentRun = {
      id: runId,
      agentType,
      sessionId,
      status: 'starting',
      aborted: false,
      activeModel: 'gemini-4-hydrogen',
      events: [],
      clients: new Set(),
      browser: null,
      createdAt: Date.now(),
    };
    courseRuns.set(runId, run);

    recordActivity({
      role: 'user',
      sessionId,
      agent: agentType,
      category: 'scan',
      action: 'Site Taraması Başlatıldı',
      summary: `${agentType === 'agent2' ? 'Ajan 2' : 'Ajan 1'} ile '${startUrl}' adresi için site taraması başlatıldı.`,
      url: startUrl,
    });

    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, existing] of courseRuns.entries()) {
      if (existing.createdAt < cutoff && id !== runId && existing.clients.size === 0) {
        courseRuns.delete(id);
      }
    }

    void executeCourseAgentRun(
      run,
      {
        agentType,
        startUrl,
        debugMode,
        explore,
        taskPattern,
        identityPattern,
        systemPrompt,
      },
      findChromiumExecutable
    );
    res.json({ runId });
  });

  app.post('/api/agent/:runId/solve', (req, res) => {
    const run = courseRuns.get(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Çalıştırma oturumu bulunamadı.' });
      return;
    }
    if (!run.crawlSnapshot) {
      res.status(400).json({ error: 'Önce site taraması tamamlanmalıdır.' });
      return;
    }
    if (run.status === 'running' || run.status === 'starting') {
      res.status(409).json({ error: 'Ajan şu anda çalışıyor; tamamlanmasını bekleyin.' });
      return;
    }

    const selectedIds = Array.isArray(req.body?.selectedIds)
      ? req.body.selectedIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];
    if (selectedIds.length === 0) {
      res.status(400).json({ error: 'Lütfen siteden en az bir bölüm/kısım seçin.' });
      return;
    }

    const dryRun = Boolean(req.body?.dryRun);
    const systemPrompt =
      typeof req.body?.systemPrompt === 'string' && req.body.systemPrompt.trim()
        ? req.body.systemPrompt.trim()
        : undefined;
    const modelProvider = req.body?.modelProvider === 'ollama' ? 'ollama' : 'gemini';
    const ollamaUrl =
      typeof req.body?.ollamaUrl === 'string' ? req.body.ollamaUrl.trim() : undefined;
    const ollamaModel =
      typeof req.body?.ollamaModel === 'string' ? req.body.ollamaModel.trim() : undefined;
    const numCtxRaw = Number(req.body?.numCtx ?? 8192);
    const numCtx = Number.isFinite(numCtxRaw) ? Math.max(4096, Math.round(numCtxRaw)) : 8192;

    const selectedLabels = run.crawlSnapshot.sections
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.label);
    const labelText = selectedLabels.length > 0 ? selectedLabels.join(', ') : selectedIds.join(', ');
    recordActivity({
      role: 'user',
      sessionId: run.sessionId,
      agent: run.agentType,
      category: 'solve',
      action: 'Seçili Kısım Çözümü Başlatıldı',
      summary: `${run.agentType === 'agent2' ? 'Ajan 2' : 'Ajan 1'} ile seçilen kısım (${labelText}) için ${modelProvider === 'ollama' ? `Ollama (${ollamaModel || 'qwen2.5-coder:7b'})` : 'Gemini'} ile çözüm başlatıldı.`,
      url: run.crawlSnapshot.startUrl,
      details: labelText,
    });

    void executeCourseAgentSolveSelection(run, {
      selectedIds,
      dryRun,
      systemPrompt,
      modelProvider,
      ollamaUrl,
      ollamaModel,
      numCtx,
    });
    res.json({ ok: true });
  });

  app.post('/api/agent2/ollama-check', async (req, res) => {
    const ollamaUrl = String(req.body?.ollamaUrl || 'http://127.0.0.1:11434').trim();
    const ollamaModel = String(req.body?.ollamaModel || 'qwen2.5-coder:7b').trim();
    const sessionId =
      typeof req.body?.sessionId === 'string' && req.body.sessionId.trim()
        ? req.body.sessionId.trim()
        : undefined;
    const result = await checkOllamaServer(ollamaUrl, ollamaModel);
    recordActivity({
      role: 'user',
      sessionId,
      agent: 'agent2',
      category: 'tool',
      action: 'Ollama Bağlantı Kontrolü',
      summary: `Ajan 2 üzerinden Ollama bağlantısı kontrol edildi (${ollamaUrl}, model: ${ollamaModel}) -> ${result.ok ? 'Başarılı' : 'Başarısız'}.`,
      url: ollamaUrl,
      details: result.message,
    });
    res.json(result);
  });

  app.post('/api/agent2/self-test', (req, res) => {
    const sessionId =
      typeof req.body?.sessionId === 'string' && req.body.sessionId.trim()
        ? req.body.sessionId.trim()
        : undefined;
    const result = runV8SelfTest();
    recordActivity({
      role: 'user',
      sessionId,
      agent: 'agent2',
      category: 'tool',
      action: 'Ajan 2 Self-Test',
      summary: `Ajan 2 Self-Test çalıştırıldı (${result.checks.filter((c) => c.ok).length}/${result.checks.length} test geçti).`,
    });
    res.json(result);
  });

  app.get('/api/agent/stream/:runId', (req, res) => {
    const run = courseRuns.get(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Çalıştırma oturumu bulunamadı.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: CourseSSEClient = { res };
    run.clients.add(client);

    for (const item of run.events) {
      res.write(`event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`);
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      run.clients.delete(client);
    });
  });

  app.post('/api/agent/:runId/stop', async (req, res) => {
    const run = courseRuns.get(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Çalıştırma oturumu bulunamadı.' });
      return;
    }
    run.aborted = true;
    run.status = 'stopped';
    if (run.browser) {
      try {
        await run.browser.close();
      } catch {
        // Ignore close errors
      }
      run.browser = null;
    }
    const stopEvt = `event: status\ndata: ${JSON.stringify({ status: 'stopped' })}\n\n`;
    const logPayload = {
      id: crypto.randomUUID(),
      step: 0,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: '[bilgi] Ajan kullanıcı tarafından durduruldu.',
    };
    const logEvt = `event: log\ndata: ${JSON.stringify(logPayload)}\n\n`;
    run.events.push({ event: 'status', data: { status: 'stopped' } });
    run.events.push({ event: 'log', data: logPayload });
    for (const client of run.clients) {
      try {
        client.res.write(stopEvt);
        client.res.write(logEvt);
      } catch {
        run.clients.delete(client);
      }
    }
    recordActivity({
      role: 'user',
      sessionId: run.sessionId,
      agent: run.agentType,
      category: 'stop',
      action: 'Ajan Durduruldu',
      summary: `${run.agentType === 'agent2' ? 'Ajan 2' : 'Ajan 1'} kullanıcı tarafından durduruldu.`,
      url: run.crawlSnapshot?.startUrl,
    });
    res.json({ ok: true });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ders Kaynak Ajanı sunucusu http://0.0.0.0:${PORT} adresinde hazır`);
  });
}

startServer().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
