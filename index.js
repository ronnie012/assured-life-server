
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

// Temporary middleware for debugging profile data sync
app.use('/api/v1/profile', (req, res, next) => {
  console.log('Temporary Profile Middleware: req.user.uid =', req.user ? req.user.uid : 'undefined');
  next();
}, profileRoutes);
app.use('/api/v1/faqs', faqRoutes);

app.listen(port, () => {
  console.log(`Life Insurance server is running on port: ${port}`);
});
