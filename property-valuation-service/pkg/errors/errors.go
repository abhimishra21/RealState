package errors

import (
	"fmt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ValidationError represents an error in property validation
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: %s - %s", e.Field, e.Message)
}

// ConvertToGRPCError converts internal errors to gRPC errors
func ConvertToGRPCError(err error) error {
	switch e := err.(type) {
	case *ValidationError:
		return status.Error(codes.InvalidArgument, e.Error())
	default:
		return status.Error(codes.Internal, "internal server error")
	}
}

// Common validation error messages
const (
	ErrInvalidPropertyType     = "invalid property type"
	ErrInvalidCondition        = "invalid condition"
	ErrInvalidMaintenanceLevel = "invalid maintenance level"
	ErrInvalidRenovationStatus = "invalid renovation status"
	ErrInvalidYearBuilt        = "invalid year built"
	ErrInvalidSquareFootage    = "invalid square footage"
	ErrInvalidBedrooms         = "invalid number of bedrooms"
	ErrInvalidBathrooms        = "invalid number of bathrooms"
) 