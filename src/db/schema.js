import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core'

const userRole = customType({
  dataType() {
    return 'user_role'
  },
})

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  role: userRole('role'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
})

export const musicalNotes = pgTable('notes', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  size: text('size'),
  timeSignatureId: integer('time_signature_id'), 
  isPublic: boolean('is_public'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
})

export const notes = musicalNotes

export const noteView = pgTable('note_view', {
  id: integer('id').primaryKey(),
  noteId: integer('note_id'),
  userId: integer('user_id'),
  createdAt: timestamp('created_at', { mode: 'date' }),
})

export const tags = pgTable('tags', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 255 }),
})

export const noteTags = pgTable('note_tags', {
  noteId: integer('note_id').notNull(),
  tagId: integer('tag_id').notNull(),
})

export const timeSignatures = pgTable('time_signatures', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 10 }).notNull(),
})
