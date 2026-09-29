"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVELS, N8N_WEBHOOK_URL } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2 } from "lucide-react";

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    topic: string;
    level: string;
    audience: string;
    duration: string;
    durationUnit: "hours" | "days";
    outlineModel: string;
    contentModel: string;
    researchTavily: boolean;
    researchArxiv: boolean;
  }>({
    topic: "",
    level: "",
    audience: "",
    duration: "",
    durationUnit: "hours",
    outlineModel: "gpt-4o-mini",
    contentModel: "gpt-4o-mini",
    researchTavily: true,
    researchArxiv: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic || !form.level || !form.audience || !form.duration) return;
    setLoading(true);

    try {
      // Create module entry
      const { data } = await supabaseClient
        .from("modules")
        .insert({
          topic: form.topic,
          level: form.level,
          audience: form.audience,
          duration: `${form.duration} ${form.durationUnit}`,
          outline_model: form.outlineModel,
          content_model: form.contentModel,
          status: "ongoing",
        })
        .select()
        .single();

      if (!data) throw new Error("Failed to create module");

      // Trigger async generation via backend API
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          level: form.level,
          audience: form.audience,
          duration: `${form.duration} ${form.durationUnit}`,
          outlineModel: form.outlineModel,
          contentModel: form.contentModel,
          moduleId: data.id,
        }),
      }).catch((err) => console.error("Generation error:", err));

      // Navigate to status page immediately
      router.push(`/modules/${data.id}/status`);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0A0A0B]">Create Module</h1>
        <p className="mt-1 text-sm text-[#666666]">
          Configure your training module parameters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#0A0A0B] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0A0A0B]" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Prompt Engineering for LLM"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm({ ...form, level: v })}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g. Backend Engineer"
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  placeholder="2"
                  className="max-w-[120px]"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  required
                />
                <Select
                  value={form.durationUnit}
                  onValueChange={(v) =>
                    setForm({ ...form, durationUnit: v as "hours" | "days" })
                  }
                >
                  <SelectTrigger className="max-w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Models */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#0A0A0B] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0A0A0B]" />
              AI Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="outlineModel">Outline Model</Label>
                <Select
                  value={form.outlineModel}
                  onValueChange={(v) =>
                    setForm({ ...form, outlineModel: v })
                  }
                >
                  <SelectTrigger id="outlineModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentModel">Content Model</Label>
                <Select
                  value={form.contentModel}
                  onValueChange={(v) =>
                    setForm({ ...form, contentModel: v })
                  }
                >
                  <SelectTrigger id="contentModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#0A0A0B] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0A0A0B]" />
              Research Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tavily">Tavily Web Search</Label>
                <p className="text-xs text-[#666666]">
                  Search the web for current sources
                </p>
              </div>
              <Switch
                id="tavily"
                checked={form.researchTavily}
                onCheckedChange={(v) =>
                  setForm({ ...form, researchTavily: v })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="arxiv">arXiv Academic Search</Label>
                <p className="text-xs text-[#666666]">
                  Search academic papers
                </p>
              </div>
              <Switch
                id="arxiv"
                checked={form.researchArxiv}
                onCheckedChange={(v) =>
                  setForm({ ...form, researchArxiv: v })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Module"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Inline supabase client import to avoid circular deps
import { createClient } from "@supabase/supabase-js";
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);
