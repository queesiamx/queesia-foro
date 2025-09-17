import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
export default function Threads() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const db = getFirestore();
        const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(20));
        const off = onSnapshot(q, (snap) => {
            setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => off();
    }, []);
    return (_jsx("div", { className: "space-y-4", children: loading ? (Array.from({ length: 6 }).map((_, i) => (_jsx("div", { className: "h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse" }, i)))) : (items.map((t) => (_jsx(Link, { to: `/thread/${t.id}`, className: "block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300", children: _jsx("div", { className: "font-semibold", children: t.title }) }, t.id)))) }));
}
