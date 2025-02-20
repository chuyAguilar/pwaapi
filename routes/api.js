// routes/api.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Recibimos 'db' al invocar este módulo
module.exports = function(db) {

  const JWT_SECRET = 'YourBackendJWTSecret'; // O usa process.env.JWT_SECRET
  
  // Endpoint de prueba
  router.get('/', (req, res) => {
    res.status(200).json({ message: 'Bienvenido a la API del backend' });
  });

  // Endpoint para sembrar roles
  router.post('/seedRoles', async (req, res) => {
    try {
      await db.collection('roles').doc('master').set({
        role: 'master',
        permissions: ['add_users', 'delete_users', 'update_users', 'add_role', 'delete_role', 'update_role']
      });
      await db.collection('roles').doc('cliente').set({
        role: 'cliente',
        permissions: ['get_users', 'get_role']
      });
      res.json({ success: true, message: 'Roles seeded successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Endpoint de registro
  router.post('/register', async (req, res) => {
    try {
      const { email, username, password, role } = req.body;
      // ...
      const saltRounds = 10;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      const userId = uuidv4();

      const newUser = {
        email,
        username,
        password: hashedPassword,
        role,
        last_login: null,
      };

      await db.collection('users').doc(userId).set(newUser);
      res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Endpoint de login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('username', '==', username).limit(1).get();

      if (snapshot.empty) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // ...
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      const match = await bcrypt.compare(password, userData.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
      await userDoc.ref.update({ last_login: new Date() });

      const roleDoc = await db.collection('roles').doc(userData.role).get();
      let roleData = { role: userData.role, permissions: [] };
      if (roleDoc.exists) {
        roleData = roleDoc.data();
      }

      const tokenPayload = {
        username: userData.username,
        email: userData.email,
        role: roleData.role,
        permissions: roleData.permissions,
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

      res.json({ success: true, message: 'Login successful', token, user: tokenPayload });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Obtener todos los usuarios
  router.get('/users', async (req, res) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = [];
      snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Actualizar un usuario
  router.put('/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection('users').doc(userId).update(req.body);
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Borrar un usuario
  router.delete('/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection('users').doc(userId).delete();
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
