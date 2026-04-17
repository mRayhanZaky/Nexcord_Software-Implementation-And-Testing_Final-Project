require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // 👈 TAMBAH INI
const authRoutes = require('./routes/authRoutes');

const app = express();

// 👇 TAMBAH INI (WAJIB sebelum routes)
app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

// routes
app.use('/api/auth', authRoutes);

// koneksi database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch(err => console.log(err));

// jalanin server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});