const { ValuationClient } = require('../index');
const assert = require('assert');
const grpc = require('@grpc/grpc-js');
const sinon = require('sinon');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

describe('ValuationClient Unit Tests', () => {
  let client;
  let mockClient;
  let protoStub;

  beforeEach(() => {
    // Create a mock gRPC client
    mockClient = {
      calculateValuation: sinon.stub(),
      waitForReady: sinon.stub().yields(null),
    };

    // Mock the proto loader
    protoStub = sinon.stub(protoLoader, 'loadSync').returns({
      valuation: {
        ValuationService: {
          service: {
            calculateValuation: {
              requestStream: false,
              responseStream: false,
              requestType: {},
              responseType: {},
            },
          },
        },
      },
    });

    // Mock the gRPC client constructor
    const ValuationService = function(address, credentials) {
      return mockClient;
    };
    ValuationService.service = {
      calculateValuation: {
        requestStream: false,
        responseStream: false,
        requestType: {},
        responseType: {},
      },
    };

    const mockProtoDescriptor = {
      valuation: {
        ValuationService: ValuationService
      }
    };

    sinon.stub(grpc, 'loadPackageDefinition').returns(mockProtoDescriptor);

    client = new ValuationClient('127.0.0.1:50051');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Constructor', () => {
    it('should create a client with default options', () => {
      assert.ok(client);
      assert.strictEqual(client.address, '127.0.0.1:50051');
      assert.strictEqual(client.options.timeout, 5000);
    });

    it('should create a client with custom options', () => {
      const customClient = new ValuationClient('127.0.0.1:50051', { timeout: 1000 });
      assert.strictEqual(customClient.options.timeout, 1000);
    });
  });

  describe('calculateValuation', () => {
    it('should successfully calculate valuation', async () => {
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

      const expectedResult = {
        value: 500000,
        confidence: 0.85,
        explanation: 'Test result',
      };

      mockClient.calculateValuation.callsFake((request, options, callback) => {
        callback(null, { result: expectedResult });
      });

      const result = await client.calculateValuation(property);
      assert.deepStrictEqual(result, expectedResult);
    });

    it('should handle gRPC errors', async () => {
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

      const error = new Error('Test error');
      error.code = grpc.status.INVALID_ARGUMENT;

      mockClient.calculateValuation.callsFake((request, options, callback) => {
        callback(error);
      });

      try {
        await client.calculateValuation(property);
        assert.fail('Expected error was not thrown');
      } catch (err) {
        assert.strictEqual(err.code, error.code);
        assert.strictEqual(err.message, error.message);
      }
    });

    it('should handle timeout errors', async () => {
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

      const error = new Error('Deadline exceeded');
      error.code = grpc.status.DEADLINE_EXCEEDED;

      mockClient.calculateValuation.callsFake((request, options, callback) => {
        callback(error);
      });

      try {
        await client.calculateValuation(property);
        assert.fail('Expected error was not thrown');
      } catch (err) {
        assert.strictEqual(err.code, error.code);
        assert.strictEqual(err.message, error.message);
      }
    });

    it('should handle connection errors', async () => {
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

      const error = new Error('Connection failed');
      error.code = grpc.status.UNAVAILABLE;

      mockClient.calculateValuation.callsFake((request, options, callback) => {
        callback(error);
      });

      try {
        await client.calculateValuation(property);
        assert.fail('Expected error was not thrown');
      } catch (err) {
        assert.strictEqual(err.code, error.code);
        assert.strictEqual(err.message, error.message);
      }
    });
  });
}); 