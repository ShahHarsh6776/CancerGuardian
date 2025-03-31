import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { useLocation } from "wouter";
import { ArrowLeft, Bot } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import TestResult from "@/components/TestResult";
import { useMutation } from "@tanstack/react-query";

type Question = {
  question: string;
  options: string[];
};

type QuestionnaireItem = {
  question: string;
  answer: string;
};

export default function BasicTest() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([{
    question: "Which part of your body is affected?",
    options: [
      "Skin (mole, lesion, or unusual growth)",
      "Throat (persistent sore throat, difficulty swallowing)",
      "Breast (lump, changes in size or shape)",
      "I'm not sure, but I have concerning symptoms"
    ]
  }]);
  const [responses, setResponses] = useState<string[]>([]);
  const [bodyPart, setBodyPart] = useState<string>("");
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireItem[]>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [assessment, setAssessment] = useState<{
    riskLevel: string;
    confidence: number;
    explanation: string;
    recommendations: string[];
  } | null>(null);
  
  // Define total questions (first question + 7 follow-up questions)
  const totalQuestions = 8;
  
  // Determine body part from first answer
  const determineBodyPart = (answer: string) => {
    if (answer.toLowerCase().includes("skin")) return "skin";
    if (answer.toLowerCase().includes("throat")) return "throat";
    if (answer.toLowerCase().includes("breast")) return "breast";
    return "general";
  };
  
  // Generate next question from Gemini API
  const generateNextQuestion = async (bp: string = bodyPart) => {
    try {
      setIsGeneratingQuestion(true);
      
      // Get the questions and answers so far for the API
      const previousQuestions = questions.map(q => q.question);
      const previousAnswers = responses;
      
      const res = await apiRequest("POST", "/api/generate-question", {
        bodyPart: bp,
        previousQuestions,
        previousAnswers
      });
      
      const data = await res.json();
      setQuestions([...questions, {
        question: data.question,
        options: data.options
      }]);
      
      setIsGeneratingQuestion(false);
    } catch (error) {
      console.error("Error generating question:", error);
      toast({
        title: "Error",
        description: "Failed to generate next question. Please try again.",
        variant: "destructive"
      });
      setIsGeneratingQuestion(false);
    }
  };
  
  // Generate final assessment
  const generateAssessment = async (bp: string = bodyPart) => {
    try {
      setIsGeneratingQuestion(true);
      
      const allQuestions = questions.map(q => q.question);
      const allAnswers = [...responses, selectedAnswer];
      
      const res = await apiRequest("POST", "/api/generate-assessment", {
        bodyPart: bp,
        questions: allQuestions,
        answers: allAnswers
      });
      
      const data = await res.json();
      setAssessment({
        riskLevel: data.riskLevel,
        confidence: data.confidence,
        explanation: data.explanation,
        recommendations: data.recommendations
      });
      
      // Prepare the questionnaire for saving
      const completeQuestionnaire = allQuestions.map((question, index) => ({
        question,
        answer: allAnswers[index] || "Not answered"
      }));
      
      setQuestionnaire(completeQuestionnaire);
      setIsGeneratingQuestion(false);
      setIsComplete(true);
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to generate risk assessment. Please try again.",
        variant: "destructive"
      });
      setIsGeneratingQuestion(false);
    }
  };

  // Save test result mutation
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      if (!assessment) throw new Error("No assessment available");
      
      const testResult = {
        testType: "basic",
        cancerType: bodyPart,
        result: assessment.confidence > 60 ? "positive" : assessment.confidence > 30 ? "inconclusive" : "negative",
        riskLevel: assessment.riskLevel.toLowerCase(),
        confidence: assessment.confidence,
        recommendations: assessment.recommendations.join("; "),
        questionnaire: questionnaire
      };
      
      const res = await apiRequest("POST", "/api/test-results", testResult);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test completed",
        description: "Your test result has been saved to your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-results'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save test result. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  });
  
  // Handle next question
  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      toast({
        title: "Selection required",
        description: "Please select an answer to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // Save the answer
    const newResponses = [...responses, selectedAnswer];
    setResponses(newResponses);
    
    // If this is the first question, determine the body part
    if (currentQuestionIndex === 0) {
      const detectedBodyPart = determineBodyPart(selectedAnswer);
      setBodyPart(detectedBodyPart);
      
      // Generate the next question, passing the detected body part directly
      await generateNextQuestion(detectedBodyPart);
    } else if (currentQuestionIndex < totalQuestions - 2) {
      // Generate the next question for all questions except the last one
      await generateNextQuestion();
    } else if (currentQuestionIndex === totalQuestions - 2) {
      // For the last question, generate the assessment
      await generateAssessment(bodyPart);
    }
    
    // Move to the next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
  };
  
  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Set the selected answer to the previously saved one
      setSelectedAnswer(responses[currentQuestionIndex - 1] || null);
      
      // Remove the last response
      setResponses(responses.slice(0, -1));
    }
  };
  
  // Save the result when assessment is complete
  useEffect(() => {
    if (isComplete && assessment && !saveResultMutation.isPending) {
      saveResultMutation.mutate();
    }
  }, [isComplete, assessment]);
  
  // Progress percentage
  const progressPercentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  
  // If test is complete and we have assessment data, show the results
  if (isComplete && assessment) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/')}
              className="mr-4 text-neutral-600 hover:text-neutral-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-montserrat font-semibold text-neutral-800">Test Results</h1>
              <p className="text-neutral-500 text-sm mt-1">Your cancer risk assessment</p>
            </div>
          </div>
          
          <TestResult
            riskLevel={assessment.riskLevel}
            confidence={assessment.confidence}
            explanation={assessment.explanation}
            recommendations={assessment.recommendations}
            onBackToDashboard={() => setLocation('/')}
            onFindHospitals={() => setLocation('/hospitals')}
          />
        </main>
        
        <Chatbot />
      </div>
    );
  }
  
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
            <h1 className="text-2xl font-montserrat font-semibold text-neutral-800">Basic Cancer Screening Test</h1>
            <p className="text-neutral-500 text-sm mt-1">Answer the questions to receive your risk assessment</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-neutral-500 mb-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>Progress: {progressPercentage}%</span>
          </div>
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-light"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Test Container */}
        <Card className="bg-white rounded-lg shadow-sm mb-8">
          <CardContent className="p-6">
            {/* Current Question */}
            {currentQuestionIndex < questions.length ? (
              <div>
                <h2 className="text-lg font-medium text-neutral-800 mb-4">
                  {questions[currentQuestionIndex].question}
                </h2>
                
                <RadioGroup 
                  value={selectedAnswer || ""}
                  onValueChange={setSelectedAnswer}
                  className="space-y-3"
                >
                  {questions[currentQuestionIndex].options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="ml-3 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              // Loading skeleton for when we're generating the next question
              <div className="space-y-6">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* AI Assistant Note */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8 flex items-start">
          <div className="text-primary mr-3 mt-1">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-700">
              Our AI will generate personalized follow-up questions based on your answers. This helps us provide a more accurate risk assessment.
            </p>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || isGeneratingQuestion}
          >
            Previous Question
          </Button>
          
          <Button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer || isGeneratingQuestion}
          >
            {isGeneratingQuestion ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "Complete Test"
            )}
          </Button>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
