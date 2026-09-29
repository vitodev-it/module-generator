"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [webhook, setWebhook] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("n8n_webhook") || ""
      : ""
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem("n8n_webhook", webhook);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl space-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0A0A0B]">Settings</h1>
        <p className="mt-1 text-sm text-[#666666]">
          Configure global preferences
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-[#0A0A0B]">
            n8n Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-4">
          <div className="space-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <p className="mb-2 text-xs text-[#666666]">
              POST endpoint for triggering module generation
            </p>
            <div className="flex gap-2">
              <Input
                id="webhook"
                placeholder="https://your-n8n-instance/webhook/..."
                value={webhook}
                onChange={(e) => {
                  setWebhook(e.target.value);
                  setSaved(false);
                }}
              />
              <Button onClick={handleSave} variant={saved ? "secondary" : "default"}>
                <Save className="mr-1 h-4 w-4" />
                {saved ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#0A0A0B]">
            Supabase Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#666666]">
            Configure your Supabase project URL and anon key via environment
            variables:
          </p>
          <pre className="mt-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs text-[#666666]">
            NEXT_PUBLIC_SUPABASE_URL=your_project_url
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
