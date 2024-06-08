const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const homeRouter = require('./home.js');
const SoftwareRoute = require('./routes/software.js');
const HardwareRoute = require('./routes/hardware.js');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http'); // Import the http module
const socketIO = require('socket.io');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(bodyParser.json());
app.use(cors());

app.use('/api', SoftwareRoute);
app.use('/api', HardwareRoute);

app.use('/', homeRouter);

// Create HTTP server
const server = http.createServer(app);
const io = socketIO(server); // Attach socket.io to the HTTP server

// Define socket.io event handlers
io.on('connection', (socket) => {
  console.log('A client connected');

  // Example: Listen for a custom event
  socket.on('custom_event', (data) => {
    console.log('Custom event received:', data);
    // Example: Emit a response
    io.emit('response_event', 'Response from server');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Node.js server listening on port ${PORT}`);
});
