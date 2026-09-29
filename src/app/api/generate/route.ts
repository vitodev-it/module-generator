import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUMOPOD_KEY = "sk-GX_uyZyhVPV1gzV35Q995A";
const SUMOPOD_URL = "https://ai.sumopod.com/v1/chat/completions";
const TAVILY_KEY = "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";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

interface Section {
  title: string;
  learning_objectives: string[];
  key_concepts: string[];
}

interface Source {
  title: string;
  url: string;
  type: "web" | "academic";
}

async function callAI(model: string, messages: any[], maxTokens = 2000) {
  const res = await fetch(SUMOPOD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUMOPOD_KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(raw: string) {
  try {
    return JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch { return null; }
}

async function tavilySearch(query: string): Promise<Source[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY, query, search_depth: "advanced",
        include_domains: ["arxiv.org","distill.pub","openai.com","paperswithcode.com","nature.com","*.edu","docs.python.org","developer.mozilla.org","geeksforgeeks.org","w3schools.com"],
        max_results: 4,
      }),
    });
    const data = await res.json();
    return (data.results || []).map((r: any) => ({ title: r.title, url: r.url, type: "web" }));
  } catch { return []; }
}

async function arxivSearch(query: string): Promise<Source[]> {
  try {
    const res = await fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=3`, {
      headers: { "Accept": "application/xml" },
    });
    const xml = await res.text();
    const titles = Array.from(xml.matchAll(/<title>([^<]+)<\/title>/g)).slice(1);
    const ids = Array.from(xml.matchAll(/<id>([^<]+)<\/id>/g)).slice(1);
    return titles.map((t, i) => ({ title: t[1].trim(), url: ids[i]?.[1] || "", type: "academic" }));
  } catch { return []; }
}

async function setProgress(supabase: any, moduleId: string, progress: any) {
  await supabase.from("modules").update({ progress }).eq("id", moduleId);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await req.json();
    const { topic, level, audience, duration, outlineModel, contentModel, moduleId } = body;
    if (!topic || !level || !audience || !duration || !moduleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate outline
    await setProgress(supabase, moduleId, { step: "outline", message: "Generating outline...", pct: 5 });
    const outlineRaw = await callAI(outlineModel || "gpt-4o-mini", [
      { role: "user", content: `You are an instructional designer. Break '${topic}' into a logical module outline for ${level} audience of ${audience}, fitting ${duration}. Return ONLY JSON: {"sections": [{"title": string, "learning_objectives": [string], "key_concepts": [string]}]}` }
    ], 1500);

    const sections: Section[] = parseJSON(outlineRaw)?.sections || [];
    if (sections.length === 0) {
      await supabase.from("modules").update({ status: "failed", error: "Failed to generate outline" }).eq("id", moduleId);
      return NextResponse.json({ error: "Outline generation failed" }, { status: 500 });
    }

    await supabase.from("modules").update({ outline_json: { sections } }).eq("id", moduleId);
    await setProgress(supabase, moduleId, { step: "research", message: `Outline done — ${sections.length} sections. Researching sources...`, pct: 15, sectionsTotal: sections.length, sectionsDone: 0 });

    // 2. Research + generate content per section
    const sectionRecords: any[] = [];
    let allSources: { sectionIdx: number; sectionTitle: string; sources: Source[] }[] = [];

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      await setProgress(supabase, moduleId, {
        step: "research", message: `Section ${i + 1}/${sections.length}: "${sec.title}" — searching sources...`,
        pct: 15 + Math.round(30 * (i / sections.length)), sectionsTotal: sections.length, sectionsDone: i, currentSection: sec.title,
      });

      // Research
      const [tavily, arxiv] = await Promise.all([tavilySearch(`${topic} ${sec.title}`), arxivSearch(sec.title)]);
      const merged = [...tavily, ...arxiv];
      const seen = new Set<string>();
      const sources = merged.filter(s => s.url && !seen.has(s.url) && seen.add(s.url)).slice(0, 6);
      allSources.push({ sectionIdx: i, sectionTitle: sec.title, sources });

      // Save sources to DB
      for (const src of sources) {
        await supabase.from("sources").insert({
          section_id: "00000000-0000-0000-0000-000000000000", // placeholder, updated after section insert
          module_id: moduleId, title: src.title, url: src.url, type: src.type,
        });
      }

      await setProgress(supabase, moduleId, {
        step: "content", message: `Section ${i + 1}/${sections.length}: "${sec.title}" — generating content with citations...`,
        pct: 45 + Math.round(40 * (i / sections.length)), sectionsTotal: sections.length, sectionsDone: i, currentSection: sec.title,
      });

      // Generate content WITH sources
      const otherTitles = sections.filter((_, j) => j !== i).map(s => s.title).join(", ");
      const sourcesBlock = sources.length
        ? `Use ONLY facts from these sources. Cite with [1], [2] etc matching position.\nSOURCES:\n${sources.map((s, si) => `[${si + 1}] ${s.title} — ${s.url}`).join("\n")}`
        : "No external sources found. Write based on general knowledge.";

      const contentRaw = await callAI(contentModel || "gpt-4o-mini", [
        { role: "user", content: `Write training content for section "${sec.title}" of a ${level} module on '${topic}' for ${audience}. Objectives: ${JSON.stringify(sec.learning_objectives)}. Do NOT repeat other sections: ${otherTitles}. ${sourcesBlock}. Return ONLY valid JSON: {"content": string (markdown with [N] citations where used), "citations_used": [array of citation numbers used]}` }
      ], 2500);

      const parsed = parseJSON(contentRaw);
      const content = parsed?.content || "_Content unavailable_";
      const citationsUsed = parsed?.citations_used || [];

      const hasSources = sources.length > 0;

      const { data: rec } = await supabase.from("sections").insert({
        module_id: moduleId, title: sec.title, content,
        learning_objectives: sec.learning_objectives, key_concepts: sec.key_concepts,
        sort_order: i, section_failed: !parsed?.content,
        citations_used: citationsUsed, has_sources: hasSources,
      }).select().single();

      if (rec) {
        sectionRecords.push(rec);
        // Update source records with actual section_id
        if (sources.length > 0) {
          const srcInserts = sources.map(s => supabase.from("sources").insert({
            section_id: rec.id, module_id: moduleId, title: s.title, url: s.url, type: s.type,
          }));
          // Delete the placeholder-inserted ones and insert properly
          await supabase.from("sources").delete().eq("module_id", moduleId).is("section_id", "00000000-0000-0000-0000-000000000000");
          await Promise.all(srcInserts);
        }
      }
    }

    await setProgress(supabase, moduleId, { step: "slides", message: "Building slides and closing summary...", pct: 85, sectionsTotal: sections.length, sectionsDone: sections.length });

    // 3. Build compiled markdown with references
    let md = `# ${topic}\n\n**Level:** ${level}  \n**Audience:** ${audience}  \n**Duration:** ${duration}\n\n---\n\n`;
    for (const sec of sectionRecords) md += `## ${sec.title}\n\n${sec.content || ""}\n\n`;

    // Append references section
    const allMergedSources = allSources.flatMap(s => s.sources);
    const seenRefs = new Set<string>();
    const uniqueRefs = allMergedSources.filter(s => s.url && !seenRefs.has(s.url) && seenRefs.add(s.url));
    if (uniqueRefs.length > 0) {
      md += `## References\n\n`;
      uniqueRefs.forEach((s, i) => { md += `${i + 1}. ${s.title} — ${s.url}\n\n`; });
    }

    // 4. Closing summary
    const closeRaw = await callAI(contentModel || "gpt-4o-mini", [
      { role: "user", content: `Write ONE closing summary slide for "${topic}" (${level}, ${audience}). Sections: ${sections.map(s => s.title).join(", ")}. Return JSON: {"title": string, "paragraph": string, "bullets": [string], "notes": string}` }
    ], 700);
    const closeParsed = parseJSON(closeRaw) || { title: "Summary", paragraph: "", bullets: [], notes: "" };

    await setProgress(supabase, moduleId, { step: "finalizing", message: "Finalizing module...", pct: 95 });

    // 5. Slides JSON
    const slideData = {
      slides: sections.map((sec, i) => ({
        sectionTitle: sec.title, title: sec.title,
        paragraph: sectionRecords[i]?.content?.slice(0, 300) || null,
        bullets: sec.learning_objectives, code: null, notes: "",
      })),
    };

    // 6. Final
    await supabase.from("modules").update({
      status: "complete", markdown_content: md, slides_json: slideData,
      completed_at: new Date().toISOString(),
    }).eq("id", moduleId);

    await setProgress(supabase, moduleId, { step: "complete", message: `Module generated! ${uniqueRefs.length} sources cited.`, pct: 100 });

    return NextResponse.json({ success: true, moduleId, sectionsCount: sections.length, sourcesCount: uniqueRefs.length });
  } catch (err: any) {
    const supabase = getSupabase();
    try {
      await supabase.from("modules").update({ status: "failed", error: err.message, progress: { step: "error", message: `Error: ${err.message}`, pct: 0 } }).eq("id", "00000000-0000-0000-0000-000000000000");
    } catch {}
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
