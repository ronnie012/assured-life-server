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
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AssuredLife Server Status</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(to bottom right, #1a202c, #2d3748); /* from-gray-900 to-gray-800 */
                color: #ffffff; /* text-white */
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                text-align: center;
            }
            .container {
                background-color: #4a5568; /* bg-gray-700 */
                padding: 2rem; /* p-8 */
                border-radius: 0.5rem; /* rounded-lg */
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
                border: 1px solid #4a5568; /* border border-gray-600 */
            }
            h1 {
                font-size: 3rem; /* text-5xl */
                font-weight: 800; /* font-extrabold */
                margin-bottom: 1rem; /* mb-4 */
                color: #68d391; /* text-green-400 */
            }
            p {
                font-size: 1.25rem; /* text-xl */
                margin-bottom: 1.5rem; /* mb-6 */
                color: #a0aec0; /* text-gray-300 */
            }
            .status-indicator-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 2rem; /* mb-8 */
            }
            .status-dot-outer {
                position: relative;
                display: flex;
                height: 1.25rem; /* h-5 */
                width: 1.25rem; /* w-5 */
                margin-right: 0.75rem; /* mr-3 */
            }
            .status-dot-ping {
                animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                position: absolute;
                display: inline-flex;
                height: 100%;
                width: 100%;
                border-radius: 9999px; /* rounded-full */
                background-color: #68d391; /* bg-green-400 */
                opacity: 0.75;
            }
            .status-dot-inner {
                position: relative;
                display: inline-flex;
                border-radius: 9999px; /* rounded-full */
                height: 1.25rem; /* h-5 */
                width: 1.25rem; /* w-5 */
                background-color: #48bb78; /* bg-green-500 */
                animation: pulse-green 2s infinite;
            }
            .status-text {
                font-size: 1.5rem; /* text-2xl */
                font-weight: 600; /* font-semibold */
                color: #9ae6b4; /* text-green-300 */
            }
            .api-requests-text {
                font-size: 1rem; /* text-md */
                color: #cbd5e0; /* text-gray-400 */
            }

            @keyframes pulse-green {
                0%, 100% { background-color: #22c55e; }
                50% { background-color: #16a34a; }
            }
            @keyframes ping {
                75%, 100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>AssuredLife Server</h1>
            <p>Reliable backend is up and running!</p>
            <div class="status-indicator-wrapper">
                <span class="status-dot-outer">
                    <span class="status-dot-ping"></span>
                    <span class="status-dot-inner"></span>
                </span>
                <span class="status-text">Status: Online</span>
            </div>
            <p class="api-requests-text">Serving API requests for AssuredLife web app.</p>
        </div>
    </body>
    </html>
  `);
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
      console.log(`AssuredLife server is running on port: ${port}`);
    });
  });
}

// Export the app instance for Vercel's serverless environment
module.exports = app;