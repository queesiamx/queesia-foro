import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
export default function Layout() {
    return (_jsx("div", { className: "min-h-screen bg-slate-50", children: _jsx("main", { children: _jsx(Outlet, {}) }) }));
}
