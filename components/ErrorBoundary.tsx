import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        // (plain styles, not Tailwind classes: the 3D home and the books do not load Tailwind, and this must read there too)
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505', color: '#fff', padding: 32, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          <div style={{ maxWidth: 672 }}>
            <h1 style={{ fontSize: 24, lineHeight: '32px', fontWeight: 700, marginBottom: 16, color: '#f87171' }}>Something went wrong</h1>
            <pre style={{ background: 'rgba(0,0,0,.5)', padding: 16, borderRadius: 4, overflow: 'auto', fontSize: 14, lineHeight: '20px' }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, padding: '8px 16px', background: '#6366f1', color: '#fff', borderRadius: 4, border: 0, cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


