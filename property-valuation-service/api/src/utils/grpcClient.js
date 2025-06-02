const { ValuationClient } = require('../../../node-client');
const { logger } = require('./logger');

class GrpcClientManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    const serverAddress = process.env.GRPC_SERVER || 'localhost:50051';
    logger.info(`Connecting to gRPC server at ${serverAddress}`);

    try {
      this.client = new ValuationClient(serverAddress);
      // Test the connection with a simple operation
      await this.testConnection();
      this.isConnected = true;
      this.retryAttempts = 0;
      logger.info('Successfully connected to gRPC server');
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to gRPC server:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async testConnection() {
    try {
      // Try a simple operation to test the connection
      await this.client.calculateValuation({
        address: 'test',
        property_type: 'house',
        bedrooms: 1,
        bathrooms: 1,
        square_footage: 100,
        year_built: 2000,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard'
      });
    } catch (error) {
      if (error.code === 14) { // UNAVAILABLE
        throw new Error('gRPC server is not available');
      }
      // If we get any other error, the connection is working
      return;
    }
  }

  async executeWithRetry(operation) {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    try {
      return await operation(this.client);
    } catch (error) {
      if (error.code === 14 && this.retryAttempts < this.maxRetries) { // 14 is UNAVAILABLE
        this.retryAttempts++;
        logger.warn(`Retrying operation (attempt ${this.retryAttempts}/${this.maxRetries})`);
        this.isConnected = false;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.executeWithRetry(operation);
      }
      throw error;
    }
  }

  async calculateValuation(property) {
    return this.executeWithRetry(async (client) => {
      return await client.calculateValuation(property);
    });
  }
}

// Create a singleton instance
const grpcClient = new GrpcClientManager();

module.exports = { grpcClient }; 