import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so a single broken component shows a readable
 * message instead of blanking the whole app to a white page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="font-display text-xl text-navy-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-navy-400 mb-6">
            The app hit an unexpected error while rendering.
          </p>
          <pre className="text-left text-xs text-coral-600 bg-coral-50 rounded-xl p-3 mb-6 overflow-auto max-h-32 whitespace-pre-wrap">
            {error.message}
          </pre>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-5 py-2.5 border border-navy-100/30 text-navy-600 rounded-xl font-medium hover:bg-navy-50 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
