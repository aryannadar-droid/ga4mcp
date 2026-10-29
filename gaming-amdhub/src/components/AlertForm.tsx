import { useId, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { alertCapture } from '../content';
import { track } from '../lib/analytics';
import { DUR, EASE } from '../lib/motion';
import { BellIcon, CheckIcon } from './Icons';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IN_MOBILE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

/** Mocked sale-alert capture. Validates locally, fires alert_signup, never sends data anywhere. */
export function AlertForm({ section, product = 'build', compact = false }: { section: string; product?: string; compact?: boolean }) {
  const id = useId();
  const [value, setValue] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.replace(/\s+/g, '');
    const isEmail = EMAIL.test(v);
    if (!isEmail && !IN_MOBILE.test(v)) return setError(alertCapture.errorField);
    if (!consent) return setError(alertCapture.errorConsent);
    setError(null);
    setDone(true);
    // Only the channel type is tracked — never the contact value itself.
    track('alert_signup', { section, product, channel: isEmail ? 'email' : 'phone' });
  };

  return (
    <div aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <m.p
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE }}
            className="flex items-start gap-2 rounded-xl border border-line bg-raised p-4 text-sm"
          >
            <CheckIcon className="mt-0.5 shrink-0 text-accent" />
            {alertCapture.success}
          </m.p>
        ) : (
          <m.form key="form" noValidate onSubmit={submit} exit={{ opacity: 0 }} transition={{ duration: DUR.fast }}>
            <label htmlFor={`${id}-v`} className="mb-2 block text-sm font-medium">
              {alertCapture.fieldLabel}
            </label>
            <div className={compact ? 'flex flex-col gap-3' : 'flex flex-col gap-3 sm:flex-row'}>
              <input
                id={`${id}-v`}
                type="text"
                inputMode="email"
                autoComplete="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={alertCapture.fieldPlaceholder}
                aria-invalid={error === alertCapture.errorField}
                aria-describedby={error ? `${id}-err` : undefined}
                className="min-h-11 w-full min-w-0 flex-1 rounded-full border border-line bg-raised px-4 text-fg placeholder:text-muted/80 focus:border-accent"
              />
              <button type="submit" className="btn btn-primary">
                <BellIcon width={18} height={18} />
                {alertCapture.submit}
              </button>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={error === alertCapture.errorConsent}
                className="mt-0.5 size-5 shrink-0 accent-[var(--orange)]"
              />
              <span>{alertCapture.consent}</span>
            </label>
            {error && (
              <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-gold-soft">
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">{alertCapture.mockNote}</p>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
