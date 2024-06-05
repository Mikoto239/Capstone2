const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const homeRouter = require('./home.js');
const SoftwareRoute = require('./routes/software.js');
const HardwareRoute = require('./routes/hardware.js');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
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

app.listen(PORT, () => {
  console.log(`Node.js server listening on port ${PORT}`);
});
