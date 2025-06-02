package validation

import (
	"time"
	"topreal/property-valuation-service/pkg/errors"
	"topreal/property-valuation-service/pkg/valuation"
)

// ValidateProperty validates a property's fields
func ValidateProperty(property valuation.Property) error {
	// Validate property type
	if _, exists := valuation.BasePricePerSquareFoot[property.PropertyType]; !exists {
		return &errors.ValidationError{
			Field:   "property_type",
			Message: errors.ErrInvalidPropertyType,
		}
	}

	// Validate condition
	if _, exists := valuation.ConditionCriteria[property.Condition]; !exists {
		return &errors.ValidationError{
			Field:   "condition",
			Message: errors.ErrInvalidCondition,
		}
	}

	// Validate maintenance level
	validMaintenanceLevels := map[string]bool{
		"excellent":   true,
		"very_good":   true,
		"good":        true,
		"fair":        true,
		"poor":        true,
		"very_poor":   true,
	}
	if !validMaintenanceLevels[property.MaintenanceLevel] {
		return &errors.ValidationError{
			Field:   "maintenance_level",
			Message: errors.ErrInvalidMaintenanceLevel,
		}
	}

	// Validate renovation status
	validRenovationStatuses := map[string]bool{
		"recent":           true,
		"standard":         true,
		"needs_updates":    true,
		"needs_repairs":    true,
		"needs_renovation": true,
	}
	if !validRenovationStatuses[property.RenovationStatus] {
		return &errors.ValidationError{
			Field:   "renovation_status",
			Message: errors.ErrInvalidRenovationStatus,
		}
	}

	// Validate year built
	currentYear := time.Now().Year()
	if property.YearBuilt < 1800 || property.YearBuilt > currentYear {
		return &errors.ValidationError{
			Field:   "year_built",
			Message: errors.ErrInvalidYearBuilt,
		}
	}

	// Validate square footage
	if property.SquareFootage <= 0 || property.SquareFootage > 100000 {
		return &errors.ValidationError{
			Field:   "square_footage",
			Message: errors.ErrInvalidSquareFootage,
		}
	}

	// Validate bedrooms
	if property.Bedrooms <= 0 || property.Bedrooms > 20 {
		return &errors.ValidationError{
			Field:   "bedrooms",
			Message: errors.ErrInvalidBedrooms,
		}
	}

	// Validate bathrooms
	if property.Bathrooms <= 0 || property.Bathrooms > 20 {
		return &errors.ValidationError{
			Field:   "bathrooms",
			Message: errors.ErrInvalidBathrooms,
		}
	}

	return nil
} 