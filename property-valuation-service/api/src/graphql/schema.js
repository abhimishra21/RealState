const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Property {
    address: String!
    propertyType: PropertyType!
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int!
    yearBuilt: Int!
    condition: PropertyCondition!
    maintenanceLevel: MaintenanceLevel!
    renovationStatus: RenovationStatus!
  }

  type ValuationResult {
    value: Float!
    confidence: Float!
    explanation: String!
  }

  enum PropertyType {
    HOUSE
    APARTMENT
    CONDO
    TOWNHOUSE
  }

  enum PropertyCondition {
    EXCELLENT
    GOOD
    FAIR
    POOR
  }

  enum MaintenanceLevel {
    EXCELLENT
    GOOD
    FAIR
    POOR
  }

  enum RenovationStatus {
    RECENTLY_RENOVATED
    STANDARD
    NEEDS_RENOVATION
  }

  input PropertyInput {
    address: String!
    propertyType: PropertyType!
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int!
    yearBuilt: Int!
    condition: PropertyCondition!
    maintenanceLevel: MaintenanceLevel!
    renovationStatus: RenovationStatus!
  }

  type Query {
    calculateValuation(property: PropertyInput!): ValuationResult!
  }

  type Error {
    message: String!
    code: String!
    path: [String!]
  }

  type Mutation {
    calculateValuation(property: PropertyInput!): ValuationResult!
  }
`;

module.exports = { typeDefs }; 