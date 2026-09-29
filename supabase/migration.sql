-- Training Module Generator - Database Schema
-- Run this in Supabase SQL Editor

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  audience TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'complete', 'failed')),
  outline_model TEXT DEFAULT 'gpt-4o-mini',
  content_model TEXT DEFAULT 'gpt-4o-mini',
  outline_json JSONB,
  markdown_content TEXT,
  slides_json JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  learning_objectives JSONB DEFAULT '[]',
  key_concepts JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  section_failed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  type TEXT DEFAULT 'web' CHECK (type IN ('web', 'academic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_created ON modules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sections_module ON sections(module_id);
CREATE INDEX IF NOT EXISTS idx_sources_section ON sources(section_id);
CREATE INDEX IF NOT EXISTS idx_sources_module ON sources(module_id);
