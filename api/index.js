import { createServer } from "http";
import app from "../app.js";

// Handler para Vercel:
// Creamos un servidor HTTP y emitimos el request a nuestra app Express.
export default function (req, res) {
  const server = createServer(app);
  return server.emit("request", req, res);
}
