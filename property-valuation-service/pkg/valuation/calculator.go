package valuation

import (
	"fmt"
	"math"
	"time"
)

// BasePricePerSquareFoot represents the base price per square foot for different property types
var BasePricePerSquareFoot = map[string]float64{
	// Residential - Urban
	"apartment":    250.0,  // Standard urban apartment
	"house":        300.0,  // Urban single-family home
	"condo":        275.0,  // Urban condominium
	"townhouse":    285.0,  // Urban townhouse
	"villa":        350.0,  // Luxury urban villa
	"studio":       225.0,  // Urban studio apartment
	"loft":         275.0,  // Urban loft conversion
	"penthouse":    400.0,  // Luxury penthouse
	
	// Residential - Suburban
	"suburban_house":    275.0,  // Suburban single-family home
	"suburban_condo":    250.0,  // Suburban condominium
	"suburban_townhouse": 260.0, // Suburban townhouse
	
	// Commercial - Office
	"office_class_a":    200.0,  // Class A office space
	"office_class_b":    175.0,  // Class B office space
	"office_class_c":    150.0,  // Class C office space
	
	// Commercial - Retail
	"retail_high_street": 225.0,  // High street retail
	"retail_mall":        200.0,  // Shopping mall space
	"retail_strip":       175.0,  // Strip mall space
	
	// Commercial - Industrial
	"warehouse":    125.0,  // Standard warehouse
	"industrial":   100.0,  // Industrial space
	"logistics":    150.0,  // Modern logistics facility
	"manufacturing": 120.0, // Manufacturing space
}

// PropertyCondition represents detailed criteria for property conditions
type PropertyCondition struct {
	Multiplier    float64   `json:"multiplier"`
	Criteria      []string  `json:"criteria"`
	Description   string    `json:"description"`
	MinYearBuilt  int       `json:"minYearBuilt"`  // Minimum year built for this condition
	MaxYearBuilt  int       `json:"maxYearBuilt"`  // Maximum year built for this condition
	RequiredFeatures []string `json:"requiredFeatures"` // Features that must be present
	ExcludedFeatures []string `json:"excludedFeatures"` // Features that cannot be present
	MaintenanceLevel string  `json:"maintenanceLevel"` // Expected maintenance level
	RenovationStatus string  `json:"renovationStatus"` // Expected renovation status
}

// ValidationIssue represents a specific validation issue with its severity
type ValidationIssue struct {
	Description string
	Severity    float64 // 0.0 to 1.0, where 1.0 is most severe
	Category    string  // "age", "feature", "maintenance", "renovation"
}

// ValidationResult represents the complete validation result
type ValidationResult struct {
	IsValid     bool
	Issues      []ValidationIssue
	TotalScore  float64 // 0.0 to 1.0, where 1.0 is perfect
	Adjustments map[string]float64
}

// ValidateCondition checks if a property meets the criteria for its claimed condition
func ValidateCondition(property Property, condition PropertyCondition) ValidationResult {
	var issues []ValidationIssue
	adjustments := make(map[string]float64)
	totalScore := 1.0

	// Validate year built
	yearScore := 1.0
	if property.YearBuilt < condition.MinYearBuilt || property.YearBuilt > condition.MaxYearBuilt {
		severity := 0.8
		if property.YearBuilt < condition.MinYearBuilt {
			severity = 0.9 // More severe if too old
		}
		issues = append(issues, ValidationIssue{
			Description: fmt.Sprintf("Property year built (%d) is outside the acceptable range (%d-%d) for %s condition",
				property.YearBuilt, condition.MinYearBuilt, condition.MaxYearBuilt, condition.Description),
			Severity: severity,
			Category: "age",
		})
		yearScore = 0.5
	}
	adjustments["age"] = yearScore
	totalScore *= yearScore

	// Validate required features
	featureScore := 1.0
	missingFeatures := 0
	for _, required := range condition.RequiredFeatures {
		found := false
		for _, feature := range property.Features {
			if feature == required {
				found = true
				break
			}
		}
		if !found {
			missingFeatures++
			issues = append(issues, ValidationIssue{
				Description: fmt.Sprintf("Missing required feature: %s", required),
				Severity:    0.7,
				Category:    "feature",
			})
		}
	}
	if missingFeatures > 0 {
		featureScore = 1.0 - (float64(missingFeatures) * 0.2) // 20% reduction per missing feature
	}
	adjustments["features"] = featureScore
	totalScore *= featureScore

	// Validate excluded features
	excludedScore := 1.0
	for _, excluded := range condition.ExcludedFeatures {
		for _, feature := range property.Features {
			if feature == excluded {
				issues = append(issues, ValidationIssue{
					Description: fmt.Sprintf("Property has excluded feature: %s", excluded),
					Severity:    0.6,
					Category:    "feature",
				})
				excludedScore *= 0.8 // 20% reduction for each excluded feature
			}
		}
	}
	adjustments["excluded_features"] = excludedScore
	totalScore *= excludedScore

	// Validate maintenance level
	maintenanceScore := 1.0
	if property.MaintenanceLevel != condition.MaintenanceLevel {
		severity := 0.5
		if property.MaintenanceLevel == "very_poor" && condition.MaintenanceLevel == "excellent" {
			severity = 0.9
		}
		issues = append(issues, ValidationIssue{
			Description: fmt.Sprintf("Maintenance level (%s) does not match expected level (%s) for %s condition",
				property.MaintenanceLevel, condition.MaintenanceLevel, condition.Description),
			Severity: severity,
			Category: "maintenance",
		})
		maintenanceScore = 0.7
	}
	adjustments["maintenance"] = maintenanceScore
	totalScore *= maintenanceScore

	// Validate renovation status
	renovationScore := 1.0
	if property.RenovationStatus != condition.RenovationStatus {
		severity := 0.6
		if property.RenovationStatus == "needs_renovation" && condition.RenovationStatus == "recent" {
			severity = 0.9
		}
		issues = append(issues, ValidationIssue{
			Description: fmt.Sprintf("Renovation status (%s) does not match expected status (%s) for %s condition",
				property.RenovationStatus, condition.RenovationStatus, condition.Description),
			Severity: severity,
			Category: "renovation",
		})
		renovationScore = 0.7
	}
	adjustments["renovation"] = renovationScore
	totalScore *= renovationScore

	return ValidationResult{
		IsValid:     len(issues) == 0,
		Issues:      issues,
		TotalScore:  totalScore,
		Adjustments: adjustments,
	}
}

// ConditionCriteria represents the detailed criteria for different property conditions
var ConditionCriteria = map[string]PropertyCondition{
	"excellent": {
		Multiplier:    1.40,  // 40% premium for excellent condition
		Description:   "Like new, fully renovated, premium finishes",
		MinYearBuilt:  time.Now().Year() - 2,
		MaxYearBuilt:  time.Now().Year(),
		RequiredFeatures: []string{
			"energy_efficient",
			"modern_appliances",
			"smart_home",
		},
		ExcludedFeatures: []string{
			"needs_repair",
			"outdated_systems",
			"major_repairs_needed",
		},
		MaintenanceLevel: "excellent",
		RenovationStatus: "recent",
		Criteria: []string{
			"Built or renovated within last 2 years",
			"High-end finishes and materials",
			"All systems (HVAC, electrical, plumbing) in perfect condition",
			"No visible wear or damage",
			"Modern appliances and fixtures",
			"Energy efficient systems",
			"Professional landscaping",
			"Smart home technology",
		},
	},
	"very_good": {
		Multiplier:    1.25,  // 25% premium for very good condition
		Description:   "Well maintained, minor updates needed",
		MinYearBuilt:  time.Now().Year() - 5,
		MaxYearBuilt:  time.Now().Year(),
		RequiredFeatures: []string{
			"updated_systems",
			"modern_appliances",
		},
		ExcludedFeatures: []string{
			"major_repairs_needed",
			"outdated_systems",
		},
		MaintenanceLevel: "very_good",
		RenovationStatus: "recent",
		Criteria: []string{
			"Built or renovated within last 5 years",
			"Quality finishes and materials",
			"All systems functioning properly",
			"Minimal wear and tear",
			"Updated appliances and fixtures",
			"Good maintenance history",
			"Attractive landscaping",
		},
	},
	"good": {
		Multiplier:    1.10,  // 10% premium for good condition
		Description:   "Standard condition, some wear",
		MinYearBuilt:  time.Now().Year() - 10,
		MaxYearBuilt:  time.Now().Year(),
		RequiredFeatures: []string{
			"functional_systems",
		},
		ExcludedFeatures: []string{
			"system_failures",
			"major_repairs_needed",
		},
		MaintenanceLevel: "good",
		RenovationStatus: "standard",
		Criteria: []string{
			"Built or renovated within last 10 years",
			"Standard finishes and materials",
			"Systems in working order",
			"Normal wear and tear",
			"Functional appliances and fixtures",
			"Regular maintenance",
			"Basic landscaping",
		},
	},
	"fair": {
		Multiplier:    0.90,  // 10% discount for fair condition
		Description:   "Needs some repairs and updates",
		MinYearBuilt:  time.Now().Year() - 15,
		MaxYearBuilt:  time.Now().Year(),
		RequiredFeatures: []string{},
		ExcludedFeatures: []string{
			"major_system_failures",
		},
		MaintenanceLevel: "fair",
		RenovationStatus: "needs_updates",
		Criteria: []string{
			"Built or renovated within last 15 years",
			"Some outdated finishes",
			"Systems need minor repairs",
			"Visible wear and tear",
			"Some outdated appliances",
			"Inconsistent maintenance",
			"Basic or neglected landscaping",
		},
	},
	"poor": {
		Multiplier:    0.75,  // 25% discount for poor condition
		Description:   "Needs significant repairs",
		MinYearBuilt:  time.Now().Year() - 20,
		MaxYearBuilt:  time.Now().Year(),
		RequiredFeatures: []string{},
		ExcludedFeatures: []string{},
		MaintenanceLevel: "poor",
		RenovationStatus: "needs_repairs",
		Criteria: []string{
			"Built or renovated within last 20 years",
			"Dated finishes and materials",
			"Systems need major repairs",
			"Significant wear and damage",
			"Outdated or non-functioning appliances",
			"Poor maintenance history",
			"Minimal or no landscaping",
		},
	},
	"needs_work": {
		Multiplier:    0.60,  // 40% discount for needs work
		Description:   "Major renovation required",
		MinYearBuilt:  0,
		MaxYearBuilt:  time.Now().Year() - 20,
		RequiredFeatures: []string{},
		ExcludedFeatures: []string{},
		MaintenanceLevel: "very_poor",
		RenovationStatus: "needs_renovation",
		Criteria: []string{
			"Over 20 years old with no recent updates",
			"Deteriorated finishes and materials",
			"Systems need complete replacement",
			"Extensive damage and wear",
			"Non-functioning or missing appliances",
			"Long-term neglect",
			"No landscaping",
		},
	},
}

// FeatureValue represents the value added by different property features
var FeatureValue = map[string]float64{
	// Exterior Features
	"garage":         20000.0,
	"garden":         25000.0,
	"pool":           35000.0,
	"tennis_court":   40000.0,
	"security_gate":  15000.0,
	"fence":          10000.0,
	"patio":          12000.0,
	"deck":           15000.0,
	"balcony":        8000.0,
	"roof_garden":    30000.0,
	
	// Interior Features
	"fireplace":      12000.0,
	"basement":       30000.0,
	"wine_cellar":    25000.0,
	"home_office":    15000.0,
	"walk_in_closet": 8000.0,
	"laundry_room":   10000.0,
	"mudroom":        5000.0,
	
	// Smart Home Features
	"smart_home":     20000.0,
	"security_system": 15000.0,
	"cctv":           10000.0,
	
	// Energy Features
	"solar_panels":   25000.0,
	"energy_efficient": 15000.0,
	"double_glazing": 12000.0,
	
	// Luxury Features
	"elevator":       40000.0,
	"concierge":      20000.0,
	"gym":            30000.0,
	"spa":            35000.0,
	"movie_room":     25000.0,
}

// LocationMultiplier represents the multiplier for different property locations
var LocationMultiplier = map[string]float64{
	"urban":      1.20,  // City center
	"suburban":   1.00,  // Suburbs
	"rural":      0.85,  // Countryside
	"waterfront": 1.30,  // Waterfront property
	"mountain":   1.15,  // Mountain view
	"beach":      1.25,  // Beachfront
}

// CalculateValuation performs the property valuation based on various factors
func CalculateValuation(property Property) (float64, float64, string) {
	// Get base price per square foot for the property type
	basePrice, exists := BasePricePerSquareFoot[property.PropertyType]
	if !exists {
		basePrice = BasePricePerSquareFoot["apartment"] // Default to apartment if type not found
	}

	// Calculate base value from square footage
	baseValue := float64(property.SquareFootage) * basePrice

	// Apply condition multiplier with detailed criteria
	condition, exists := ConditionCriteria[property.Condition]
	if !exists {
		condition = ConditionCriteria["good"] // Default to good if condition not found
	}

	// Validate the property against the condition criteria
	validationResult := ValidateCondition(property, condition)
	
	// Apply the validation adjustments to the multiplier
	adjustedMultiplier := condition.Multiplier * validationResult.TotalScore
	baseValue *= adjustedMultiplier

	// Add value for features
	featureValue := 0.0
	for _, feature := range property.Features {
		if value, exists := FeatureValue[feature]; exists {
			featureValue += value
		}
	}
	baseValue += featureValue

	// Adjust for age (depreciation)
	currentYear := time.Now().Year()
	age := currentYear - property.YearBuilt
	ageDepreciation := math.Max(0.7, 1.0-(float64(age)*0.005)) // Maximum 30% depreciation
	baseValue *= ageDepreciation

	// Adjust for number of bedrooms and bathrooms
	bedroomValue := float64(property.Bedrooms) * 25000.0
	bathroomValue := float64(property.Bathrooms) * 15000.0
	baseValue += bedroomValue + bathroomValue

	// Calculate confidence score
	confidence := 0.85 // Base confidence
	if len(property.Features) > 0 {
		confidence += 0.05 // Higher confidence if features are provided
	}
	if property.Condition != "" {
		confidence += 0.05 // Higher confidence if condition is specified
	}
	if validationResult.IsValid {
		confidence += 0.05 // Higher confidence if condition criteria are met
	}
	confidence = math.Min(0.95, confidence) // Cap confidence at 95%

	// Generate detailed explanation
	explanation := "Valuation based on:\n"
	explanation += fmt.Sprintf("- Base value: $%.2f per sq ft for %s property\n", basePrice, property.PropertyType)
	explanation += fmt.Sprintf("- Condition: %s (base multiplier: %.2f)\n", condition.Description, condition.Multiplier)
	
	if !validationResult.IsValid {
		explanation += "\nCondition validation issues:\n"
		for _, issue := range validationResult.Issues {
			explanation += fmt.Sprintf("  ! [%s] %s (Severity: %.1f)\n", 
				issue.Category, issue.Description, issue.Severity)
		}
		explanation += "\nAdjustment factors applied:\n"
		for category, adjustment := range validationResult.Adjustments {
			explanation += fmt.Sprintf("  * %s: %.2f\n", category, adjustment)
		}
		explanation += fmt.Sprintf("  Final multiplier: %.2f\n", adjustedMultiplier)
	}

	explanation += fmt.Sprintf("- Feature additions: $%.2f\n", featureValue)
	explanation += fmt.Sprintf("- Age-based depreciation: %.2f\n", ageDepreciation)
	explanation += fmt.Sprintf("- Bedroom value: $%.2f\n", bedroomValue)
	explanation += fmt.Sprintf("- Bathroom value: $%.2f\n", bathroomValue)

	return baseValue, confidence, explanation
} 