const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Database utility functions
const db = {
    // Exercise Sets
    async createExerciseSet(exerciseSet) {
        const query = `
            INSERT INTO exercise_sets (id, title, exercises, chat_language, created_by, created_at, last_used)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            exerciseSet.id,
            exerciseSet.title,
            JSON.stringify(exerciseSet.exercises),
            exerciseSet.chatLanguage || 'English',
            exerciseSet.createdBy,
            exerciseSet.createdAt,
            exerciseSet.lastUsed
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getExerciseSet(id) {
        const query = 'SELECT * FROM exercise_sets WHERE id = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                ...row,
                exercises: JSON.parse(row.exercises)
            };
        }
        return null;
    },

    async getAllExerciseSets() {
        const query = 'SELECT * FROM exercise_sets ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows.map(row => ({
            ...row,
            exercises: JSON.parse(row.exercises)
        }));
    },

    async updateExerciseSet(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.title) {
            fields.push(`title = $${paramCount++}`);
            values.push(updates.title);
        }
        if (updates.exercises) {
            fields.push(`exercises = $${paramCount++}`);
            values.push(JSON.stringify(updates.exercises));
        }
        if (updates.chatLanguage) {
            fields.push(`chat_language = $${paramCount++}`);
            values.push(updates.chatLanguage);
        }
        if (updates.chatModel) {
            fields.push(`chat_model = $${paramCount++}`);
            values.push(updates.chatModel);
        }
        if (updates.chatInstruction) {
            fields.push(`chat_instruction = $${paramCount++}`);
            values.push(updates.chatInstruction);
        }
        if (updates.reasoningEffort) {
            fields.push(`reasoning_effort = $${paramCount++}`);
            values.push(updates.reasoningEffort);
        }
        if (updates.verbosity) {
            fields.push(`verbosity = $${paramCount++}`);
            values.push(updates.verbosity);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE exercise_sets 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                ...row,
                exercises: JSON.parse(row.exercises)
            };
        }
        return null;
    },

    async deleteExerciseSet(id) {
        const query = 'DELETE FROM exercise_sets WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    },

    async updateLastUsed(id) {
        const query = 'UPDATE exercise_sets SET last_used = NOW() WHERE id = $1';
        await pool.query(query, [id]);
    },

    // System Settings
    async getSystemSettings() {
        const query = 'SELECT * FROM system_settings ORDER BY id DESC LIMIT 1';
        const result = await pool.query(query);
        return result.rows[0] || {
            llm_model: 'gpt-3.5-turbo',
            default_chat_instruction: 'Default instruction'
        };
    },

    async updateSystemSettings(settings) {
        const query = `
            UPDATE system_settings 
            SET llm_model = $1, default_chat_instruction = $2, updated_at = NOW()
            WHERE id = (SELECT id FROM system_settings ORDER BY id DESC LIMIT 1)
            RETURNING *
        `;
        const values = [settings.llmModel, settings.defaultChatInstruction];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // Admin Users
    async createAdminUser(username, passwordHash) {
        const query = `
            INSERT INTO admin_users (username, password_hash)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [username, passwordHash]);
        return result.rows[0];
    },

    async getAdminUser(username) {
        const query = 'SELECT * FROM admin_users WHERE username = $1';
        const result = await pool.query(query, [username]);
        return result.rows[0];
    },

    // Health check
    async healthCheck() {
        try {
            await pool.query('SELECT 1');
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    },

    // Close connection pool
    async close() {
        await pool.end();
    }
};

module.exports = db;
