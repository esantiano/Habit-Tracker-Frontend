import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string};

type ToastContextValue = {
    toast: ( message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast myst be used within ToastProvider");
    return ctx;
}

export function ToastProvider ({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, {id, message }]);

        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast stack */}
            <div
                style={{
                    position: "fixed",
                    right: 16,
                    bottom: 16,
                    display: "grid",
                    gap: 8,
                    zIndex: 9999
                }}
            >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: "white",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                        maxWidth: 320,
                    }}
                >
                    {t.message}
                </div>
            ))}
            </div>
        </ToastContext.Provider>
    )
}