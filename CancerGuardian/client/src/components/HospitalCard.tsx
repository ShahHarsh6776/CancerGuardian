import { Hospital } from "@shared/schema";
import { StarIcon, MapPinIcon, PhoneIcon, GlobeIcon } from "lucide-react";

interface HospitalCardProps {
  hospital: Hospital;
  distance?: string;
  duration?: string;
  onClick: () => void;
}

export default function HospitalCard({ 
  hospital, 
  distance = "N/A", 
  duration = "N/A",
  onClick 
}: HospitalCardProps) {
  const { name, address, specialties = [], rating = 0, reviewCount = 0 } = hospital;
  
  // Convert numeric rating to stars (e.g., 45 => 4.5)
  const displayRating = (rating / 10).toFixed(1);
  
  return (
    <div 
      className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 w-16 h-16 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="font-medium text-neutral-800">{name}</h3>
          <div className="text-sm text-neutral-600 mt-1 flex items-start">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>
          <div className="flex items-center mt-2">
            <div className="flex text-warning">
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                const ratingValue = parseInt(displayRating);
                const hasHalfStar = parseFloat(displayRating) - ratingValue === 0.5 && i === ratingValue;
                
                return (
                  <StarIcon 
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      starValue <= ratingValue 
                        ? 'text-yellow-400 fill-current' 
                        : hasHalfStar 
                          ? 'text-yellow-400 fill-current opacity-50' 
                          : 'text-neutral-300'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs text-neutral-500 ml-2">{displayRating} ({reviewCount} reviews)</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {specialties.map((specialty, index) => (
              <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                {specialty}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-medium text-primary">{distance}</div>
          <div className="text-xs text-neutral-500 mt-1">{duration}</div>
        </div>
      </div>
    </div>
  );
}
