"use client";
/**
 * Workspace state. Local-first: everything lives in this browser's localStorage behind a small
 * storage adapter, so the product works with no account and no credentials. To move persistence
 * to a database such as Supabase, implement `StorageAdapter` and pass it to the provider.
 */
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { FeedbackEntry, Level, ProcessedEntry, ProductBrief, SignalItem, Theme, ThemeStatus, WorkspaceState } from "./types";
import { buildThemes } from "./engine/themes";
import { buildSignals } from "./engine/trends";
import { processEntries } from "./ai/provider";
import { buildFlowdeskSample, SAMPLE_PRODUCT } from "./sample/flowdesk";
import { generateBrief } from "./engine/brief";

export interface StorageAdapter {
  load(): WorkspaceState | null;
  save(state: WorkspaceState | null): void;
}

const KEY = "signal.workspace.v1";

export const localStorageAdapter: StorageAdapter = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as WorkspaceState;
      return parsed && parsed.version === 1 && Array.isArray(parsed.entries) ? parsed : null;
    } catch {
      return null;
    }
  },
  save(state) {
    if (state === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(state));
  },
};

interface Ctx {
  ready: boolean;
  workspace: WorkspaceState | null;
  themes: Theme[];
  signals: SignalItem[];
  saveError: string | null;
  createWorkspace(name: string, withSample: boolean): Promise<void>;
  renameWorkspace(name: string): void;
  importEntries(entries: FeedbackEntry[], onProgress?: (done: number, total: number) => void): Promise<number>;
  loadSample(onProgress?: (done: number, total: number) => void): Promise<number>;
  setStatus(themeId: string, status: ThemeStatus): void;
  setPriority(themeId: string, level: Level | null): void;
  makeBrief(themeId: string): ProductBrief | null;
  markSeen(ids: string[]): void;
  deleteWorkspace(): void;
}

const WorkspaceContext = createContext<Ctx | null>(null);

export function useWorkspace(): Ctx {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

const empty = (name: string): WorkspaceState => ({ version: 1, name, createdAt: new Date().toISOString(), entries: [], statuses: {}, priorityOverrides: {}, briefs: {}, seen: [] });

/**
 * A tiny external store so React reads localStorage through useSyncExternalStore: the server
 * and the first client render see "not loaded yet", and the saved workspace appears right after.
 */
let adapterInUse: StorageAdapter = localStorageAdapter;
let current: WorkspaceState | null | undefined; // undefined = not loaded yet
let lastSaveError: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Swap the persistence backend (for example a database) before the provider mounts. */
export function setStorageAdapter(adapter: StorageAdapter) {
  adapterInUse = adapter;
  current = undefined;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = (): WorkspaceState | null | undefined => {
  if (current === undefined) current = adapterInUse.load();
  return current;
};
const getServerSnapshot = (): undefined => undefined;
const getErrorSnapshot = () => lastSaveError;

function commit(next: WorkspaceState | null) {
  current = next;
  try {
    adapterInUse.save(next);
    lastSaveError = null;
  } catch {
    lastSaveError = "This browser could not save your workspace (storage may be full or blocked). Export your data from Reports before closing the tab.";
  }
  emit();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saveError = useSyncExternalStore(subscribe, getErrorSnapshot, () => null);
  const ready = snapshot !== undefined;
  const workspace = snapshot ?? null;
  const wsRef = { get current() { return current ?? null; } };

  const themes = useMemo(() => (workspace ? buildThemes(workspace.entries) : []), [workspace?.entries]); // eslint-disable-line react-hooks/exhaustive-deps
  const signals = useMemo(() => (workspace ? buildSignals(workspace.entries, themes) : []), [workspace?.entries, themes]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: Ctx = {
    ready,
    workspace,
    themes,
    signals,
    saveError,
    async createWorkspace(name, withSample) {
      let ws = empty(name.trim() || "My workspace");
      if (withSample) ws = { ...ws, entries: await processEntries(buildFlowdeskSample()) };
      commit(ws);
    },
    renameWorkspace(name) {
      if (wsRef.current && name.trim()) commit({ ...wsRef.current, name: name.trim().slice(0, 80) });
    },
    async importEntries(entries, onProgress) {
      const ws = wsRef.current;
      if (!ws) return 0;
      const processed = await processEntries(entries, undefined, onProgress);
      commit({ ...(wsRef.current ?? ws), entries: [...(wsRef.current ?? ws).entries, ...processed] });
      return processed.length;
    },
    async loadSample(onProgress) {
      const ws = wsRef.current;
      if (!ws) return 0;
      const have = new Set(ws.entries.map((e) => e.id));
      const fresh = buildFlowdeskSample().filter((e) => !have.has(e.id));
      const processed = await processEntries(fresh, undefined, onProgress);
      commit({ ...ws, entries: [...ws.entries, ...processed] });
      return processed.length;
    },
    setStatus(themeId, status) {
      if (wsRef.current) commit({ ...wsRef.current, statuses: { ...wsRef.current.statuses, [themeId]: status } });
    },
    setPriority(themeId, level) {
      if (!wsRef.current) return;
      const next = { ...wsRef.current.priorityOverrides };
      if (level === null) delete next[themeId];
      else next[themeId] = level;
      commit({ ...wsRef.current, priorityOverrides: next });
    },
    makeBrief(themeId) {
      const ws = wsRef.current;
      const theme = themes.find((t) => t.id === themeId);
      if (!ws || !theme) return null;
      const brief = generateBrief(theme, ws.entries as ProcessedEntry[]);
      commit({ ...ws, briefs: { ...ws.briefs, [themeId]: brief } });
      return brief;
    },
    markSeen(ids) {
      if (wsRef.current) commit({ ...wsRef.current, seen: [...new Set([...wsRef.current.seen, ...ids])] });
    },
    deleteWorkspace() {
      commit(null);
    },
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const SAMPLE_NAME = SAMPLE_PRODUCT;
