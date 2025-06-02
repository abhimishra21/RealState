const { grpcClient } = require('../utils/grpcClient');
const { logger } = require('../utils/logger');

const resolvers = {
  Query: {
    calculateValuation: async (_, { property }) => {
      try {
        const result = await grpcClient.calculateValuation({
          address: property.address,
          property_type: property.propertyType.toLowerCase(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_footage: property.squareFootage,
          year_built: property.yearBuilt,
          condition: property.condition.toLowerCase(),
          maintenance_level: property.maintenanceLevel.toLowerCase(),
          renovation_status: property.renovationStatus.toLowerCase()
        });

        return {
          value: result.value,
          confidence: result.confidence,
          explanation: result.explanation
        };
      } catch (error) {
        logger.error('GraphQL Query Error:', error);
        throw new Error(error.message);
      }
    }
  },

  Mutation: {
    calculateValuation: async (_, { property }) => {
      try {
        const result = await grpcClient.calculateValuation({
          address: property.address,
          property_type: property.propertyType.toLowerCase(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_footage: property.squareFootage,
          year_built: property.yearBuilt,
          condition: property.condition.toLowerCase(),
          maintenance_level: property.maintenanceLevel.toLowerCase(),
          renovation_status: property.renovationStatus.toLowerCase()
        });

        return {
          value: result.value,
          confidence: result.confidence,
          explanation: result.explanation
        };
      } catch (error) {
        logger.error('GraphQL Mutation Error:', error);
        throw new Error(error.message);
      }
    }
  }
};

module.exports = { resolvers }; 