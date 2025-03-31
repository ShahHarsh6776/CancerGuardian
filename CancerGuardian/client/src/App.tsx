import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CancerTest from "@/pages/cancer-test";
import BasicTest from "@/pages/basic-test";
import AdvancedTest from "@/pages/advanced-test";
import Hospitals from "@/pages/hospitals";
import Profile from "@/pages/profile";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ChatbotProvider } from "./context/ChatbotContext";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/cancer-test" component={CancerTest} />
      <ProtectedRoute path="/basic-test" component={BasicTest} />
      <ProtectedRoute path="/advanced-test" component={AdvancedTest} />
      <ProtectedRoute path="/hospitals" component={Hospitals} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatbotProvider>
          <Router />
          <Toaster />
        </ChatbotProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
