export interface Module {
  id: string;
  request_id: string | null;
  topic: string;
  level: string;
  audience: string;
  duration: string;
  status: "ongoing" | "complete" | "failed";
  outline_model: string;
  content_model: string;
  outline_json: any;
  markdown_content: string | null;
  slides_json: any;
  progress: any;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  sections?: Section[];
}

export interface Section {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  learning_objectives: string[];
  key_concepts: string[];
  sort_order: number;
  section_failed: boolean;
  citations_used: number[];
  has_sources: boolean;
  created_at: string;
  updated_at: string;
  sources?: Source[];
}

export interface Source {
  id: string;
  section_id: string;
  module_id: string;
  title: string;
  url: string;
  type: "web" | "academic";
  created_at: string;
}

export interface ModuleFormData {
  topic: string;
  level: string;
  audience: string;
  duration: string;
  durationUnit: "hours" | "days";
  outlineModel: string;
  contentModel: string;
  researchTavily: boolean;
  researchArxiv: boolean;
}

export interface GenerationStatus {
  step: "outline" | "research" | "content" | "slides" | "complete";
  sectionsFound?: number;
  sourcesFound?: number;
  currentSection?: string;
  error?: string;
}
