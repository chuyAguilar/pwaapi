import app from "../app.js";
import { createServer } from "http";

export default function (req, res) {
  // Creamos un servidor HTTP a partir de nuestra app Express
  const server = createServer(app);
  return server.emit("request", req, res);
}
