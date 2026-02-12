import express from "express";
import { checkDbConnection } from "./db/db.js";
import StatsController from "./controllers/StatsController.js";
import NotesPaginationController from './controllers/NotesPaginationController.js';
import TimeSignaturesController from './controllers/TimeSignaturesController.js';
import TagsController from './controllers/TagsController.js';
import CreateNotesController from './controllers/CreateNotesController.js';
import DeleteNotesController from './controllers/DeleteNotesController.js';
import GoogleAuthController from './controllers/GoogleAuthController.js';
import AuthController from './controllers/AuthController.js';
import UsersController from './controllers/UsersController.js';
import UpdateNotesController from './controllers/UpdateNotesController.js';
import NoteViewController from './controllers/NoteViewController.js';
import SubscriptionController from './controllers/SubscriptionController.js';
import LikesController from './controllers/LikesController.js';
import DownloadController from './controllers/DownloadController.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";



import cors from "cors";
import requireAuth from './middleware/requireAuth.js';
import { buildCorsOptions } from './config/cors.js';

const app = express();
app.use(express.json());
app.use(
  cors(buildCorsOptions()),
);
const PORT = process.env.SRV_PORT;

app.get("/stats/users", StatsController.usersList);
app.get('/songs', NotesPaginationController.NoteList);
app.get('/composers/:composerId/songs', NotesPaginationController.NoteListByComposerId);
app.post('/songs', CreateNotesController.uploadMiddleware, CreateNotesController.create);
app.get('/songs/:id', NotesPaginationController.NoteById);
app.get('/songs/:id/download', DownloadController.downloadPdf);
app.post('/songs/:id/view', requireAuth, NoteViewController.view);
app.post('/songs/:id/like', requireAuth, LikesController.toggle);
app.put('/songs/:id', requireAuth, UpdateNotesController.update);
app.delete('/songs/:id', DeleteNotesController.delete);
app.get('/time-signatures', TimeSignaturesController.list);
app.get('/tags', TagsController.list);
app.get('/auth/google', GoogleAuthController.redirect);
app.get('/auth/google/callback', GoogleAuthController.callback);
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);
app.post('/auth/logout', AuthController.logout);
app.get('/subscriptions', SubscriptionController.getAll);
app.get('/subscriptions/:id', SubscriptionController.getById);
app.post('/subscriptions/purchase', requireAuth, SubscriptionController.purchase);
app.get('/me', requireAuth, UsersController.me);
app.put('/me', requireAuth, UsersController.uploadAvatarMiddleware, UsersController.updateMe);
app.get('/my-favorite-songs', requireAuth, LikesController.listFavorites);
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
