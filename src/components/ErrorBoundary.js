import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export default class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) { console.error("UI Crash:", error); }
    render() {
        if (this.state.error) {
            return (_jsxs("div", { style: { padding: 24, fontFamily: "system-ui" }, children: [_jsx("h1", { children: "Algo fall\u00F3 al cargar la app" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: String(this.state.error) })] }));
        }
        return this.props.children;
    }
}
