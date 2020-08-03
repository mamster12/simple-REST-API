const express = require('express');
const app = express();
const connectDB = require('./config/db');

// connect MongoDB Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// // Default Route (used for development)
// app.get('/', (req, res) => res.send('API running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
