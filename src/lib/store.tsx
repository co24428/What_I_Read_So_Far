"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Book } from "./types";
import { api } from "./client";

interface Store {
  books: Book[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  upsertLocal: (b: Book) => void;
  removeLocal: (id: string) => void;
  /** Open the shared book detail modal */
  openBook: (id: string) => void;
  openBookId: string | null;
  closeBook: () => void;
  /** Open the add-book dialog; onAdded runs with the created book */
  openAdd: (opts?: { status?: Book["status"]; onAdded?: (b: Book) => void }) => void;
  addOpts: { status?: Book["status"]; onAdded?: (b: Book) => void } | null;
  closeAdd: () => void;
  /** Show a short confirmation message */
  toast: (message: string, tone?: Toast["tone"]) => void;
  toasts: Toast[];
}

export interface Toast { id: number; message: string; tone: "success" | "error" | "info" }

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [addOpts, setAddOpts] = useState<Store["addOpts"]>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2600);
  }, []);

  const reload = useCallback(async () => {
    try {
      setBooks(await api<Book[]>("/api/books"));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void reload();
  }, [reload]);

  const upsertLocal = useCallback((b: Book) => {
    setBooks((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [b, ...prev]));
  }, []);
  const removeLocal = useCallback((id: string) => setBooks((prev) => prev.filter((x) => x.id !== id)), []);

  return (
    <Ctx.Provider
      value={{
        books, loading, error, reload, upsertLocal, removeLocal,
        openBook: setOpenBookId, openBookId, closeBook: () => setOpenBookId(null),
        openAdd: (opts) => setAddOpts(opts ?? {}), addOpts, closeAdd: () => setAddOpts(null),
        toast, toasts,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
