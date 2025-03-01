const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Import routes
const companyRoutes = require('./routes/company');
const applicationRoutes = require('./routes/application');
const jobRoutes = require('./routes/job'); // Import job routes

// Use routes
app.use('/api/company', companyRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/job', jobRoutes); // Use job routes

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});