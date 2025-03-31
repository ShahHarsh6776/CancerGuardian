import { useState } from "react";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { TestTypeCard } from "@/components/TestCard";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ClipboardCheck, Microscope, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function CancerTest() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-montserrat font-semibold text-neutral-800">Cancer Detection Tests</h1>
            <p className="text-neutral-500 mt-1">Choose the type of test you would like to take</p>
          </div>
          
          {/* Test Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Basic Test */}
            <TestTypeCard
              type="basic"
              title="Basic Test (Q&A)"
              description="Answer a series of questions about your symptoms and health status. Our AI will analyze your responses to assess cancer risk."
              icon={<ClipboardCheck className="h-6 w-6" />}
              duration="5-10 minutes"
              accuracy="85% accuracy"
              onClick={() => setLocation('/basic-test')}
            />
            
            {/* Advanced Test */}
            <TestTypeCard
              type="advanced"
              title="Advanced Test (Image)"
              description="Upload an image of the affected area. Our specialized AI models will analyze the image to detect potential cancer indicators."
              icon={<Microscope className="h-6 w-6" />}
              duration="2-5 minutes"
              accuracy="93% accuracy"
              onClick={() => setLocation('/advanced-test')}
            />
          </div>
          
          {/* Test Insights */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-montserrat font-semibold mb-4 text-neutral-800">What to Expect</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-medium text-neutral-800 mb-2">Basic Q&A Test</h3>
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Initial question about affected body part</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>7-10 AI-generated follow-up questions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Risk assessment based on your answers</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-primary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Personalized health recommendations</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-medium text-neutral-800 mb-2">Advanced Image Test</h3>
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Select affected body part</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>2-3 preliminary questions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Upload an image of the affected area</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary text-xs mt-1 mr-2 h-4 w-4" />
                      <span>AI analysis with confidence percentage</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-medium text-neutral-800 mb-2">Important Information</h3>
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li className="flex items-start">
                      <AlertCircle className="text-accent text-xs mt-1 mr-2 h-4 w-4" />
                      <span>These tests are screening tools, not medical diagnoses</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="text-accent text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Consult a healthcare professional for definitive diagnosis</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="text-accent text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Your data is secured with end-to-end encryption</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="text-accent text-xs mt-1 mr-2 h-4 w-4" />
                      <span>Tests are not substitutes for regular medical check-ups</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
