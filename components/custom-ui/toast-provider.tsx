"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  title: string;
  description?: string;
  action?: ReactNode;
  type?: "default" | "error" | "success" | "warning";
}

interface ToastContextType {
  toast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (newToast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...newToast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyles = (type: Toast["type"]) => {
    const commonText = "text-zinc-950"; // consistent text color
  
    switch (type) {
      case "error":
        return `bg-[#FEE2E2] border border-[#FCA5A5] ${commonText}`;
      case "success":
        return `bg-[#DCFCE7] border border-[#86EFAC] ${commonText}`;
      case "warning":
        return `bg-[#FEF3C7] border border-[#FCD34D] ${commonText}`;
      default:
        return `bg-white border border-gray-200 ${commonText}`;
    }
  };
  

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative shadow-lg rounded-md px-4 py-3 w-80 animate-fade-in-up group ${getToastStyles(
              toast.type
            )}`}
          >
            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-inherit opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Toast Content */}
            <div className="font-semibold text-md">{toast.title}</div>
            {toast.description && (
              <div className="text-sm font-light mt-1">{toast.description}</div>
            )}
            {toast.action && <div className="mt-2">{toast.action}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
