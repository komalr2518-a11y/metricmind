"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {
  ArrowUpRight,
  Bot,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { METRIC_CATALOG } from "@/lib/metricmind/catalog";
import type { PublicUser } from "@/lib/auth/types";
import type {
  AgentResponse,
  ChartConfig,
  MetricDefinition,
  MetricResult,
} from "@/lib/metricmind/types";
import ChartPanel from "./chart-panel";
import DataTable from "./data-table";
import KpiCards from "./kpi-cards";
import MetricSidebar from "./metric-sidebar";
import QuestionLaunchpad from "./question-launchpad";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chartConfig?: ChartConfig;
  metricDef?: MetricDefinition;
  metricResult?: MetricResult;
  followUps?: string[];
  isLoading?: boolean;
}

interface MetricMindAppProps {
  user: PublicUser;
}

const MAX_MESSAGE_LENGTH = 500;
const STORAGE_KEY_PREFIX = "metricmind_messages_v2";
const MAX_SAVED_MESSAGES = 50;
const SERVER_STORAGE_SNAPSHOT = "__metricmind_server__";
const EMPTY_STORAGE_SNAPSHOT = "__metricmind_empty__";
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "## Your business, explained clearly\n\nAsk about revenue, customers, margins, growth, or efficiency. MetricMind turns each question into an **answer, interactive chart, and source-backed table** using deterministic demo data.",
};
const DEFAULT_MESSAGES = [WELCOME_MESSAGE];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAgentResponse(value: unknown): value is AgentResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    Array.isArray(value.suggestedFollowUps) &&
    value.suggestedFollowUps.every((item) => typeof item === "string")
  );
}

function getErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return typeof value.error === "string" ? value.error : null;
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerStorageSnapshot(): string {
  return SERVER_STORAGE_SNAPSHOT;
}

function parseSavedMessages(saved: string): Message[] | null {
  if (
    saved === SERVER_STORAGE_SNAPSHOT ||
    saved === EMPTY_STORAGE_SNAPSHOT
  ) return null;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter((item): item is Message => {
      if (!isRecord(item)) return false;
      return (
        typeof item.id === "string" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.isLoading !== true
      );
    });

    return valid.length > 0 ? valid.slice(-MAX_SAVED_MESSAGES) : null;
  } catch {
    return null;
  }
}

function saveMessages(messages: Message[], storageKey: string) {
  try {
    const persistent = messages
      .filter((message) => !message.isLoading)
      .slice(-MAX_SAVED_MESSAGES);
    localStorage.setItem(storageKey, JSON.stringify(persistent));
  } catch {
    // Storage can be unavailable in private browsing or restrictive environments.
  }
}

export default function MetricMindApp({ user }: MetricMindAppProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}:${user.id}`;
  const getUserStorageSnapshot = useCallback(
    () => localStorage.getItem(storageKey) ?? EMPTY_STORAGE_SNAPSHOT,
    [storageKey]
  );
  const storageSnapshot = useSyncExternalStore(
    subscribeToStorage,
    getUserStorageSnapshot,
    getServerStorageSnapshot
  );
  const restoredMessages = useMemo(
    () => parseSavedMessages(storageSnapshot),
    [storageSnapshot]
  );
  const [sessionMessages, setSessionMessages] = useState<Message[] | null>(null);
  const messages = useMemo(
    () => sessionMessages ?? restoredMessages ?? DEFAULT_MESSAGES,
    [restoredMessages, sessionMessages]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const messageSequence = useRef(0);

  useEffect(() => {
    if (storageSnapshot !== SERVER_STORAGE_SNAPSHOT) {
      saveMessages(messages, storageKey);
    }
  }, [messages, storageKey, storageSnapshot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  const activeMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.metricResult && message.metricDef),
    [messages]
  );
  const activeResult = activeMessage?.metricResult ?? null;
  const activeChart = activeResult?.chartConfig ?? null;
  const activeMetric = activeMessage?.metricDef;

  useEffect(() => {
    if (!activeChart) return;

    visualizationRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeChart]);

  function nextMessageId(prefix: string) {
    messageSequence.current += 1;
    return `${prefix}-${messageSequence.current}`;
  }

  function updateMessages(updater: (current: Message[]) => Message[]) {
    setSessionMessages((current) =>
      updater(current ?? restoredMessages ?? DEFAULT_MESSAGES)
    );
  }

  async function sendMessage(text: string) {
    const userText = text.trim();
    if (!userText || requestRef.current) return;

    const controller = new AbortController();
    requestRef.current = controller;
    setInput("");
    setIsLoading(true);

    const userMessage: Message = {
      id: nextMessageId("user"),
      role: "user",
      content: userText,
    };
    const loadingMessage: Message = {
      id: nextMessageId("loading"),
      role: "assistant",
      content: "",
      isLoading: true,
    };
    updateMessages((current) => [...current, userMessage, loadingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
        signal: controller.signal,
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // The status-based fallback below handles non-JSON server responses.
      }

      if (!response.ok) {
        throw new Error(getErrorMessage(payload) ?? "The request failed.");
      }
      if (!isAgentResponse(payload)) {
        throw new Error("The server returned an invalid response.");
      }

      const assistantMessage: Message = {
        id: nextMessageId("assistant"),
        role: "assistant",
        content: payload.message,
        chartConfig: payload.metricResult?.chartConfig,
        metricDef: payload.metricDef,
        metricResult: payload.metricResult,
        followUps: payload.suggestedFollowUps,
      };

      updateMessages((current) => [
        ...current.filter((message) => !message.isLoading),
        assistantMessage,
      ]);
    } catch (error) {
      if (controller.signal.aborted) return;

      const fallback =
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again.";
      updateMessages((current) => [
        ...current.filter((message) => !message.isLoading),
        {
          id: nextMessageId("error"),
          role: "assistant",
          content: fallback,
        },
      ]);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
        inputRef.current?.focus();
      }
    }
  }

  function handleMetricSelect(metricId: string) {
    const metric = METRIC_CATALOG.find((item) => item.id === metricId);
    if (metric) void sendMessage(`Show me ${metric.name} trend`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function refreshDashboard() {
    requestRef.current?.abort();
    requestRef.current = null;
    localStorage.removeItem(storageKey);
    setIsLoading(false);
    setInput("");
    setSessionMessages([WELCOME_MESSAGE]);
    inputRef.current?.focus();
  }

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed.");
      window.location.assign("/login");
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f6f5f1]">
      <MetricSidebar
        activeId={activeResult?.metricId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleMetricSelect}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-controls="metric-catalog"
              aria-expanded={sidebarOpen}
              aria-label="Open metric catalog"
              className="h-8 w-8 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-200">
                <Zap className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold leading-none tracking-tight text-zinc-900">
                  MetricMind
                </h1>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Ask · explore · decide
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="max-w-32 truncate border-zinc-200 text-[10px] text-zinc-600"
              title={`Signed in as ${user.username}`}
            >
              @{user.username}
            </Badge>
            <Badge
              variant="secondary"
              className="hidden border-amber-200 bg-amber-50 text-[10px] text-amber-800 hover:bg-amber-50 sm:inline-flex"
            >
              Demo data
            </Badge>
            <Badge
              variant="secondary"
              className="hidden border-zinc-200 bg-zinc-100 text-[10px] text-zinc-600 hover:bg-zinc-100 sm:inline-flex"
            >
              {METRIC_CATALOG.length} metrics defined
            </Badge>
            <Button
              type="button"
              variant="ghost"
              aria-label="Refresh dashboard and clear current questions"
              title="Refresh dashboard and start fresh"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-500 hover:bg-orange-50 hover:text-orange-700"
              onClick={refreshDashboard}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              title="Sign out"
              disabled={isLoggingOut}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-700"
              onClick={() => void logout()}
            >
              {isLoggingOut ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </header>

        <KpiCards
          activeId={activeResult?.metricId}
          onSelect={handleMetricSelect}
        />

        <main className="flex min-h-0 flex-1 overflow-hidden">
          <section
            aria-label="MetricMind conversation"
            className="flex min-h-0 w-full flex-col border-r border-zinc-200/70 bg-[#faf9f6] lg:w-[55%]"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="space-y-4 p-4 sm:p-6"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
                        <Bot className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[82%] ${
                        message.role === "user"
                          ? "rounded-br-md bg-gradient-to-br from-zinc-900 to-zinc-800 text-white shadow-md shadow-zinc-200"
                          : "rounded-bl-md border border-zinc-200/80 bg-white text-zinc-800 shadow-sm"
                      }`}
                    >
                      {message.isLoading ? (
                        <div
                          role="status"
                          className="flex items-center gap-2 text-zinc-500"
                        >
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Analyzing demo metric data…
                        </div>
                      ) : (
                        <div className="prose prose-sm prose-zinc max-w-none prose-headings:mb-2 prose-headings:mt-0 prose-headings:text-zinc-900 prose-p:my-2 prose-li:my-0.5 prose-blockquote:border-orange-300 prose-blockquote:bg-orange-50/60 prose-blockquote:px-3 prose-blockquote:py-1 prose-blockquote:not-italic">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}

                      {message.followUps?.length && !message.isLoading ? (
                        <div className="mt-3 border-t border-zinc-200/60 pt-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                            Continue exploring
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.followUps.map((followUp) => (
                              <button
                                type="button"
                                key={followUp}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => void sendMessage(followUp)}
                              >
                                {followUp}
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>
            </ScrollArea>

            {messages.length <= 2 && (
              <QuestionLaunchpad
                disabled={isLoading}
                onSelect={(question) => void sendMessage(question)}
              />
            )}

            <div className="shrink-0 border-t border-zinc-200/70 bg-white/95 p-3 backdrop-blur sm:p-4">
              <form
                className="flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 shadow-inner"
                onSubmit={handleSubmit}
              >
                <label htmlFor="metric-question" className="sr-only">
                  Ask a business question
                </label>
                <Input
                  id="metric-question"
                  ref={inputRef}
                  value={input}
                  maxLength={MAX_MESSAGE_LENGTH}
                  autoComplete="off"
                  placeholder="Ask about revenue, customers, margins…"
                  disabled={isLoading}
                  className="h-10 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                  onChange={(event) => setInput(event.target.value)}
                />
                <Button
                  type="submit"
                  aria-label="Send question"
                  disabled={isLoading || !input.trim()}
                  className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-white shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-1.5 text-center text-[9px] text-zinc-400">
                Answers use deterministic demo data · press Enter to send
              </p>
            </div>
          </section>

          <aside
            ref={visualizationRef}
            aria-label="Metric visualization"
            className="hidden w-[45%] flex-col gap-3 overflow-y-auto bg-gradient-to-b from-zinc-50 to-orange-50/20 p-4 lg:flex"
          >
            {activeMetric && activeResult && (
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-xs text-zinc-500 shadow-sm">
                <Badge
                  variant="outline"
                  className="border-orange-200 bg-orange-50 font-mono text-[10px] text-orange-700"
                >
                  {activeMetric.id}
                </Badge>
                <span className="font-medium text-zinc-700">
                  {activeMetric.name}
                </span>
                <span aria-hidden="true" className="text-zinc-300">
                  ·
                </span>
                <span className="truncate text-[10px] text-amber-700">
                  Demo · {activeResult.source.period}
                </span>
              </div>
            )}

            <ChartPanel config={activeChart} />
            {activeResult && <DataTable result={activeResult} />}

            {activeMetric && activeResult && (
              <section className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-4 text-xs shadow-sm">
                <h2 className="mb-2 font-bold text-zinc-800">
                  Metric definition
                </h2>
                <div className="grid grid-cols-2 gap-2 text-zinc-600">
                  <div>
                    <span className="text-zinc-400">Category:</span>{" "}
                    {activeMetric.category}
                  </div>
                  <div>
                    <span className="text-zinc-400">Unit:</span>{" "}
                    {activeMetric.unit}
                  </div>
                  <div>
                    <span className="text-zinc-400">Demo cube:</span>{" "}
                    {activeMetric.cube}
                  </div>
                  <div>
                    <span className="text-zinc-400">Dimensions:</span>{" "}
                    {activeMetric.dimensions.join(", ")}
                  </div>
                </div>
                <p className="mt-2 leading-relaxed text-zinc-500">
                  {activeMetric.description}
                </p>
                <p className="mt-2 border-t border-zinc-100 pt-2 text-[10px] text-zinc-400">
                  <ShieldCheck className="mr-1 inline h-3 w-3" />
                  Defined locally for this prototype; connect a real semantic API
                  before production use.
                </p>
              </section>
            )}
          </aside>
        </main>

        {activeResult && (
          <section className="max-h-[44vh] shrink-0 space-y-3 overflow-y-auto border-t border-zinc-200 bg-zinc-50 p-3 lg:hidden">
            <ChartPanel config={activeChart} />
            <DataTable result={activeResult} />
          </section>
        )}
      </div>
    </div>
  );
}
