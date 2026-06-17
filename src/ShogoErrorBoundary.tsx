import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ShogoErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%', border: '1px solid #e5e5e5', borderRadius: 16, padding: 24, background: '#fff' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>Reload</button>
        </div>
      </div>
    )
  }
}