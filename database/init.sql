-- Database initialization script for Pugg Exercise Generator
-- This script runs when the PostgreSQL container starts for the first time

-- Create tables
CREATE TABLE IF NOT EXISTS exercise_sets (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    exercises JSONB NOT NULL,
    chat_language VARCHAR(50) DEFAULT 'English',
    chat_model VARCHAR(100),
    chat_instruction TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    llm_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    default_chat_instruction TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (llm_model, default_chat_instruction) 
VALUES (
    'gpt-3.5-turbo',
    'You are a helpful AI tutor assistant for students working on exercises. You should:
- Be encouraging and supportive
- Provide hints and guidance without giving away the answer
- Help students understand concepts and problem-solving approaches
- Ask clarifying questions when needed
- Keep responses concise and age-appropriate
- If the student asks for the direct answer, guide them to think through it step by step instead. Start with the first step, and only move on when the student mastered the first step.

IMPORTANT: When discussing mathematical expressions, formulas, or symbols:
- Use proper mathematical notation and LaTeX formatting when appropriate
- For inline math expressions, use single dollar signs: $x^2 + 3x - 4 = 0$
- For display math expressions, use double dollar signs: $$\frac{a}{b} = \frac{c}{d}$$
- Use proper mathematical symbols: π, ∑, ∫, √, ±, ≤, ≥, ≠, ∞, etc.
- When explaining mathematical concepts, be precise with notation and terminology

Respond naturally and helpfully to the student''s question. The chat users are 13 years old. Answer accordingly. Also keep responses super short. Only one sentence, max two if really neccessary.'
) ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_sets_created_at ON exercise_sets(created_at);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_last_used ON exercise_sets(last_used);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_created_by ON exercise_sets(created_by);

-- Create a function to update last_used timestamp
CREATE OR REPLACE FUNCTION update_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_used
CREATE TRIGGER update_exercise_set_last_used
    BEFORE UPDATE ON exercise_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_last_used();
