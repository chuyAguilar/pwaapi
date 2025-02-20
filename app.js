// app.js
import express from "express";
const app = express();

// tus middlewares, rutas, etc.
app.get("/", (req, res) => {
  res.send("Hola desde Express + Vercel");
});

export default app;
