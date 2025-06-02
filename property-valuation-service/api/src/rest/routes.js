const express = require('express');
const { body, validationResult } = require('express-validator');
const { grpcClient } = require('../utils/grpcClient');
const { logger } = require('../utils/logger');

const router = express.Router();

// API Documentation
router.get('/', (req, res) => {
  res.json({
    name: 'Property Valuation API',
    version: '1.0.0',
    endpoints: {
      calculate: {
        method: 'POST',
        path: '/calculate',
        description: 'Calculate property valuation',
        body: {
          address: 'string (required)',
          property_type: 'string (house|apartment|condo|townhouse)',
          bedrooms: 'number (required, min: 0)',
          bathrooms: 'number (required, min: 0)',
          square_footage: 'number (required, min: 0)',
          year_built: 'number (required, min: 1800)',
          condition: 'string (excellent|good|fair|poor)',
          maintenance_level: 'string (excellent|good|fair|poor)',
          renovation_status: 'string (recently_renovated|standard|needs_renovation)'
        },
        response: {
          value: 'number',
          confidence: 'number',
          explanation: 'string'
        }
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        response: {
          status: 'string'
        }
      }
    },
    graphql: {
      endpoint: '/graphql',
      playground: '/graphql',
      documentation: 'See GraphQL schema for available queries and mutations'
    }
  });
});

// Validation middleware
const validateProperty = [
  body('address').notEmpty().withMessage('Address is required'),
  body('property_type').isIn(['house', 'apartment', 'condo', 'townhouse']).withMessage('Invalid property type'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a positive integer'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a positive number'),
  body('square_footage').isInt({ min: 0 }).withMessage('Square footage must be a positive integer'),
  body('year_built').isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid year built'),
  body('condition').isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  body('maintenance_level').isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Invalid maintenance level'),
  body('renovation_status').isIn(['recently_renovated', 'standard', 'needs_renovation']).withMessage('Invalid renovation status')
];

// Calculate valuation endpoint
router.post('/calculate', validateProperty, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await grpcClient.calculateValuation(req.body);
    res.json(result);
  } catch (error) {
    logger.error('REST API Error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        code: error.code || 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await grpcClient.connect();
    res.json({ 
      status: 'ok',
      grpc: 'connected'
    });
  } catch (error) {
    res.json({ 
      status: 'ok',
      grpc: 'disconnected',
      error: error.message
    });
  }
});

module.exports = { restRoutes: router }; 