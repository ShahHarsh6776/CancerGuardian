import { Card, CardContent } from "@/components/ui/card";
import { cva } from "class-variance-authority";

// Define card styles with accent colors
const cardStyles = cva("relative overflow-hidden hover:scale-[1.02] transition duration-300", {
  variants: {
    type: {
      skin: "before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-accent before:to-accent/70",
      throat: "before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-secondary before:to-secondary/70",
      breast: "before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-primary before:to-primary/70",
      basic: "before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-primary-light before:to-primary",
      advanced: "before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-secondary before:to-secondary-dark"
    }
  },
  defaultVariants: {
    type: "skin"
  }
});

interface TestResultCardProps {
  testDate: string;
  testType: string;
  cancerType: string;
  result: string;
  riskLevel: string;
  onViewDetails: () => void;
}

export function TestResultCard({ 
  testDate, 
  testType, 
  cancerType, 
  result, 
  riskLevel, 
  onViewDetails 
}: TestResultCardProps) {
  // Determine result color
  const resultColor = result === "Negative" 
    ? "bg-green-100 text-green-800" 
    : result === "Positive" 
      ? "bg-red-100 text-red-800" 
      : "bg-yellow-100 text-yellow-800";
  
  // Map risk level to cancer type for the card style
  const cardType = cancerType.toLowerCase() as "skin" | "throat" | "breast";
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{testDate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{testType} - {cancerType}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${resultColor}`}>
          {result}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{riskLevel}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button 
          onClick={onViewDetails}
          className="text-primary hover:text-primary-light"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

interface TestTypeCardProps {
  type: "basic" | "advanced";
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  accuracy: string;
  onClick: () => void;
}

export function TestTypeCard({
  type,
  title,
  description,
  icon,
  duration,
  accuracy,
  onClick
}: TestTypeCardProps) {
  return (
    <Card className={cardStyles({ type })}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full ${type === 'basic' ? 'bg-primary-light bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-lg text-neutral-800 font-montserrat">{title}</h3>
            <p className="text-neutral-500 text-sm">{type === 'basic' ? 'AI-powered questionnaire' : 'Image-based analysis'}</p>
          </div>
        </div>
        
        <p className="text-neutral-600 mb-5">{description}</p>
        
        <div className="flex items-center text-xs text-neutral-500 mb-5">
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{duration}</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{accuracy}</span>
          </div>
        </div>
        
        <button 
          onClick={onClick}
          className={`w-full ${type === 'basic' ? 'bg-primary hover:bg-primary-light' : 'bg-secondary hover:bg-secondary-light'} text-white font-medium py-2.5 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center`}
        >
          <span>Start {title}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </CardContent>
    </Card>
  );
}
