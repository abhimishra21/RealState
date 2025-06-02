package testutil

import (
	"context"
	"time"
	"topreal/property-valuation-service/pkg/valuation"
)

// CreateTestProperty creates a valid test property
func CreateTestProperty() valuation.Property {
	return valuation.Property{
		Address:          "123 Test St",
		PropertyType:     "house",
		Bedrooms:         3,
		Bathrooms:        2,
		SquareFootage:    2000,
		YearBuilt:        time.Now().Year() - 5,
		Condition:        "good",
		MaintenanceLevel: "good",
		RenovationStatus: "standard",
		Features: []string{
			"garage",
			"garden",
		},
	}
}

// CreateInvalidProperties creates a map of invalid properties for testing
func CreateInvalidProperties() map[string]valuation.Property {
	currentYear := time.Now().Year()
	
	return map[string]valuation.Property{
		"invalid_property_type": {
			Address:          "123 Test St",
			PropertyType:     "invalid_type",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
		"invalid_condition": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "invalid_condition",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
		"invalid_maintenance": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "invalid_level",
			RenovationStatus: "standard",
		},
		"invalid_renovation": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "invalid_status",
		},
		"invalid_year": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        1700, // Too old
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
		"invalid_square_footage": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        2,
			SquareFootage:    200000, // Too large
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
		"invalid_bedrooms": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         30, // Too many
			Bathrooms:        2,
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
		"invalid_bathrooms": {
			Address:          "123 Test St",
			PropertyType:     "house",
			Bedrooms:         3,
			Bathrooms:        30, // Too many
			SquareFootage:    2000,
			YearBuilt:        currentYear - 5,
			Condition:        "good",
			MaintenanceLevel: "good",
			RenovationStatus: "standard",
		},
	}
} 