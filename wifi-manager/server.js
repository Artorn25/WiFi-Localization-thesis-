const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.status(201).send(userRecord);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).send(error);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    // Verify the password (implement your own password verification)
    // Assuming password verification is done, and it's successful:
    res.status(200).send(userRecord);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).send(error);
  }
});

app.post('/add-wifi', async (req, res) => {
  const { lat, lon, strength } = req.body;
  try {
    const newWifi = await db.collection('wifi').add({ lat, lon, strength });
    console.log('New WiFi added:', newWifi.id);
    io.emit('new-wifi', { id: newWifi.id, lat, lon, strength });
    res.status(201).send({ id: newWifi.id });
  } catch (error) {
    console.error("Error adding WiFi:", error);
    res.status(400).send(error);
  }
});

app.get('/get-wifi-locations', async (req, res) => {
  try {
    const wifiSnapshot = await db.collection('wifi').get();
    const wifiLocations = wifiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(wifiLocations);
  } catch (error) {
    console.error("Error getting WiFi locations:", error);
    res.status(400).send(error);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
