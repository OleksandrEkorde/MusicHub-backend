import express from "express";
import { checkDbConnection } from "./db/db.js";
import StatsController from "./controllers/StatsController.js";
import NotesPaginationController from './controllers/NotesPaginationController.js';
import TimeSignaturesController from './controllers/TimeSignaturesController.js';
import TagsController from './controllers/TagsController.js';
import CreateNotesController from './controllers/CreateNotesController.js';
import DeleteNotesController from './controllers/DeleteNotesController.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";



import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
const PORT = process.env.SRV_PORT;
app.get("/stats/users", StatsController.usersList);
app.get('/songs', NotesPaginationController.NoteList);
app.post('/songs', CreateNotesController.uploadMiddleware, CreateNotesController.create);
app.get('/songs/:id', NotesPaginationController.NoteById);
app.delete('/songs/:id', DeleteNotesController.delete);
app.get('/time-signatures', TimeSignaturesController.list);
app.get('/tags', TagsController.list);
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
