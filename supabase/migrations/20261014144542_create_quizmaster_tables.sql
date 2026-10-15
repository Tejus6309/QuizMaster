/*
# QuizMaster: Core Tables for Documents, Quizzes, and Attempts

## Overview
This migration creates the three core tables needed for the QuizMaster AI quiz generator feature:
- `documents`: Stores uploaded document text (parsed from PDF/DOCX/TXT/MD)
- `quizzes`: Stores AI-generated quizzes linked to a document
- `attempts`: Stores completed quiz attempts with scores and answers

All tables are owner-scoped (multi-user) with `user_id` defaulting to `auth.uid()`.

## New Tables

### 1. documents
- `id` (uuid, PK) - unique document ID
- `user_id` (uuid, FK to auth.users) - owner, defaults to auth.uid()
- `title` (text) - document filename or title
- `content` (text) - extracted text content
- `file_type` (text) - original file extension (pdf, docx, txt, md)
- `file_size` (bigint) - file size in bytes
- `char_count` (integer) - character count of extracted text
- `created_at` (timestamptz) - upload timestamp

### 2. quizzes
- `id` (uuid, PK) - unique quiz ID
- `user_id` (uuid, FK to auth.users) - owner, defaults to auth.uid()
- `document_id` (uuid, FK to documents) - source document
- `title` (text) - quiz title (editable)
- `questions` (jsonb) - array of question objects
- `difficulty` (text) - easy/medium/hard/mixed
- `num_questions` (integer) - number of questions
- `source` (text) - 'document' or 'trivia'
- `created_at` (timestamptz) - creation timestamp

### 3. attempts
- `id` (uuid, PK) - unique attempt ID
- `user_id` (uuid, FK to auth.users) - owner, defaults to auth.uid()
- `quiz_id` (uuid, FK to quizzes, nullable) - linked quiz (null for trivia/static)
- `category_name` (text) - display category name
- `questions` (jsonb) - full question data for review
- `answers` (jsonb) - user's answers array
- `marked_for_review` (jsonb) - flagged questions map
- `total_time` (integer) - total time in seconds
- `correct` (integer) - correct count
- `incorrect` (integer) - incorrect count
- `skipped` (integer) - skipped count
- `total` (integer) - total questions
- `percentage` (integer) - score percentage
- `accuracy` (integer) - accuracy percentage
- `is_personal_best` (boolean) - whether this was a personal best
- `source` (text) - 'document', 'trivia', or 'static'
- `created_at` (timestamptz) - attempt timestamp

## Security
- RLS enabled on all tables
- Owner-scoped CRUD policies (4 per table: SELECT, INSERT, UPDATE, DELETE)
- All policies scope TO authenticated with auth.uid() = user_id checks
- user_id columns default to auth.uid() so inserts without explicit user_id succeed
- Foreign keys use ON DELETE CASCADE so deleting a document removes its quizzes, etc.
*/

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  file_type text NOT NULL DEFAULT 'txt',
  file_size bigint NOT NULL DEFAULT 0,
  char_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  difficulty text NOT NULL DEFAULT 'medium',
  num_questions integer NOT NULL DEFAULT 10,
  source text NOT NULL DEFAULT 'document',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quizzes" ON quizzes;
CREATE POLICY "select_own_quizzes" ON quizzes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quizzes" ON quizzes;
CREATE POLICY "insert_own_quizzes" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quizzes" ON quizzes;
CREATE POLICY "update_own_quizzes" ON quizzes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quizzes" ON quizzes;
CREATE POLICY "delete_own_quizzes" ON quizzes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE SET NULL,
  category_name text NOT NULL DEFAULT 'Quiz',
  questions jsonb NOT NULL DEFAULT '[]',
  answers jsonb NOT NULL DEFAULT '[]',
  marked_for_review jsonb NOT NULL DEFAULT '{}',
  total_time integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  incorrect integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  accuracy integer NOT NULL DEFAULT 0,
  is_personal_best boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'static',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON attempts;
CREATE POLICY "select_own_attempts" ON attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON attempts;
CREATE POLICY "insert_own_attempts" ON attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attempts" ON attempts;
CREATE POLICY "update_own_attempts" ON attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON attempts;
CREATE POLICY "delete_own_attempts" ON attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_document_id ON quizzes(document_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id);
