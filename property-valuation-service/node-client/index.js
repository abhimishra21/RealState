const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class ValuationClient {
  constructor(address = 'localhost:50051', options = {}) {
    this.address = address;
    this.options = {
      timeout: options.timeout || 5000, // Default 5 second timeout
    };

    // Load the proto file
    const PROTO_PATH = path.resolve(__dirname, '../proto/valuation.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    this.client = new protoDescriptor.valuation.ValuationService(
      this.address,
      grpc.credentials.createInsecure()
    );
  }

  // Validate property before sending to server
  validateProperty(property) {
    const errors = [];

    if (!property.address) {
      errors.push('Address is required');
    }

    if (!property.property_type) {
      errors.push('Property type is required');
    }

    if (!property.bedrooms || property.bedrooms <= 0 || property.bedrooms > 20) {
      errors.push('Invalid number of bedrooms');
    }

    if (!property.bathrooms || property.bathrooms <= 0 || property.bathrooms > 20) {
      errors.push('Invalid number of bathrooms');
    }

    if (!property.square_footage || property.square_footage <= 0 || property.square_footage > 100000) {
      errors.push('Invalid square footage');
    }

    if (!property.year_built || property.year_built < 1800 || property.year_built > new Date().getFullYear()) {
      errors.push('Invalid year built');
    }

    if (!property.condition) {
      errors.push('Condition is required');
    }

    if (!property.maintenance_level) {
      errors.push('Maintenance level is required');
    }

    if (!property.renovation_status) {
      errors.push('Renovation status is required');
    }

    return errors;
  }

  // Calculate valuation with error handling
  async calculateValuation(property) {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setMilliseconds(deadline.getMilliseconds() + this.options.timeout);

      this.client.calculateValuation(
        { property },
        { deadline },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response.result);
        }
      );
    });
  }
}

module.exports = { ValuationClient };

// Example usage
async function main() {
  const client = new ValuationClient();

  // Example property
  const property = {
    address: '123 Luxury Lane',
    property_type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    square_footage: 3000,
    year_built: new Date().getFullYear() - 1,
    condition: 'excellent',
    maintenance_level: 'excellent',
    renovation_status: 'recent',
    features: [
      'energy_efficient',
      'modern_appliances',
      'smart_home',
      'garage',
      'garden',
      'pool',
    ],
  };

  try {
    const result = await client.calculateValuation(property);
    console.log('Valuation Result:');
    console.log('Value:', result.value);
    console.log('Confidence:', result.confidence);
    console.log('Explanation:', result.explanation);
    if (result.issues && result.issues.length > 0) {
      console.log('Issues:', result.issues);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
main().catch(console.error); 