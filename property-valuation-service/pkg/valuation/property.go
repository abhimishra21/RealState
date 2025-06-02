package valuation

type Property struct {
	Address           string    `json:"address"`
	PropertyType      string    `json:"propertyType"`
	Bedrooms          int       `json:"bedrooms"`
	Bathrooms         int       `json:"bathrooms"`
	SquareFootage     int       `json:"squareFootage"`
	YearBuilt         int       `json:"yearBuilt"`
	Condition         string    `json:"condition"`
	Features          []string  `json:"features"`
	Location          Location  `json:"location"`
	MaintenanceLevel  string    `json:"maintenanceLevel"`
	RenovationStatus  string    `json:"renovationStatus"`
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
} 