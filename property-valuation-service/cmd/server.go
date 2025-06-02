package main

import (
	"context"
	"fmt"
	"log"
	"net"

	pb "github.com/jsarcade/property-valuation-service/proto"
	"github.com/jsarcade/property-valuation-service/pkg/valuation"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedValuationServiceServer
}

func (s *server) CalculateValuation(ctx context.Context, req *pb.ValuationRequest) (*pb.ValuationResponse, error) {
	property := valuation.Property{
		Address:          req.Property.Address,
		PropertyType:     req.Property.PropertyType,
		Bedrooms:         int(req.Property.Bedrooms),
		Bathrooms:        int(req.Property.Bathrooms),
		SquareFootage:    int(req.Property.SquareFootage),
		YearBuilt:        int(req.Property.YearBuilt),
		Condition:        req.Property.Condition,
		MaintenanceLevel: req.Property.MaintenanceLevel,
		RenovationStatus: req.Property.RenovationStatus,
		Features:         req.Property.Features,
	}

	estimatedValue, confidence, explanation := valuation.CalculateValuation(property)

	return &pb.ValuationResponse{
		Result: &pb.ValuationResult{
			Value:       estimatedValue,
			Confidence:  confidence,
			Explanation: explanation,
			Issues:      []string{},
		},
	}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterValuationServiceServer(s, &server{})

	fmt.Println("Property Valuation gRPC Server is running on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
} 