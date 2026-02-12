import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  customType,
  json,
} from 'drizzle-orm/pg-core'

const userRole = customType({
  dataType() {
    return 'user_role'
  },
})

export const subscriptions = pgTable('subscriptions', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  currency: varchar('currency', { length: 10 }).default('UAH'),
  features: json('features'),
  description: text('description'),
})

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  role: userRole('role'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  bio: text('bio'),
  avatar: text('avatar_url'),
  avatarPublicId: text('avatar_public_id'),
})

export const musicalNotes = pgTable('notes', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  title: varchar('title', { length: 255 }),
  timeSignatureId: integer('time_signature_id'),
  pdfUrl: text('pdf_url'),
  pdfPublicId: text('pdf_public_id'),
  audioUrl: text('audio_url'),
  audioPublicId: text('audio_public_id'),
  coverImageUrl: text('cover_image_url'),
  coverImagePublicId: text('cover_image_public_id'),
  description: text('description'),
  difficulty: varchar('difficulty', { length: 20 }),
  isPublic: boolean('is_public'),
  views: integer('views').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }),
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

export const noteLikes = pgTable('note_likes', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  noteId: integer('note_id'),
  createdAt: timestamp('created_at', { mode: 'date' }),
})

export const timeSignatures = pgTable('time_signatures', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 10 }).notNull(),
})
