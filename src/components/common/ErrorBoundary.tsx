import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches unexpected render errors anywhere in the app so the user sees a
 * clear message instead of a blank white screen (spec §26's "unexpected
 * application error" category). Reader/document-specific errors are
 * handled locally where they occur; this is the last-resort fallback.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unexpected application error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.assign('/');
  };

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
          The app hit an unexpected error and can&apos;t continue safely. Your imported documents are
          still saved on this device. Reloading usually fixes this.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="min-h-[44px] rounded-full bg-sky-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
        >
          Reload
        </button>
      </div>
    );
  }
}
