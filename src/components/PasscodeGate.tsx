import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import type { AuthRole } from '../types/agent';

export interface AuthVerifyResult {
  role: AuthRole;
  sessionId: string;
  devToken?: string;
}

interface PasscodeGateProps {
  onAuthenticated: (result: AuthVerifyResult) => void;
}

const DIGIT_COUNT = 7;

export function PasscodeGate({ onAuthenticated }: PasscodeGateProps) {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [showDigits, setShowDigits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  const code = digits.join('');
  const isComplete = code.length === DIGIT_COUNT;

  const verifyCode = async (candidate: string) => {
    const clean = candidate.replace(/\D/g, '');
    if (clean.length !== DIGIT_COUNT) {
      setError('Lütfen 7 haneli şifreyi eksiksiz girin.');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || 'Hatalı şifre. Lütfen tekrar deneyin.');
        return;
      }
      onAuthenticated({
        role: data.role as AuthRole,
        sessionId: data.sessionId as string,
        devToken: data.devToken as string | undefined,
      });
    } catch {
      setError('Sunucu ile doğrulama bağlantısı kurulamadı.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    const onlyDigits = rawValue.replace(/\D/g, '');
    setError(null);

    if (onlyDigits.length > 1) {
      const next = [...digits];
      for (let i = 0; i < DIGIT_COUNT && index + i < DIGIT_COUNT; i++) {
        next[index + i] = onlyDigits[i] || '';
      }
      setDigits(next);
      const nextFocus = Math.min(DIGIT_COUNT - 1, index + onlyDigits.length);
      inputRefs.current[nextFocus]?.focus();
      const joined = next.join('');
      if (joined.length === DIGIT_COUNT) {
        void verifyCode(joined);
      }
      return;
    }

    const digit = onlyDigits.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = next.join('');
    if (digit && joined.length === DIGIT_COUNT) {
      void verifyCode(joined);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      setError(null);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < DIGIT_COUNT - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(DIGIT_COUNT).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError(null);
    const focusIndex = Math.min(DIGIT_COUNT - 1, pasted.length - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === DIGIT_COUNT) {
      void verifyCode(pasted);
    }
  };

  const handleClear = () => {
    setDigits(Array(DIGIT_COUNT).fill(''));
    setError(null);
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void verifyCode(code);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 sm:p-8">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-900">
              Erişim Doğrulaması
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Devam etmek için 7 haneli erişim şifrenizi girin.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">7 Haneli Şifre</span>
              <button
                type="button"
                onClick={() => setShowDigits((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {showDigits ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Gizle
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Göster
                  </>
                )}
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-7 gap-2" role="group" aria-label="7 haneli erişim şifresi">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type={showDigits ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  autoFocus={index === 0}
                  disabled={submitting}
                  aria-label={`Şifre ${index + 1}. hane`}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white text-center font-mono text-base font-semibold text-slate-900 tabular-nums transition-colors focus:border-blue-600 focus:outline-none disabled:bg-slate-50"
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={submitting || !isComplete}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {submitting ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
            <button
              type="button"
              disabled={submitting || code.length === 0}
              onClick={handleClear}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Temizle
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
