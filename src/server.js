import express from "express";
import { checkDbConnection } from "./db/db.js";
import StatsController from "./controllers/StatsController.js";
import NotesPaginationController from './controllers/NotesPaginationController.js';
import TimeSignaturesController from './controllers/TimeSignaturesController.js';
import TagsController from './controllers/TagsController.js';
import CreateNotesController from './controllers/CreateNotesController.js';
import DeleteNotesController from './controllers/DeleteNotesController.js';
import GoogleAuthController from './controllers/GoogleAuthController.js';
import UsersController from './controllers/UsersController.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";



import cors from "cors";
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
const PORT = process.env.SRV_PORT;

const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || typeof header !== 'string') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' })
    }

    const payload = jwt.verify(token, secret)
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

app.get("/stats/users", StatsController.usersList);
app.get('/songs', NotesPaginationController.NoteList);
app.get('/composers/:composerId/songs', NotesPaginationController.NoteListByComposerId);
app.post('/songs', CreateNotesController.uploadMiddleware, CreateNotesController.create);
app.get('/songs/:id', NotesPaginationController.NoteById);
app.delete('/songs/:id', DeleteNotesController.delete);
app.get('/time-signatures', TimeSignaturesController.list);
app.get('/tags', TagsController.list);
app.get('/auth/google', GoogleAuthController.redirect);
app.get('/auth/google/callback', GoogleAuthController.callback);
app.get('/me', requireAuth, UsersController.me);
app.get('/my-songs', requireAuth, (req, res) => {
  req.params.composerId = String(req.user.id)
  return NotesPaginationController.NoteListByComposerId(req, res)
});
app.get('/users/:id', UsersController.getById);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));




async function start() {
  try {
    await checkDbConnection();
    console.log("Sucsess connect to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`Server at started port ${PORT}`);
    });
  } catch (err) {
    console.error("Error for start server", err);
    process.exit(1);
  }
}

start();
