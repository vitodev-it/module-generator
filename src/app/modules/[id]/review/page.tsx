"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Module, Section } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data: mod } = await supabase
        .from("modules")
        .select("*")
        .eq("id", params.id)
        .single();

      const { data: secs } = await supabase
        .from("sections")
        .select("*")
        .eq("module_id", params.id)
        .order("sort_order", { ascending: true });

      if (mod) setModule(mod as Module);
      if (secs) {
        setSections(secs as Section[]);
        if ((secs as Section[]).length > 0) {
          setEditedContent((secs as Section[])[0].content || "");
        }
      }
    }
    fetch();
  }, [params.id]);

  useEffect(() => {
    if (sections[activeSection]) {
      setEditedContent(sections[activeSection].content || "");
    }
  }, [activeSection, sections]);

  async function handleSave() {
    if (!sections[activeSection]) return;
    setSaving(true);
    await supabase
      .from("sections")
      .update({ content: editedContent, updated_at: new Date().toISOString() })
      .eq("id", sections[activeSection].id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!module) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A0A0B] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/modules")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#0A0A0B]">{module.topic}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={module.status} />
              <span className="text-xs text-[#666666]">{module.level}</span>
              <span className="text-xs text-[#666666]">·</span>
              <span className="text-xs text-[#666666]">{module.audience}</span>
              <span className="text-xs text-[#666666]">·</span>
              <span className="text-xs text-[#666666]">{module.duration}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/modules/${params.id}/slides`)}
          >
            View Slides
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Outline accordion */}
        <div className="w-80 shrink-0">
          <Card>
            <CardContent className="p-3">
              <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[#666666]">
                Sections ({sections.length})
              </p>
              <div className="space-y-1">
                {sections.map((sec, i) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(i)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      i === activeSection
                        ? "border-l-2 border-[#0A0A0B] bg-[#0A0A0B]/10 text-[#0A0A0B]"
                        : "text-[#666666] hover:bg-[#F6F6F6] hover:text-[#0A0A0B]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{sec.title}</span>
                      {sec.section_failed && (
                        <AlertCircle className="h-3 w-3 shrink-0 text-[#EF4444]" />
                      )}
                    </div>
                    {sec.sources && sec.sources.length > 0 && (
                      <span className="text-xs text-[#999999]">
                        {sec.sources.length} sources
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Content editor */}
        <div className="flex-1">
          {sections[activeSection] ? (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0A0A0B]">
                      {sections[activeSection].title}
                    </h2>
                    {sections[activeSection].section_failed && (
                      <Badge variant="destructive" className="mt-1">
                        Generation failed — manual content
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant={saved ? "secondary" : "default"}
                    size="sm"
                  >
                    {saving ? (
                      "Saving..."
                    ) : saved ? (
                      <>
                        <Save className="mr-1 h-3 w-3" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-1 h-3 w-3" />
                        Save
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={editedContent}
                  onChange={(e) => {
                    setEditedContent(e.target.value);
                    setSaved(false);
                  }}
                  className="min-h-[400px] font-mono text-sm leading-relaxed"
                  placeholder="Edit section content in markdown..."
                />

                {/* Sources */}
                {sections[activeSection].sources &&
                  sections[activeSection].sources!.length > 0 && (
                    <div className="mt-4 border-t border-[#EAEAEA] pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#666666]">
                        Sources
                      </p>
                      <div className="space-y-1">
                        {sections[activeSection].sources!.map((s, i) => (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#0A0A0B] hover:text-[#333333]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            [{i + 1}] {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-sm text-[#666666]">
                  No sections available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
