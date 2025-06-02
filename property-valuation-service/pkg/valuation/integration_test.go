package valuation

import (
	"context"
	"testing"
	"time"
	"topreal/property-valuation-service/pkg/testutil"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestValuationIntegration(t *testing.T) {
	// Start the server
	server := startTestServer(t)
	defer server.Stop()

	// Create a client
	conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
	if err != nil {
		t.Fatalf("Failed to connect to server: %v", err)
	}
	defer conn.Close()

	client := NewValuationServiceClient(conn)
	ctx := context.Background()

	t.Run("Valid Property", func(t *testing.T) {
		property := testutil.CreateTestProperty()
		resp, err := client.CalculateValuation(ctx, &ValuationRequest{
			Property: &Property{
				Address:          property.Address,
				PropertyType:     property.PropertyType,
				Bedrooms:         int32(property.Bedrooms),
				Bathrooms:        int32(property.Bathrooms),
				SquareFootage:    int32(property.SquareFootage),
				YearBuilt:        int32(property.YearBuilt),
				Condition:        property.Condition,
				MaintenanceLevel: property.MaintenanceLevel,
				RenovationStatus: property.RenovationStatus,
				Features:         property.Features,
			},
		})

		if err != nil {
			t.Errorf("CalculateValuation failed: %v", err)
			return
		}

		if resp.Result.Value <= 0 {
			t.Errorf("Expected positive value, got %v", resp.Result.Value)
		}

		if resp.Result.Confidence <= 0 || resp.Result.Confidence > 1 {
			t.Errorf("Expected confidence between 0 and 1, got %v", resp.Result.Confidence)
		}
	})

	// Test invalid properties
	invalidProperties := testutil.CreateInvalidProperties()
	for name, property := range invalidProperties {
		t.Run(name, func(t *testing.T) {
			_, err := client.CalculateValuation(ctx, &ValuationRequest{
				Property: &Property{
					Address:          property.Address,
					PropertyType:     property.PropertyType,
					Bedrooms:         int32(property.Bedrooms),
					Bathrooms:        int32(property.Bathrooms),
					SquareFootage:    int32(property.SquareFootage),
					YearBuilt:        int32(property.YearBuilt),
					Condition:        property.Condition,
					MaintenanceLevel: property.MaintenanceLevel,
					RenovationStatus: property.RenovationStatus,
					Features:         property.Features,
				},
			})

			if err == nil {
				t.Error("Expected error for invalid property, got nil")
				return
			}

			st, ok := status.FromError(err)
			if !ok {
				t.Errorf("Expected gRPC status error, got %v", err)
				return
			}

			if st.Code() != codes.InvalidArgument {
				t.Errorf("Expected InvalidArgument code, got %v", st.Code())
			}
		})
	}

	// Test timeout
	t.Run("Timeout", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(ctx, 1*time.Nanosecond)
		defer cancel()

		property := testutil.CreateTestProperty()
		_, err := client.CalculateValuation(ctx, &ValuationRequest{
			Property: &Property{
				Address:          property.Address,
				PropertyType:     property.PropertyType,
				Bedrooms:         int32(property.Bedrooms),
				Bathrooms:        int32(property.Bathrooms),
				SquareFootage:    int32(property.SquareFootage),
				YearBuilt:        int32(property.YearBuilt),
				Condition:        property.Condition,
				MaintenanceLevel: property.MaintenanceLevel,
				RenovationStatus: property.RenovationStatus,
				Features:         property.Features,
			},
		})

		if err == nil {
			t.Error("Expected timeout error, got nil")
			return
		}

		st, ok := status.FromError(err)
		if !ok {
			t.Errorf("Expected gRPC status error, got %v", err)
			return
		}

		if st.Code() != codes.DeadlineExceeded {
			t.Errorf("Expected DeadlineExceeded code, got %v", st.Code())
		}
	})
}

func startTestServer(t *testing.T) *grpc.Server {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		t.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	RegisterValuationServiceServer(s, &server{})

	go func() {
		if err := s.Serve(lis); err != nil {
			t.Errorf("Failed to serve: %v", err)
		}
	}()

	return s
} 