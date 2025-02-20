// app.js
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const admin = require('firebase-admin');
require('dotenv').config();

// Obtiene y parsea las credenciales de Firebase desde la variable de entorno
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
const serviceAccount = JSON.parse(serviceAccountString);

// Inicializa Firebase Admin con las credenciales obtenidas
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Importa la única ruta que tienes definida: api.js
const apiRouter = require('./routes/api')(db);

// Crea la aplicación Express
const app = express();

// Middlewares básicos
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Usa la ruta /api para todos los endpoints definidos en api.js
app.use('/api', apiRouter);

// Agrega esto antes del middleware 404
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API del backend' });
});


// Captura rutas no encontradas y genera error 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Manejador de errores
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
