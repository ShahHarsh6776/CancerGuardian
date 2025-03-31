import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

type ApiStatusData = {
  available: boolean;
  message: string;
  sample?: string;
  error?: boolean;
};

export default function ApiStatus() {
  const [showDetails, setShowDetails] = useState(false);

  const geminiStatus = useQuery<ApiStatusData>({
    queryKey: ['/api/gemini-status'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const supabaseStatus = useQuery<ApiStatusData>({
    queryKey: ['/api/supabase-status'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const refreshStatus = () => {
    geminiStatus.refetch();
    supabaseStatus.refetch();
  };

  // Show details automatically if there's an error
  useEffect(() => {
    if (
      (geminiStatus.data && !geminiStatus.data.available) ||
      (supabaseStatus.data && !supabaseStatus.data.available)
    ) {
      setShowDetails(true);
    }
  }, [geminiStatus.data, supabaseStatus.data]);

  const isLoading = geminiStatus.isLoading || supabaseStatus.isLoading;
  const isRefetching = geminiStatus.isFetching || supabaseStatus.isFetching;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          System Status
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStatus}
            disabled={isLoading || isRefetching}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Check the status of external services required by the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">Gemini AI API</span>
                {geminiStatus.data?.available ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Fallback Mode
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                {geminiStatus.data?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">Supabase Database</span>
                {supabaseStatus.data?.available ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Fallback Storage
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                {supabaseStatus.data?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </div>
            
            {showDetails && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger>Service Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      <Alert variant={geminiStatus.data?.error ? "destructive" : "default"}>
                        <AlertTitle>Gemini AI API</AlertTitle>
                        <AlertDescription className="mt-2">
                          {geminiStatus.data?.message}
                          {geminiStatus.data?.sample && (
                            <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                              <strong>Sample response:</strong> {geminiStatus.data.sample}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                      
                      <Alert variant={supabaseStatus.data?.error ? "destructive" : "default"}>
                        <AlertTitle>Supabase Database</AlertTitle>
                        <AlertDescription>
                          {supabaseStatus.data?.message}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </CardFooter>
    </Card>
  );
}