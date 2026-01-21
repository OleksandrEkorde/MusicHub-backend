import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  customType,
} from 'drizzle-orm/pg-core'

const userRole = customType({
  dataType() {
    return 'user_role'
  },
})

export const users = pgTable('users', {
  id: integer('id'),
  email: varchar('email', { length: 255 }),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  role: userRole('role'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
})

export const musicalNotes = pgTable('musical_notes', {
  id: integer('id'),
  userId: integer('user_id'),
  title: varchar('title', { length: 255 }),
  content: jsonb('content'),
  isPublic: boolean('is_public'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
})
