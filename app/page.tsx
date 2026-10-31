"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = "all" | "active" | "done";

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "todo_tasks";

// ─── Custom Hook: useLocalStorageTasks ────────────────────────────────────────

function useLocalStorageTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {
      // corrupted data — start fresh
    }
    setHydrated(true);
  }, []);

  // Persist every change after hydration
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    return true;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.done));
  }, []);

  return { tasks, hydrated, addTask, toggleTask, deleteTask, clearDone };
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TodoPage() {
  const { tasks, hydrated, addTask, toggleTask, deleteTask, clearDone } =
    useLocalStorageTasks();

  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived counts
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const activeCount = totalCount - doneCount;

  // Filtered list
  const visibleTasks = tasks.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = addTask(inputValue);
    if (success) {
      setInputValue("");
      inputRef.current?.focus();
    } else {
      // Trigger shake animation on empty submit
      setShake(true);
      setTimeout(() => setShake(false), 400);
      inputRef.current?.focus();
    }
  };

  // Filter tab config
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: totalCount },
    { key: "active", label: "Aktif", count: activeCount },
    { key: "done", label: "Selesai", count: doneCount },
  ];

  return (
    <div className="min-h-screen bg-blue-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* ── Header ── */}
        <div className="rounded-t-2xl bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-1">
            {/* Checklist icon */}
            <svg
              className="w-8 h-8 text-blue-200 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">My To-Do List</h1>
          </div>
          <p className="text-blue-200 text-sm pl-11">
            Kelola tugas harianmu dengan mudah
          </p>
        </div>

        {/* ── Body Card ── */}
        <div className="rounded-b-2xl bg-white px-5 py-6 shadow-xl shadow-blue-100">

          {/* ── Input Form ── */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={120}
              placeholder="Tambah tugas baru..."
              className={[
                "flex-1 rounded-xl border-2 bg-blue-50 px-4 py-2.5 text-sm text-blue-900",
                "placeholder-blue-300 outline-none transition-all duration-150",
                shake
                  ? "border-red-400 animate-[shake_0.35s_ease]"
                  : "border-blue-200 focus:border-blue-500 focus:bg-white",
              ].join(" ")}
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5
                         text-sm font-semibold text-white transition-colors
                         hover:bg-blue-700 active:scale-95"
            >
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah
            </button>
          </form>

          {/* ── Filter Tabs ── */}
          <div className="flex gap-2 mb-4">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  "flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-all",
                  filter === key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-blue-100 bg-blue-50 text-blue-500 hover:border-blue-400",
                ].join(" ")}
              >
                {label}
                <span
                  className={[
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    filter === key
                      ? "bg-blue-500 text-white"
                      : "bg-blue-100 text-blue-400",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Stats + Clear ── */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className="text-xs text-blue-400 font-medium">
              {hydrated
                ? `${totalCount} tugas • ${activeCount} aktif • ${doneCount} selesai`
                : "Memuat..."}
            </span>
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="text-xs font-semibold text-red-400 hover:text-red-600
                           hover:bg-red-50 rounded-md px-2 py-1 transition-colors"
              >
                Hapus Selesai
              </button>
            )}
          </div>

          {/* ── Task List ── */}
          {hydrated && (
            <ul className="flex flex-col gap-2.5">
              {visibleTasks.length === 0 ? (
                <li className="flex flex-col items-center gap-3 py-10 text-blue-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    fill="none"
                    className="w-16 h-16"
                  >
                    <circle cx="32" cy="32" r="30" stroke="#c7ddf7" strokeWidth="2.5" />
                    <path
                      d="M20 32h24M20 22h24M20 42h16"
                      stroke="#93bfef"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm">Tidak ada tugas di sini.</span>
                </li>
              ) : (
                visibleTasks.map((task) => (
                  <li
                    key={task.id}
                    className={[
                      "flex items-center gap-3 rounded-xl border-2 px-4 py-3",
                      "transition-all duration-150",
                      task.done
                        ? "border-blue-100 bg-blue-50 opacity-70"
                        : "border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm hover:shadow-blue-100",
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label="Tandai selesai"
                      className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md
                                 border-2 border-blue-300 bg-white transition-colors
                                 checked:border-blue-600 checked:bg-blue-600
                                 relative after:absolute after:left-[4px] after:top-[1px]
                                 after:h-[9px] after:w-[5px] after:rotate-45 after:border-b-2
                                 after:border-r-2 after:border-white after:opacity-0
                                 checked:after:opacity-100"
                    />

                    {/* Task Text */}
                    <span
                      className={[
                        "flex-1 text-sm leading-snug break-words",
                        task.done
                          ? "line-through text-blue-300"
                          : "text-blue-900",
                      ].join(" ")}
                    >
                      {task.text}
                    </span>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label="Hapus tugas"
                      className="shrink-0 rounded-lg p-1.5 text-blue-200 transition-colors
                                 hover:bg-red-50 hover:text-red-400"
                    >
                      <svg
                        className="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
