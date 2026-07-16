"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import ChartPanel from "./chart-panel";
import DataTable from "./data-table";
import MetricSidebar from "./metric-sidebar";
import KpiCards from "./kpi-cards";
import type { ChartConfig, MetricDefinition, MetricResult } from "@/lib/metricmind/semantic-layer";

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

const SUGGESTED_QUERIES = [
  "Why did margins drop last quarter?",
  "Show me total revenue trend",
  "Break down revenue by region",
  "What is the customer churn rate?",
  "Show ARPU by customer tier",
  "List all available metrics",
];

const STORAGE_KEY = "metricmind_messages";

function loadSavedMessages(): Message[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    const toSave = messages.filter((m) => !m.isLoading);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

export default function MetricMindApp() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = loadSavedMessages();
    if (saved) return saved;
    return [
      {
        id: "welcome",
        role: "assistant",
        content: `## Welcome to **MetricMind**\n\nI am your Agentic Semantic BI Assistant. I query **governed metrics** from the Semantic Layer — not raw SQL — ensuring every number is consistent with official financial reports.\n\n**Try asking me:**`,
        followUps: SUGGESTED_QUERIES.slice(0, 4),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartConfig | null>(null);
  const [activeMetricResult, setActiveMetricResult] = useState<MetricResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = text.trim();
    setInput("");
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMsg,
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        chartConfig: data.metricResult?.chartConfig,
        metricDef: data.metricDef,
        metricResult: data.metricResult,
        followUps: data.suggestedFollowUps,
      };

      if (data.metricResult?.chartConfig) {
        setActiveChart(data.metricResult.chartConfig);
        setActiveMetricResult(data.metricResult);
      }

      setMessages((prev) => [...prev.filter((m) => !m.isLoading), assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error processing your query. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleMetricSelect = (metric: MetricDefinition) => {
    sendMessage(`Show me ${metric.name} trend`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && !m.isLoading);

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `## Welcome to **MetricMind**\n\nI am your Agentic Semantic BI Assistant. I query **governed metrics** from the Semantic Layer.\n\n**Try asking me:**`,
        followUps: SUGGESTED_QUERIES.slice(0, 4),
      },
    ]);
    setActiveChart(null);
    setActiveMetricResult(null);
  };

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden">
      {/* ─── Metric Sidebar ─── */}
      <MetricSidebar
        onSelectMetric={handleMetricSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Header ─── */}
        <header className="border-b border-zinc-200 bg-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-zinc-900 leading-none">MetricMind</h1>
                <p className="text-[11px] text-zinc-400 mt-0.5">Agentic Semantic BI Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Semantic Layer Active
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hidden sm:inline-flex">
              15 Metrics Governed
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-600"
              onClick={clearChat}
              title="Clear conversation"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </header>

        {/* ─── KPI Cards ─── */}
        <KpiCards />

        {/* ─── Content: Chat + Chart Split ─── */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Chat Panel */}
          <div className="w-full lg:w-[55%] flex flex-col border-r border-zinc-100 min-h-0">
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="p-4 sm:p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-zinc-900 text-white rounded-br-md"
                          : "bg-zinc-50 text-zinc-800 rounded-bl-md border border-zinc-100"
                      } ${msg.isLoading ? "animate-pulse" : ""}`}
                    >
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2 text-zinc-500">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Querying Semantic Layer with AI analysis...
                        </div>
                      ) : (
                        <div className="prose prose-sm prose-zinc max-w-none prose-headings:mb-1 prose-headings:mt-2 prose-p:my-1 prose-strong:text-zinc-900 prose-code:bg-zinc-200/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-orange-400 prose-blockquote:text-zinc-600">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {msg.followUps && msg.followUps.length > 0 && msg.role === "assistant" && !msg.isLoading && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/60">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-2">Suggested Follow-ups</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, i) => (
                              <button
                                key={i}
                                onClick={() => !isLoading && sendMessage(fu)}
                                disabled={isLoading}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Query Suggestions (when few messages) */}
            {messages.length <= 2 && (
              <div className="px-4 sm:px-6 pb-2 shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-2">Quick Queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-zinc-100 bg-white shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a business question... e.g. Why did margins drop?"
                  disabled={isLoading}
                  className="flex-1 h-10 rounded-xl bg-zinc-50 border-zinc-200 text-sm focus-visible:ring-orange-400 focus-visible:border-orange-400"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </Button>
              </form>
            </div>
          </div>

          {/* ─── Right Panel (Desktop): Chart + Table + Info ─── */}
          <div className="hidden lg:flex flex-col w-[45%] p-4 gap-3 bg-zinc-50/30 overflow-y-auto">
            {/* Metric Info Bar */}
            {activeChart && lastAssistantMsg?.metricDef && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white rounded-lg px-3 py-2 border border-zinc-100 shrink-0">
                <Badge variant="outline" className="text-[10px] font-mono">{lastAssistantMsg.metricDef.id}</Badge>
                <span className="font-medium text-zinc-700">{lastAssistantMsg.metricDef.name}</span>
                <span className="text-zinc-400">|</span>
                <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono truncate">
                  {lastAssistantMsg.metricDef.formula}
                </code>
              </div>
            )}

            {/* Chart */}
            <ChartPanel config={activeChart} />

            {/* Data Table */}
            {activeMetricResult && (
              <DataTable result={activeMetricResult} />
            )}

            {/* Metric Definition Card */}
            {lastAssistantMsg?.metricDef && (
              <div className="bg-white rounded-xl border border-zinc-100 p-4 text-xs shrink-0">
                <h4 className="font-semibold text-zinc-800 mb-2">Metric Governance</h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-600">
                  <div><span className="text-zinc-400">Category:</span> {lastAssistantMsg.metricDef.category}</div>
                  <div><span className="text-zinc-400">Unit:</span> {lastAssistantMsg.metricDef.unit}</div>
                  <div><span className="text-zinc-400">Cube:</span> {lastAssistantMsg.metricDef.cube}</div>
                  <div><span className="text-zinc-400">Dimensions:</span> {lastAssistantMsg.metricDef.dimensions.join(", ")}</div>
                </div>
                <p className="mt-2 text-zinc-500 leading-relaxed">{lastAssistantMsg.metricDef.description}</p>
                <div className="mt-2 pt-2 border-t border-zinc-50">
                  <p className="text-[10px] text-zinc-400">
                    <svg className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Governed by Semantic Layer — single source of truth
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mobile Chart (below chat on small screens) ─── */}
        <div className="lg:hidden border-t border-zinc-100 bg-white p-3 shrink-0 max-h-[40vh] overflow-y-auto">
          <ChartPanel config={activeChart} />
          {activeMetricResult && <DataTable result={activeMetricResult} />}
        </div>
      </div>
    </div>
  );
}