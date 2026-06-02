import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Readonly<Props> & Readonly<{ children?: React.ReactNode }>;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl p-8 max-w-md w-full text-center space-y-4">
            <div className="size-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
              <span className="text-coral text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-dark">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-coral text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
