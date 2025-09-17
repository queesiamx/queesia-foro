import { jsx as _jsx } from "react/jsx-runtime";
// src/main.tsx (primeras líneas)
import "@/firebase"; // ← asegura initializeApp() antes de que cargue cualquier ruta
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import ErrorBoundary from "@components/ErrorBoundary";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(RouterProvider, { router: router }) }) }));
