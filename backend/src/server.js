import dotenv from "dotenv";
import app from "./app.js";
import { createHttpServer, initializeSocketServer } from "./socket/socketServer.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = createHttpServer(app);

initializeSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
