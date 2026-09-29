"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LEVELS } from "@/lib/constants";
import {
  Loader2, CheckCircle2, XCircle, Send, ExternalLink, BookOpen,
} from "lucide-react";

interface LogEntry {
  type: "active" | "done" | "error";
  message: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Source {
  id: string;
  section_id: string;
  title: string;
  url: string;
  type: "web" | "academic";
}

const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold text-[#0A0A0B] tracking-tight mb-6 mt-0">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-semibold text-[#0A0A0B] tracking-tight mb-4 mt-8 pb-1 border-b border-[#EAEAEA]">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-medium text-[#0A0A0B] mt-6 mb-3">{children}</h3>
  ),
  p: ({ children }: any) => (
    <p className="text-sm leading-[1.75] text-[#333] mb-4">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-4 space-y-1.5">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-4 space-y-1.5 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm leading-[1.75] text-[#333] pl-1 marker:text-[#999]">{children}</li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-[#0A0A0B]">{children}</strong>
  ),
  code: ({ children, className }: any) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-[#F6F6F6] px-1.5 py-0.5 text-xs font-mono text-[#0A0A0B] border border-[#EAEAEA]">
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-4 overflow-x-auto rounded-lg border border-[#EAEAEA] bg-[#F6F6F6] p-4 text-sm leading-relaxed">
        <code className="text-[#0A0A0B] font-mono text-xs">{children}</code>
      </pre>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote className="mb-4 border-l-2 border-[#0A0A0B] pl-4 italic text-[#666]">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0070F3] underline underline-offset-2 hover:text-[#005CC8]">
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-[#EAEAEA]" />,
};

export default function WorkspacePage() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pct, setPct] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<"idle" | "generating" | "complete" | "failed">("idle");
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevLogsLen = useRef(0);

  useEffect(() => {
    if (logs.length > prevLogsLen.current) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLogsLen.current = logs.length;
  }, [logs]);

  useEffect(() => {
    if (!moduleId || status !== "generating") return;

    const interval = setInterval(async () => {
      const { data: mod } = await supabase
        .from("modules")
        .select("status, progress, error")
        .eq("id", moduleId)
        .single();

      if (!mod) return;
      const prog = mod.progress as any;

      if (prog?.message) {
        const exists = logs.find((l) => l.message === prog.message);
        if (!exists) {
          setLogs((prev) => {
            const updated = prev.map((l) =>
              l.type === "active" ? { ...l, type: "done" as const } : l
            );
            const t = prog.step === "error" ? "error" : "active";
            return [...updated, { type: t as any, message: prog.message }];
          });
        }
        setPct(prog.pct || 0);
      }

      const { data: secs } = await supabase
        .from("sections")
        .select("id, title, content")
        .eq("module_id", moduleId)
        .order("sort_order");

      if (secs) setSections(secs as Section[]);

      if (mod.status === "complete") {
        setStatus("complete");
        setLogs((prev) => [
          ...prev.map((l) => (l.type === "active" ? { ...l, type: "done" as const } : l)),
          { type: "done", message: "Module generated successfully!" },
        ]);
        setPct(100);
        clearInterval(interval);
      } else if (mod.status === "failed") {
        setStatus("failed");
        setLogs((prev) => [
          ...prev.map((l) => (l.type === "active" ? { ...l, type: "done" as const } : l)),
          { type: "error", message: mod.error || "Generation failed" },
        ]);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [moduleId, status]);

  async function handleGenerate() {
    if (!topic || !level || !audience || !duration) return;
    setLoading(true);
    setLogs([]);
    setSections([]);
    setPct(0);
    setStatus("generating");

    try {
      const { data: mod, error } = await supabase
        .from("modules")
        .insert({ topic, level, audience, duration: `${duration}h`, status: "ongoing" })
        .select()
        .single();

      if (error || !mod) throw new Error(error?.message || "Failed to create module");
      setModuleId(mod.id);

      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, audience, duration: `${duration}h`, moduleId: mod.id }),
      }).catch((err) => console.error("Generate error:", err));

    } catch (err: any) {
      setStatus("failed");
      setLogs([{ type: "error", message: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  const inputDisabled = status === "generating";

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* LEFT — Form + Log */}
      <div className="flex w-[380px] shrink-0 flex-col gap-3 overflow-y-auto pr-2">
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
          <div className="space-y-2.5">
            <Input
              placeholder="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={inputDisabled}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={level} onValueChange={setLevel} disabled={inputDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={inputDisabled}
              />
            </div>
            <Input
              type="number"
              placeholder="Duration (hours)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={inputDisabled}
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || inputDisabled || !topic || !level || !audience || !duration}
              className="w-full"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
              : inputDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              : <><Send className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </div>

        {status === "generating" && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#EAEAEA]">
            <div className="h-full rounded-full bg-[#0A0A0B] transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
        )}

        {status === "complete" && (
          <div className="flex items-center gap-2 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
            <span className="text-sm font-medium text-[#22C55E]">Complete!</span>
          </div>
        )}

        {status === "failed" && (
          <div className="flex items-center gap-2 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-2.5">
            <XCircle className="h-4 w-4 text-[#EF4444]" />
            <span className="text-sm font-medium text-[#EF4444]">Failed</span>
          </div>
        )}

        {(logs.length > 0 || status !== "idle") && (
          <div className="flex-1 rounded-xl border border-[#EAEAEA] bg-white p-4 overflow-y-auto min-h-[120px]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#999]">Log</p>
            <div className="space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  {log.type === "active" ? (
                    <Loader2 className="mt-0.5 h-3 w-3 shrink-0 animate-spin text-[#0A0A0B]" />
                  ) : log.type === "done" ? (
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#22C55E]" />
                  ) : (
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-[#EF4444]" />
                  )}
                  <span className={log.type === "active" ? "text-[#333] font-medium" : log.type === "done" ? "text-[#22C55E]" : "text-[#EF4444]"}>
                    {log.message}
                  </span>
                </div>
              ))}
              {status === "generating" && (
                <div className="flex items-center gap-2 text-xs text-[#999] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0B]" />
                  Processing...
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Preview */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[#EAEAEA] bg-white">
        {status === "idle" && (
          <div className="flex h-full items-center justify-center px-8">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F6F6]">
                <Send className="h-5 w-5 text-[#999]" />
              </div>
              <h3 className="text-base font-semibold text-[#0A0A0B]">Module Preview</h3>
              <p className="mt-1 text-sm text-[#666] leading-relaxed">
                Fill in the topic and click <span className="font-medium text-[#0A0A0B]">Generate</span> to build your training module. Content will appear here in real-time.
              </p>
            </div>
          </div>
        )}

        {status === "generating" && sections.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#999]" />
              <p className="text-sm text-[#666]">Waiting for content...</p>
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <div className="mx-auto max-w-3xl px-10 py-10">
            <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0B]">{topic}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#F6F6F6] px-2 py-0.5 text-xs font-medium text-[#666]">{level}</span>
              <span className="rounded-md bg-[#F6F6F6] px-2 py-0.5 text-xs font-medium text-[#666]">{audience}</span>
              <span className="rounded-md bg-[#F6F6F6] px-2 py-0.5 text-xs font-medium text-[#666]">{duration}h</span>
            </div>

            <hr className="my-8 border-[#EAEAEA]" />

            {sections.map((sec, i) => (
              <div key={sec.id} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F6F6F6] text-xs font-medium text-[#999]">
                    {i + 1}
                  </span>
                  <h2 className="text-xl font-semibold tracking-tight text-[#0A0A0B]">{sec.title}</h2>
                  {status === "generating" && !sec.content && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#999]" />
                  )}
                </div>

                {sec.content ? (
                  <div className="pl-9">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {sec.content}
                    </ReactMarkdown>
                  </div>
                ) : status === "generating" ? (
                  <div className="ml-9 space-y-2 animate-pulse">
                    <div className="h-3 w-full rounded bg-[#EAEAEA]" />
                    <div className="h-3 w-3/4 rounded bg-[#EAEAEA]" />
                    <div className="h-3 w-5/6 rounded bg-[#EAEAEA]" />
                  </div>
                ) : (
                  <p className="ml-9 text-sm italic text-[#999]">No content available</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
