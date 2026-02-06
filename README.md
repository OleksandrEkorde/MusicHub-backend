# MusicHub Backend

Backend API for the MusicHub application.

## Tech stack

- Node.js (ESM)
- Express
- PostgreSQL
- Drizzle ORM
- Cloudinary (file storage)
- Multer (uploads)
- Swagger (OpenAPI)

## Requirements

- Node.js 18+
- PostgreSQL

## Install

```bash
npm i
```

## Environment variables

Copy `.env.example` to `.env` in the project root and fill in the values.

### Server

```env
SRV_PORT=34

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=musichub
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
```

### Cloudinary

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Google OAuth

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:34/auth/google/callback

# Optional: if set, the callback will redirect to the frontend with `?token=...`
FRONTEND_URL=http://localhost:5173/auth/callback
```

## Run

```bash
npm run dev
```

Server starts on `http://localhost:${SRV_PORT}`.

## Swagger

Swagger UI:

- `GET /api-docs`

## Authentication

The backend uses JWT Bearer tokens:

- Header: `Authorization: Bearer <token>`

Token is issued by Google OAuth callback:

- `GET /auth/google`
- `GET /auth/google/callback`

## Endpoints (high-level)

### Auth

- `GET /auth/google` - redirects to Google login
- `GET /auth/google/callback` - exchanges code, upserts user, returns token (or redirects to `FRONTEND_URL`)

### Users

- `GET /me` - current user (requires auth)
- `GET /users/:id` - user by id

### Notes

- `GET /songs` - paginated list with filters
- `GET /songs/:id` - note by id
- `GET /composers/:composerId/songs` - notes by composer id
- `GET /my-songs` - notes of current user (requires auth)
- `POST /songs` - create note (`multipart/form-data` or `application/json`)
- `DELETE /songs/:id` - delete note (also removes linked Cloudinary assets)

### Dictionaries

- `GET /tags`
- `GET /time-signatures`

## Uploads

`POST /songs` supports file fields:

- `pdf` - `application/pdf`
- `audio` - `audio/*` or `video/mp4`
- `cover` - `image/*`

Uploads are stored in Cloudinary folders:

- `musichub/notes/pdf`
- `musichub/notes/audio`
- `musichub/notes/cover`

Multer limits:

- max file size: 50MB

## Database notes

### Cloudinary public_id columns

To enable safe deletion of Cloudinary resources during note deletion, add these columns:

```sql
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS pdf_public_id TEXT,
  ADD COLUMN IF NOT EXISTS audio_public_id TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_public_id TEXT;
```

### note_view table

If `DELETE /songs/:id` fails with `relation "note_view" does not exist`, create the table:

```sql
CREATE TABLE IF NOT EXISTS note_view (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT note_view_note_fk
    FOREIGN KEY (note_id) REFERENCES notes(id)
    ON DELETE CASCADE,

  CONSTRAINT note_view_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS note_view_note_id_idx ON note_view(note_id);
```
