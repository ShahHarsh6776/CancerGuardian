// Extend Window interface
declare global {
  interface Window {
    toggleChatbot?: () => void;
  }
}

import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { TestResultCard } from "@/components/TestCard";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TestResult } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  FlaskConical, 
  Hospital, 
  Bot, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Fetch test results
  const { 
    data: testResults, 
    isLoading: isLoadingResults,
    isError: isResultsError
  } = useQuery<TestResult[]>({
    queryKey: ['/api/test-results'],
  });
  
  const hasTestResults = testResults && testResults.length > 0;

  function formatDate(dateString: Date | string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-montserrat font-semibold text-neutral-800">Your Health Dashboard</h1>
            <p className="text-neutral-500 mt-1">Track your health status and previous test results</p>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-primary">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary bg-opacity-10 text-primary">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <h3 className="ml-3 font-medium text-neutral-800 font-montserrat">New Test</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-4">Start a new cancer detection test using our AI tools.</p>
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/cancer-test')} 
                  className="text-primary hover:text-primary-light p-0 font-medium text-sm flex items-center"
                >
                  Start Test 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-secondary">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary bg-opacity-10 text-secondary">
                    <Hospital className="h-5 w-5" />
                  </div>
                  <h3 className="ml-3 font-medium text-neutral-800 font-montserrat">Find Hospital</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-4">Locate nearby hospitals and medical centers.</p>
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/hospitals')} 
                  className="text-secondary hover:text-secondary-light p-0 font-medium text-sm flex items-center"
                >
                  Find Hospitals 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-accent">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent bg-opacity-10 text-accent">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="ml-3 font-medium text-neutral-800 font-montserrat">AI Assistant</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-4">Get answers to your health-related questions.</p>
                <Button 
                  variant="link" 
                  onClick={() => window.toggleChatbot?.()}
                  className="text-accent hover:text-accent-light p-0 font-medium text-sm flex items-center"
                >
                  Chat with AI
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Status Overview */}
          <Card className="bg-white rounded-lg shadow-sm mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-montserrat font-semibold mb-4 text-neutral-800">Health Overview</h2>
              
              {isLoadingResults ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !hasTestResults ? (
                // No tests taken
                <div className="bg-primary bg-opacity-5 border border-primary border-opacity-20 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-primary">
                      <Info className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-neutral-800 mb-1">No data found yet!</h3>
                      <p className="text-neutral-600 text-sm">Take your first test to get personalized health insights and recommendations.</p>
                      <Button 
                        onClick={() => setLocation('/cancer-test')} 
                        className="mt-3"
                      >
                        Start Your First Test
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Tests overview
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Display the most recent test of each type */}
                    {['skin', 'throat', 'breast'].map(type => {
                      const latestTest = testResults
                        .filter(test => test.cancer_type.toLowerCase() === type)
                        .sort((a, b) => {
                          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                          return dateB - dateA;
                        })[0];
                      
                      return (
                        <div key={type} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="text-xs font-medium uppercase text-neutral-500">Last {type.charAt(0).toUpperCase() + type.slice(1)} Test</span>
                              <h4 className="font-semibold text-neutral-800">
                                {latestTest 
                                  ? latestTest.risk_level.charAt(0).toUpperCase() + latestTest.risk_level.slice(1) + ' Risk'
                                  : 'Not Tested'
                                }
                              </h4>
                            </div>
                            <span className={`h-3 w-3 rounded-full ${
                              !latestTest ? 'bg-neutral-300' :
                              latestTest.risk_level.toLowerCase() === 'low' ? 'bg-success' :
                              latestTest.risk_level.toLowerCase() === 'medium' ? 'bg-warning' :
                              'bg-danger'
                            }`}></span>
                          </div>
                          {latestTest ? (
                            <>
                              <p className="text-sm text-neutral-600 mb-2">
                                {latestTest.result === 'negative' ? 'No concerning patterns detected' :
                                 latestTest.result === 'positive' ? 'Requires medical attention' :
                                 'Some symptoms require monitoring'}
                              </p>
                              <span className="text-xs text-neutral-500">
                                Tested on: {formatDate(latestTest.created_at)}
                              </span>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-neutral-600 mb-2">No test data available</p>
                              <Button 
                                variant="link" 
                                className="text-xs text-primary p-0"
                                onClick={() => setLocation('/cancer-test')}
                              >
                                Take test
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <h3 className="font-medium text-neutral-700 mb-3">AI Recommendations</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                    <ul className="space-y-2">
                      {/* Sample recommendations - would be replaced with real data from API */}
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-success mt-1 mr-2" />
                        <span className="text-sm text-neutral-700">
                          Schedule a follow-up consultation for any medium or high-risk results within the next 30 days.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-success mt-1 mr-2" />
                        <span className="text-sm text-neutral-700">
                          Maintain a diet rich in antioxidants to support overall health.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-success mt-1 mr-2" />
                        <span className="text-sm text-neutral-700">
                          Consider regular screenings for all three cancer types as part of your preventive healthcare.
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Test History */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-montserrat font-semibold text-neutral-800">Test History</h2>
                <span className="text-xs py-1 px-3 bg-neutral-200 rounded-full">Last 6 months</span>
              </div>
              
              {isLoadingResults ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !hasTestResults ? (
                // Empty state
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-neutral-600 font-medium mb-1">No test history</h3>
                  <p className="text-neutral-500 text-sm mb-4">You haven't taken any tests yet.</p>
                  <Button 
                    variant="link"
                    onClick={() => setLocation('/cancer-test')} 
                    className="text-primary hover:text-primary-light font-medium text-sm flex items-center mx-auto"
                  >
                    Take your first test 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </div>
              ) : (
                // Test history table
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Test Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Result</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Risk Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {testResults.map(test => (
                        <tr key={test.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{formatDate(test.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{test.test_type.charAt(0).toUpperCase() + test.test_type.slice(1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{test.result.charAt(0).toUpperCase() + test.result.slice(1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{test.risk_level.charAt(0).toUpperCase() + test.risk_level.slice(1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="link" 
                              onClick={() => setLocation(`/test-results/${test.id}`)} 
                              className="text-primary hover:text-primary-light p-0 font-medium text-sm flex items-center"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
