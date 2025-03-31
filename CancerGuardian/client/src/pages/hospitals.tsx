import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { useQuery } from "@tanstack/react-query";
import { Hospital } from "@shared/schema";
import HospitalCard from "@/components/HospitalCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Search, Locate, ChevronLeft, ChevronRight } from "lucide-react";

export default function Hospitals() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const itemsPerPage = 3;
  
  // Fetch hospitals
  const { 
    data: hospitals,
    isLoading,
    isError
  } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals'],
  });
  
  // Filter hospitals based on search query
  const filteredHospitals = hospitals?.filter(hospital => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      hospital.name.toLowerCase().includes(query) ||
      hospital.address.toLowerCase().includes(query) ||
      (hospital.specialties && hospital.specialties.some(s => s.toLowerCase().includes(query)))
    );
  }) || [];
  
  // Calculate pagination
  const totalPages = Math.ceil((filteredHospitals.length || 0) / itemsPerPage);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Get user's location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Locating you",
      description: "Please allow location access to find nearby hospitals",
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast({
          title: "Location found",
          description: "We've found your location and are finding hospitals near you",
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message,
          variant: "destructive"
        });
      }
    );
  };
  
  // Calculate distance from user (simulated for this implementation)
  const calculateDistance = (hospital: Hospital) => {
    if (!userLocation || !hospital.latitude || !hospital.longitude) {
      return "N/A";
    }
    
    // Simple distance calculation (would be replaced with actual geodesic distance calculation)
    // In a real implementation, this would use the Haversine formula or a mapping API
    const lat1 = userLocation.lat;
    const lon1 = userLocation.lng;
    const lat2 = parseFloat(hospital.latitude);
    const lon2 = parseFloat(hospital.longitude);
    
    // Simple Euclidean distance (not accurate for geographic coordinates but for demonstration)
    const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // 111 km per degree
    
    return distance.toFixed(1) + " miles";
  };
  
  // Calculate estimated travel time (simulated)
  const calculateTravelTime = (hospital: Hospital) => {
    if (!userLocation || !hospital.latitude || !hospital.longitude) {
      return "N/A";
    }
    
    // Simple time estimation (would be replaced with actual routing API)
    const dist = parseFloat(calculateDistance(hospital).split(" ")[0]);
    const minutes = Math.round(dist * 2); // Assuming average speed
    
    return minutes + " min drive";
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle hospital selection
  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-montserrat font-semibold text-neutral-800">Nearby Hospitals</h1>
          <p className="text-neutral-500 mt-1">Find healthcare facilities near your location</p>
        </div>
        
        {/* Search Bar */}
        <Card className="bg-white rounded-lg shadow-sm mb-8">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Search by location or hospital name" 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button type="submit">
                  Find Hospitals
                </Button>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={getUserLocation}
                  className="w-full md:w-auto flex items-center justify-center"
                >
                  <Locate className="mr-2 h-4 w-4 text-primary" />
                  Use My Location
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Hospital Listing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Hospital List */}
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
                <h2 className="font-medium text-neutral-800">Hospitals & Medical Centers</h2>
                <div className="text-sm text-neutral-500">{filteredHospitals.length} results found</div>
              </div>
              
              <div className="divide-y divide-neutral-200">
                {isLoading ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="ml-4 flex-grow">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-3 w-1/4 mb-2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : isError ? (
                  // Error state
                  <div className="p-8 text-center">
                    <p className="text-neutral-600">Failed to load hospitals. Please try again later.</p>
                  </div>
                ) : filteredHospitals.length === 0 ? (
                  // Empty state
                  <div className="p-8 text-center">
                    <p className="text-neutral-600">No hospitals found matching your search.</p>
                  </div>
                ) : (
                  // Hospital cards
                  paginatedHospitals.map((hospital) => (
                    <HospitalCard
                      key={hospital.id}
                      hospital={hospital}
                      distance={calculateDistance(hospital)}
                      duration={calculateTravelTime(hospital)}
                      onClick={() => handleHospitalSelect(hospital)}
                    />
                  ))
                )}
              </div>
              
              {/* Pagination */}
              {filteredHospitals.length > 0 && (
                <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-sm text-neutral-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredHospitals.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredHospitals.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          {/* Right: Map or Hospital Details */}
          <div>
            <Card className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
              {selectedHospital ? (
                <div className="p-4 h-full">
                  <div className="mb-4 flex justify-between items-start">
                    <h3 className="text-lg font-medium text-neutral-800">{selectedHospital.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedHospital(null)}
                    >
                      &times;
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <p className="text-neutral-600">{selectedHospital.address}</p>
                    </div>
                    
                    {selectedHospital.phone && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-neutral-600">{selectedHospital.phone}</p>
                      </div>
                    )}
                    
                    {selectedHospital.website && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a href={`https://${selectedHospital.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedHospital.website}
                        </a>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-neutral-700 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHospital.specialties?.map((specialty, index) => (
                          <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4">
                      Get Directions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative h-full" style={{ minHeight: "400px" }}>
                  {/* Placeholder for map */}
                  <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-neutral-500">Select a hospital to view details</p>
                      {userLocation && <p className="text-xs text-neutral-400 mt-1">Your location is set</p>}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
