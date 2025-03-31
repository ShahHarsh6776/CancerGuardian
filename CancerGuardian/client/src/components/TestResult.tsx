import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResultProps {
  riskLevel: string;
  confidence: number;
  explanation: string;
  recommendations: string[];
  imageUrl?: string;
  onBackToDashboard: () => void;
  onFindHospitals: () => void;
}

export default function TestResult({
  riskLevel,
  confidence,
  explanation,
  recommendations,
  imageUrl,
  onBackToDashboard,
  onFindHospitals
}: TestResultProps) {
  // Determine status based on risk level
  const getStatusColor = () => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'bg-success text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'high':
        return 'bg-danger text-white';
      default:
        return 'bg-neutral-500 text-white';
    }
  };
  
  const getStatusIcon = () => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-8 w-8" />;
      case 'medium':
        return <AlertCircle className="h-8 w-8" />;
      case 'high':
        return <XCircle className="h-8 w-8" />;
      default:
        return <AlertCircle className="h-8 w-8" />;
    }
  };
  
  const getProgressColor = () => {
    if (confidence < 33) return 'bg-gradient-to-r from-success to-success/70';
    if (confidence < 67) return 'bg-gradient-to-r from-warning to-warning/70';
    return 'bg-gradient-to-r from-danger to-danger/70';
  };
  
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getStatusColor()} bg-opacity-10 mb-3`}>
            {getStatusIcon()}
          </div>
          <h2 className="text-xl font-semibold font-montserrat text-neutral-800">Analysis Complete</h2>
          <p className="text-neutral-500 text-sm">Our AI has analyzed your results</p>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-neutral-800">Result Summary</h3>
            <span className={`px-2 py-1 ${getStatusColor()} text-xs font-medium rounded`}>
              {riskLevel} Risk
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {imageUrl && (
              <div className="md:w-1/3">
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <img src={imageUrl} alt="Analyzed image" className="w-full h-auto" />
                </div>
                <div className="mt-2 text-xs text-neutral-500 text-center">Uploaded image</div>
              </div>
            )}
            
            <div className={imageUrl ? "md:w-2/3" : "w-full"}>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-700">Risk Assessment:</span>
                  <span className="text-neutral-800 font-medium">{confidence}%</span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor()}`}
                    style={{ width: `${confidence}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm text-neutral-700">
                <p className="mb-2"><span className="font-medium">AI Analysis:</span> {explanation}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="font-medium text-neutral-800 mb-3">Recommendations</h3>
          <ul className="space-y-3 text-sm text-neutral-700">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-success mt-1 mr-2" />
                <span>{recommendation}</span>
              </li>
            ))}
            {recommendations.length === 0 && (
              <li className="text-neutral-500 italic">No specific recommendations available.</li>
            )}
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={onBackToDashboard}
            className="order-2 sm:order-1"
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={onFindHospitals}
            className="order-1 sm:order-2"
          >
            Find Nearby Hospitals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
