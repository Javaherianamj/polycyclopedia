import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { ApiResult } from '../../lib/api/types';
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';

// The client-side counterpart to Loading.astro / ErrorState.astro /
// EmptyState.astro. It cannot reuse those files directly -- Astro
// components render to static HTML and are never hydrated, so nothing
// exported from an .astro file is importable here. What it shares with
// them instead is the CSS: identical classnames from global.css's "R4
// states" block, so a build-time Empty and this client-time Empty are
// pixel-identical despite coming from two different template languages
// (see the comment in global.css and web/README.md).
//
// This is the ONLY one of the four states with a working retry, because
// it is the only one that runs somewhere a retry means anything — a
// browser, with a live network connection. The build-time versions have
// none: a failed build-time fetch fails the build instead of rendering
// ErrorState.astro's disabled button.

interface DataBoundaryProps<T> {
  locale: Locale;
  fetcher: () => Promise<ApiResult<T>>;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}

type Status<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'full'; data: T };

export function DataBoundary<T>({ locale, fetcher, isEmpty, children }: DataBoundaryProps<T>) {
  const [status, setStatus] = useState<Status<T>>({ kind: 'loading' });

  const load = useCallback(() => {
    setStatus({ kind: 'loading' });
    fetcher().then((result) => {
      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error.message });
        return;
      }
      if (isEmpty?.(result.data)) {
        setStatus({ kind: 'empty' });
        return;
      }
      setStatus({ kind: 'full', data: result.data });
    });
  }, [fetcher, isEmpty]);

  useEffect(() => {
    load();
  }, [load]);

  if (status.kind === 'loading') {
    return (
      <div className="state-loading" role="status" aria-live="polite">
        <span className="state-spinner" aria-hidden="true" />
        <span>{t(locale, 'state.loading')}</span>
      </div>
    );
  }

  if (status.kind === 'error') {
    return (
      <div className="state-error" role="alert">
        <p className="state-error-title">{t(locale, 'state.error.title')}</p>
        <button
          type="button"
          className="state-error-retry"
          data-testid="error-state-retry-button"
          onClick={load}
        >
          {t(locale, 'state.error.retry')}
        </button>
      </div>
    );
  }

  if (status.kind === 'empty') {
    return <div className="state-empty">{t(locale, 'state.empty')}</div>;
  }

  return <>{children(status.data)}</>;
}
