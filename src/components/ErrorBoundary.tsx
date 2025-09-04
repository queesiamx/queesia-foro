import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("UI Crash:", error); }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding: 24, fontFamily: "system-ui"}}>
          <h1>Algo falló al cargar la app</h1>
          <pre style={{whiteSpace: "pre-wrap"}}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
