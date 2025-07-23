require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'https://assured-life.web.app'],
  credentials: true
}));
app.use(express.json());

// Handle preflight requests for all routes
// app.options('* ', cors());

const authRoutes = require('./src/api/v1/routes/authRoutes');
const policyRoutes = require('./src/api/v1/routes/policyRoutes');
const reviewRoutes = require('./src/api/v1/routes/reviewRoutes');
const blogRoutes = require('./src/api/v1/routes/blogRoutes');
const newsletterRoutes = require('./src/api/v1/routes/newsletterRoutes');
const agentRoutes = require('./src/api/v1/routes/agentRoutes');
const applicationRoutes = require('./src/api/v1/routes/applicationRoutes');
const userRoutes = require('./src/api/v1/routes/userRoutes');
const transactionRoutes = require('./src/api/v1/routes/transactionRoutes');
const paymentRoutes = require('./src/api/v1/routes/paymentRoutes');
const claimRoutes = require('./src/api/v1/routes/claimRoutes');
const profileRoutes = require('./src/api/v1/routes/profileRoutes');
const faqRoutes = require('./src/api/v1/routes/faqRoutes');
const customerRoutes = require('./src/api/v1/routes/customerRoutes');
const firebaseAuthMiddleware = require('./src/middlewares/firebaseAuthMiddleware');
const Policy = require('./src/models/Policy');
const Review = require('./src/models/Review');

app.get('/', (req, res) => {
  res.send('Life Insurance server is running...');
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/claims', claimRoutes);

app.use('/api/v1/profile', firebaseAuthMiddleware, profileRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/customer', customerRoutes);

// NEW TEST ROUTE
app.get('/api/v1/test/:id', (req, res) => {
  console.log('TEST ROUTE HIT! ID:', req.params.id);
  res.status(200).json({ message: `Test route hit with ID: ${req.params.id}` });
});

// reviews route
app.get('/api/v1/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(5);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// This block will only run when you start the server locally
// with `node index.js` or `nodemon index.js`.
// It will not run when deployed to Vercel.
if (require.main === module) {
  connectDB().then(() => {
    app.listen(port, () => {
      // console.log(`Life Insurance server is running on port: ${port}`);
    });
  });
}

// Export the app instance for Vercel's serverless environment
module.exports = app;