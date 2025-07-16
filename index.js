
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// popular-policies route
app.get('/api/v1/popular-policies', async (req, res) => {
  try {
    const popularPolicies = await Policy.find().sort({ purchaseCount: -1 }).limit(6);
    res.status(200).json(popularPolicies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popular policies', error });
  }
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

app.listen(port, () => {
  console.log(`Life Insurance server is running on port: ${port}`);
});
