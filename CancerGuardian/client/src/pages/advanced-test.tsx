import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Info, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import TestResult from "@/components/TestResult";
import { useMutation } from "@tanstack/react-query";

type BodyArea = "skin" | "throat" | "breast" | "";
type QuestionnaireItem = {
  question: string;
  answer: string;
};

// Custom hook for image handling
const useImageAnalysis = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeImageMutation = useMutation({
    mutationFn: async ({ file, cancerType }: { file: File; cancerType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cancer_type', cancerType);
      formData.append('user_id', String(user?.id || ''));

      console.log('Sending request with:', {
        cancer_type: cancerType,
        user_id: String(user?.id || ''),
        file_name: file.name,
        file_size: file.size
      });

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response:', errorData);
        throw new Error(errorData?.detail || 'Failed to analyze image');
      }

      const data = await response.json();
      console.log('Received response:', data);
      return data;
    },
    onError: (error: any) => {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing your image. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    analyzeImage: analyzeImageMutation.mutateAsync,
    isAnalyzing: analyzeImageMutation.isPending
  };
};

export default function AdvancedTest() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyzeImage, isAnalyzing } = useImageAnalysis();
  
  const [currentStep, setCurrentStep] = useState<'select-area' | 'answer-questions' | 'upload-image' | 'view-results'>('select-area');
  const [selectedBodyArea, setSelectedBodyArea] = useState<BodyArea>("");
  const [duration, setDuration] = useState<string>("");
  const [pain, setPain] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<{
    riskLevel: string;
    confidence: number;
    explanation: string;
    recommendations: string[];
  } | null>(null);
  
  // Select body area
  const handleBodyAreaSelection = (area: BodyArea) => {
    setSelectedBodyArea(area);
    setCurrentStep('answer-questions');
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file",
        variant: "destructive"
      });
      return;
    }
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    switch (currentStep) {
      case 'select-area':
        setCurrentStep('answer-questions');
        break;
      case 'answer-questions':
        if (!duration || !pain) {
          toast({
            title: "Incomplete information",
            description: "Please answer all questions before proceeding",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep('upload-image');
        break;
      case 'upload-image':
        if (!imageFile) {
          toast({
            title: "Image required",
            description: "Please upload an image for analysis",
            variant: "destructive"
          });
          return;
        }
        handleAnalyzeImage();
        break;
    }
  };
  
  // Go back to previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'answer-questions':
        setCurrentStep('select-area');
        break;
      case 'upload-image':
        setCurrentStep('answer-questions');
        break;
      case 'view-results':
        // Normally we wouldn't go back from results, but if needed:
        setCurrentStep('upload-image');
        break;
    }
  };
  
  // Modified analyzeImage function
  const handleAnalyzeImage = async () => {
    try {
      if (!imageFile || !selectedBodyArea) {
        toast({
          title: "Missing information",
          description: "Please select a body area and upload an image",
          variant: "destructive"
        });
        return;
      }

      const data = await analyzeImage({ file: imageFile, cancerType: selectedBodyArea });
      
      // Set the assessment data based on ML model response
      setAssessment({
        riskLevel: data.prediction === "Cancerous" ? "High" : "Low",
        confidence: data.confidence * 100,
        explanation: `Based on the analysis of your ${selectedBodyArea} image, the model has determined this to be ${data.prediction.toLowerCase()} with ${(data.confidence * 100).toFixed(1)}% confidence.`,
        recommendations: [
          data.prediction === "Cancerous" 
            ? "We strongly recommend consulting with a healthcare professional for further evaluation."
            : "While the analysis suggests no immediate concerns, we recommend regular check-ups and monitoring.",
          "Keep track of any changes in the affected area.",
          "Document any new symptoms or changes over time."
        ]
      });
      
      // Save the test result with the image path
      await saveTestResult([
        { question: "Which body area is affected?", answer: selectedBodyArea },
        { question: "How long have you noticed this issue?", answer: duration },
        { question: "Have you experienced any pain in this area?", answer: pain }
      ], {
        ...data,
        imageUrl: `http://localhost:8000${data.image_url}` // Use the full URL path from backend
      });
      
      setCurrentStep('view-results');
    } catch (error) {
      console.error("Error in image analysis:", error);
    }
  };
  
  // Modified saveTestResult function
  const saveTestResult = async (questionnaire: QuestionnaireItem[], assessment: any) => {
    try {
      const testResult = {
        testType: "advanced",
        cancerType: selectedBodyArea,
        result: assessment.confidence > 60 ? "positive" : assessment.confidence > 30 ? "inconclusive" : "negative",
        riskLevel: assessment.riskLevel.toLowerCase(),
        confidence: assessment.confidence,
        recommendations: assessment.recommendations.join("; "),
        questionnaire: questionnaire,
        imageUrl: assessment.imageUrl, // Use the image path from the backend
        userId: user?.id // Include user ID for session storage
      };
      
      await apiRequest("/api/test-results", {
        method: "POST",
        body: JSON.stringify(testResult)
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-results'] });
      
      toast({
        title: "Test completed",
        description: "Your test result has been saved to your profile.",
      });
    } catch (error) {
      console.error("Error saving test result:", error);
      toast({
        title: "Error",
        description: "Failed to save test result.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/cancer-test')}
            className="mr-4 text-neutral-600 hover:text-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-montserrat font-semibold text-neutral-800">Advanced Image-Based Test</h1>
            <p className="text-neutral-500 text-sm mt-1">Upload an image for AI-powered analysis</p>
          </div>
        </div>
        
        {/* Test Steps Progress */}
        <div className="flex justify-between mb-8 relative">
          <div className="hidden md:block absolute top-4 left-0 w-full h-1 bg-neutral-200 -z-10"></div>
          
          <div className="text-center">
            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${currentStep === 'select-area' ? 'bg-primary' : currentStep === 'answer-questions' || currentStep === 'upload-image' || currentStep === 'view-results' ? 'bg-primary' : 'bg-neutral-300'} text-white mb-2`}>
              1
            </div>
            <span className={`text-xs font-medium ${currentStep === 'select-area' ? 'text-neutral-700' : 'text-neutral-500'}`}>Select Area</span>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${currentStep === 'answer-questions' ? 'bg-primary' : currentStep === 'upload-image' || currentStep === 'view-results' ? 'bg-primary' : 'bg-neutral-300'} text-white mb-2`}>
              2
            </div>
            <span className={`text-xs font-medium ${currentStep === 'answer-questions' ? 'text-neutral-700' : 'text-neutral-500'}`}>Answer Questions</span>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${currentStep === 'upload-image' ? 'bg-primary' : currentStep === 'view-results' ? 'bg-primary' : 'bg-neutral-300'} text-white mb-2`}>
              3
            </div>
            <span className={`text-xs font-medium ${currentStep === 'upload-image' ? 'text-neutral-700' : 'text-neutral-500'}`}>Upload Image</span>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${currentStep === 'view-results' ? 'bg-primary' : 'bg-neutral-300'} text-white mb-2`}>
              4
            </div>
            <span className={`text-xs font-medium ${currentStep === 'view-results' ? 'text-neutral-700' : 'text-neutral-500'}`}>View Results</span>
          </div>
        </div>
        
        {/* Step 1: Select Area */}
        {currentStep === 'select-area' && (
          <>
            <Card className="bg-white rounded-lg shadow-sm mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-neutral-800 mb-4">Select the affected body area</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => handleBodyAreaSelection('skin')} 
                    className="lab-card skin cursor-pointer bg-white border border-neutral-200 rounded-lg p-4 hover:border-primary transition duration-150 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-accent before:to-accent/70"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-accent bg-opacity-10 flex items-center justify-center mb-3 text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-neutral-800">Skin</h3>
                      <p className="text-xs text-neutral-500 mt-1">Moles, lesions, unusual growths</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => handleBodyAreaSelection('throat')} 
                    className="lab-card throat cursor-pointer bg-white border border-neutral-200 rounded-lg p-4 hover:border-primary transition duration-150 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-secondary before:to-secondary/70"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-secondary bg-opacity-10 flex items-center justify-center mb-3 text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-neutral-800">Throat</h3>
                      <p className="text-xs text-neutral-500 mt-1">Throat tissue, vocal cords</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => handleBodyAreaSelection('breast')} 
                    className="lab-card breast cursor-pointer bg-white border border-neutral-200 rounded-lg p-4 hover:border-primary transition duration-150 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-primary before:to-primary/70"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-3 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-neutral-800">Breast</h3>
                      <p className="text-xs text-neutral-500 mt-1">Breast tissue, mammogram images</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8 flex items-start">
              <div className="text-primary mr-3 mt-1">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-700">Select the body area that corresponds to your concern. This helps us use the most appropriate AI model for analysis.</p>
              </div>
            </div>
          </>
        )}
        
        {/* Step 2: Answer Questions */}
        {currentStep === 'answer-questions' && (
          <>
            <Card className="bg-white rounded-lg shadow-sm mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-neutral-800 mb-4">Please answer a few quick questions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-neutral-700 font-medium mb-3">How long have you noticed this issue?</h3>
                    <RadioGroup 
                      value={duration} 
                      onValueChange={setDuration}
                      className="space-y-3"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="Less than 1 week" id="duration-1" />
                        <Label htmlFor="duration-1" className="ml-3 cursor-pointer">Less than 1 week</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="1-4 weeks" id="duration-2" />
                        <Label htmlFor="duration-2" className="ml-3 cursor-pointer">1-4 weeks</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="1-3 months" id="duration-3" />
                        <Label htmlFor="duration-3" className="ml-3 cursor-pointer">1-3 months</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="More than 3 months" id="duration-4" />
                        <Label htmlFor="duration-4" className="ml-3 cursor-pointer">More than 3 months</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <h3 className="text-neutral-700 font-medium mb-3">Have you experienced any pain in this area?</h3>
                    <RadioGroup 
                      value={pain} 
                      onValueChange={setPain}
                      className="space-y-3"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="No pain at all" id="pain-1" />
                        <Label htmlFor="pain-1" className="ml-3 cursor-pointer">No pain at all</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="Mild discomfort" id="pain-2" />
                        <Label htmlFor="pain-2" className="ml-3 cursor-pointer">Mild discomfort</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="Moderate pain" id="pain-3" />
                        <Label htmlFor="pain-3" className="ml-3 cursor-pointer">Moderate pain</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="Severe pain" id="pain-4" />
                        <Label htmlFor="pain-4" className="ml-3 cursor-pointer">Severe pain</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
              >
                Previous
              </Button>
              <Button onClick={goToNextStep}>
                Next
              </Button>
            </div>
          </>
        )}
        
        {/* Step 3: Upload Image */}
        {currentStep === 'upload-image' && (
          <>
            <Card className="bg-white rounded-lg shadow-sm mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium text-neutral-800 mb-4">Upload an image for analysis</h2>
                
                <div 
                  className={`border-2 border-dashed ${imagePreview ? 'border-neutral-300' : 'border-neutral-300 hover:border-primary'} rounded-lg p-6 text-center transition-colors cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Selected image" 
                        className="max-h-60 mx-auto object-contain rounded-md"
                      />
                      <p className="text-sm text-neutral-600">Click to select a different image</p>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto flex justify-center">
                        <Upload className="h-12 w-12 text-neutral-400" />
                      </div>
                      <p className="mt-2 text-neutral-600">Drag and drop an image here, or click to browse</p>
                      <p className="mt-1 text-xs text-neutral-500">Supported formats: JPG, PNG, HEIC - Max 10MB</p>
                    </>
                  )}
                  
                  <input 
                    ref={fileInputRef}
                    id="image-upload" 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Image Guidelines:</h3>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-3 w-3" />
                      <span>Ensure good lighting and clear focus</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-3 w-3" />
                      <span>Include only the affected area</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-3 w-3" />
                      <span>For skin: include some surrounding normal skin for comparison</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-3 w-3" />
                      <span>Remove any jewelry or accessories from the area</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8 flex items-start">
              <div className="text-primary mr-3 mt-1">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-700">Your privacy is important to us. All images are encrypted and processed securely. Images are not stored after analysis unless you explicitly choose to save your results.</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={isAnalyzing}
              >
                Previous
              </Button>
              <Button 
                onClick={handleAnalyzeImage}
                disabled={!imageFile || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Image...
                  </>
                ) : (
                  'Analyze Image'
                )}
              </Button>
            </div>
          </>
        )}
        
        {/* Step 4: View Results */}
        {currentStep === 'view-results' && assessment && (
          <TestResult
            riskLevel={assessment.riskLevel}
            confidence={assessment.confidence}
            explanation={assessment.explanation}
            recommendations={assessment.recommendations}
            imageUrl={imagePreview || undefined}
            onBackToDashboard={() => setLocation('/')}
            onFindHospitals={() => setLocation('/hospitals')}
          />
        )}
      </main>
      
      <Chatbot />
    </div>
  );
}
