import dotenv from 'dotenv';
dotenv.config();

// Force redeploy for mechanics fix

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - Extra permissive for development
console.log('🔧 CORS allowedOrigins:', config.allowedOrigins);
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  optionsSuccessStatus: 200, // For legacy browser support
}));

// UTF-8 encoding middleware for API routes
app.use('/api', (req, res, next) => {
  res.charset = 'utf-8';
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// Body parsing middleware with UTF-8 encoding
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json',
  charset: 'utf-8'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  charset: 'utf-8'
}));
app.use(cookieParser());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', routes);

// Serve static files from client build in production
if (config.nodeEnv === 'production') {
  const staticPath = path.join(__dirname, '../../client/dist');
  console.log('🗂️  Static path:', staticPath);
  console.log('🏠 __dirname:', __dirname);
  
  // Check if static path exists
  const fs = require('fs');
  console.log('📁 Static path exists:', fs.existsSync(staticPath));
  if (fs.existsSync(staticPath)) {
    console.log('📄 Files in static path:', fs.readdirSync(staticPath));
  }
  
  // Configure static file serving with proper MIME types
  app.use(express.static(staticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    console.log('🎯 Serving index.html from:', indexPath);
    console.log('📄 index.html exists:', fs.existsSync(indexPath));
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(indexPath);
  });
}

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Henry Diagnostics Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Server binding to 0.0.0.0:${PORT}`);
});

export default app;