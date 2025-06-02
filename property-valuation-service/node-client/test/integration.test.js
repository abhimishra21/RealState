const { ValuationClient } = require('../index');
const assert = require('assert');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

describe('ValuationClient Integration Tests', () => {
  let client;
  let server;
  let port = 50051;

  before(async () => {
    // Start the test server
    const PROTO_PATH = path.resolve(__dirname, '../../proto/valuation.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    server = new grpc.Server();

    // Add the service implementation
    server.addService(protoDescriptor.valuation.ValuationService.service, {
      calculateValuation: (call, callback) => {
        const property = call.request.property;
        
        // Validate property
        if (property.property_type === 'invalid_type') {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid property type',
          });
          return;
        }

        if (property.condition === 'invalid_condition') {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid condition',
          });
          return;
        }

        if (property.maintenance_level === 'invalid_level') {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid maintenance level',
          });
          return;
        }

        if (property.renovation_status === 'invalid_status') {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid renovation status',
          });
          return;
        }

        if (property.year_built < 1800) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid year built',
          });
          return;
        }

        if (property.square_footage > 100000) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid square footage',
          });
          return;
        }

        if (property.bedrooms > 20) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid number of bedrooms',
          });
          return;
        }

        if (property.bathrooms > 20) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Invalid number of bathrooms',
          });
          return;
        }

        // Return a mock response
        callback(null, {
          result: {
            value: 500000,
            confidence: 0.85,
            explanation: 'Mock valuation result',
          },
        });
      },
    });

    // Start the server
    await new Promise((resolve, reject) => {
      const address = `127.0.0.1:${port}`;
      server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
        if (error) {
          reject(error);
          return;
        }
        port = boundPort;
        server.start();
        console.log(`Server started on ${address}`);
        resolve();
      });
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the client with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        client = new ValuationClient(`127.0.0.1:${port}`);
        // Test the connection
        await new Promise((resolve, reject) => {
          const deadline = new Date();
          deadline.setSeconds(deadline.getSeconds() + 5);
          client.client.waitForReady(deadline, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Failed to connect to server after 3 attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  after(async () => {
    // Stop the server
    await new Promise((resolve) => {
      server.tryShutdown(resolve);
    });
  });

  describe('Valid Properties', () => {
    it('should calculate valuation for a valid property', async () => {
      const property = {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
        features: ['garage', 'garden'],
      };

      const result = await client.calculateValuation(property);

      assert.ok(result.value > 0, 'Value should be positive');
      assert.ok(result.confidence > 0 && result.confidence <= 1, 'Confidence should be between 0 and 1');
      assert.ok(typeof result.explanation === 'string', 'Explanation should be a string');
    });
  });

  describe('Invalid Properties', () => {
    const invalidProperties = {
      invalid_property_type: {
        address: '123 Test St',
        property_type: 'invalid_type',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
      invalid_condition: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'invalid_condition',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
      invalid_maintenance: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'invalid_level',
        renovation_status: 'standard',
      },
      invalid_renovation: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'invalid_status',
      },
      invalid_year: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: 1700,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
      invalid_square_footage: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 200000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
      invalid_bedrooms: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 30,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
      invalid_bathrooms: {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 30,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      },
    };

    Object.entries(invalidProperties).forEach(([name, property]) => {
      it(`should reject ${name}`, async () => {
        try {
          await client.calculateValuation(property);
          assert.fail('Expected error was not thrown');
        } catch (error) {
          assert.ok(error.message.includes('INVALID_ARGUMENT'), 'Error should indicate invalid argument');
        }
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout errors', async () => {
      const client = new ValuationClient(`127.0.0.1:${port}`, { timeout: 1 }); // 1ms timeout
      const property = {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      };

      try {
        await client.calculateValuation(property);
        assert.fail('Expected timeout error was not thrown');
      } catch (error) {
        assert.ok(error.message.includes('DEADLINE_EXCEEDED'), 'Error should indicate timeout');
      }
    });
  });

  describe('Server Unavailable', () => {
    it('should handle server unavailable errors', async () => {
      const client = new ValuationClient('127.0.0.1:50052'); // Non-existent port
      const property = {
        address: '123 Test St',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 2000,
        year_built: new Date().getFullYear() - 5,
        condition: 'good',
        maintenance_level: 'good',
        renovation_status: 'standard',
      };

      try {
        await client.calculateValuation(property);
        assert.fail('Expected connection error was not thrown');
      } catch (error) {
        assert.ok(error.message.includes('UNAVAILABLE'), 'Error should indicate service unavailable');
      }
    });
  });
}); 