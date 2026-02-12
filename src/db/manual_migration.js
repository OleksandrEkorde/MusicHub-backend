import { drizzle } from 'drizzle-orm/node-postgres';
import pool from './db.js';

async function migrate() {
    try {
        console.log('Starting manual migration...');

        // Create note_likes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "note_likes" (
                "id" SERIAL PRIMARY KEY,
                "user_id" integer,
                "note_id" integer,
                "created_at" timestamp
            );
        `);
        console.log('Created table: note_likes');

        // Create subscriptions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "subscriptions" (
                "id" SERIAL PRIMARY KEY,
                "name" varchar(255) NOT NULL,
                "price" integer NOT NULL,
                "currency" varchar(10) DEFAULT 'UAH',
                "features" json,
                "description" text
            );
        `);
        console.log('Created table: subscriptions');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
