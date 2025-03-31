import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertUserSchema,
  loginUserSchema,
  User as SelectUser,
  InsertUser,
  LoginUser,
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

// Extended schema for form validation
export const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginFormSchema = loginUserSchema;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data: SelectUser) => {
      queryClient.setQueryData(["user"], data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setLocation("/dashboard");
      toast({
        title: "Welcome back!",
        description: `Hello ${data.first_name || data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data: SelectUser) => {
      queryClient.setQueryData(["user"], data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setLocation("/dashboard");
      toast({
        title: "Welcome to CancerGuardian!",
        description: `Hello ${data.first_name || data.username}! Your account has been created successfully.`,
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/logout", {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      toast({
        title: "Goodbye!",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
