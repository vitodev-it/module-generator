"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Module } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Mic,
} from "lucide-react";

export default function SlidesPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data: mod } = await supabase
        .from("modules")
        .select("*")
        .eq("id", params.id)
        .single();

      if (mod) {
        const m = mod as Module;
        setModule(m);
        if (m.slides_json?.slides) {
          setSlides(m.slides_json.slides);
        }
      }
    }
    fetch();
  }, [params.id]);

  function downloadMarkdown() {
    if (!module?.markdown_content) return;
    const blob = new Blob([module.markdown_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.topic.replace(/\s+/g, "_")}_module.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!module) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A0A0B] border-t-transparent" />
      </div>
    );
  }

  if (slides.length === 0 && !module.markdown_content) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <EmptyState
          title="No slides available"
          description="Generate module content first in the review page."
          action={
            <Button onClick={() => router.push(`/modules/${params.id}/review`)}>
              Go to Review
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#0A0A0B]">
              {module.topic} — Slides
            </h1>
            <p className="text-xs text-[#666666]">
              {slides.length > 0
                ? `${slides.length} slides`
                : "Markdown document"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadMarkdown}>
            <FileText className="mr-1 h-3 w-3" />
            Download .md
          </Button>
        </div>
      </div>

      {/* Slides carousel */}
      {slides.length > 0 ? (
        <Card>
          <CardContent className="p-8">
            {/* Slide counter */}
            <div className="mb-6 flex items-center justify-between">
              <Badge variant="gold" className="text-xs">
                Slide {currentSlide + 1} of {slides.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentSlide === slides.length - 1}
                  onClick={() => setCurrentSlide((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Slide content */}
            <div className="min-h-[300px]">
              <h2 className="mb-4 text-xl font-bold text-[#0A0A0B]">
                {slides[currentSlide].title}
              </h2>

              {slides[currentSlide].paragraph && (
                <p className="mb-4 text-[#0A0A0B] leading-relaxed">
                  {slides[currentSlide].paragraph}
                </p>
              )}

              {slides[currentSlide].bullets &&
                slides[currentSlide].bullets.length > 0 && (
                  <ul className="mb-4 space-y-2">
                    {slides[currentSlide].bullets.map(
                      (b: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[#0A0A0B]"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A0A0B]" />
                          {b}
                        </li>
                      )
                    )}
                  </ul>
                )}

              {slides[currentSlide].code && (
                <pre className="overflow-x-auto rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4">
                  <code className="text-sm text-[#0A0A0B]">
                    {slides[currentSlide].code.snippet}
                  </code>
                </pre>
              )}

              {slides[currentSlide].notes && (
                <div className="mt-6 border-t border-[#EAEAEA] pt-4">
                  <div className="flex items-center gap-2 text-xs text-[#666666] mb-2">
                    <Mic className="h-3 w-3" />
                    Speaker Notes
                  </div>
                  <p className="text-sm italic text-[#666666]">
                    {slides[currentSlide].notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Markdown view if no structured slides */
        <Card>
          <CardContent className="p-6">
            <pre className="whitespace-pre-wrap text-sm text-[#0A0A0B] font-mono leading-relaxed">
              {module.markdown_content}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
