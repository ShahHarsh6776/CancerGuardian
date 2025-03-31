import { useState } from "react";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import ApiStatus from "@/components/ApiStatus";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TestResultCard } from "@/components/TestCard";
import { useQuery } from "@tanstack/react-query";
import { TestResult } from "@shared/schema";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Shield,
  User,
  History,
  Settings,
  Loader2,
  AlertCircle
} from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  age: z.number().min(1).max(120).optional(),
  gender: z.string().optional(),
});

// Password update schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmNewPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Fetch test results
  const { 
    data: testResults, 
    isLoading: isLoadingResults
  } = useQuery<TestResult[]>({
    queryKey: ['/api/test-results'],
  });

  // Profile update form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      age: user?.age || undefined,
      gender: user?.gender || "",
    },
  });
  
  // Password update form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("POST", `/api/user/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });
  
  // Handle profile update
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle password update
  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    updatePasswordMutation.mutate(data);
  };

  // Format date
  function formatDate(dateString: Date | string | null) {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd MMM yyyy');
  }
  
  // Get user initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-montserrat font-semibold text-neutral-800">Your Profile</h1>
          <p className="text-neutral-500 mt-1">Manage your account information and preferences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div>
            <Card className="bg-white shadow-sm mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName || ''}+${user?.lastName || ''}&background=1D5B79&color=fff&size=96`} />
                    <AvatarFallback className="bg-primary text-white text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-medium text-neutral-800">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username}
                  </h2>
                  
                  {user?.email && (
                    <p className="text-neutral-500 text-sm mt-1">{user.email}</p>
                  )}
                  
                  <div className="mt-4 w-full space-y-2">
                    {user?.age && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Age:</span>
                        <span className="text-neutral-800 font-medium">{user.age}</span>
                      </div>
                    )}
                    
                    {user?.gender && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Gender:</span>
                        <span className="text-neutral-800 font-medium">
                          {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Member since:</span>
                      <span className="text-neutral-800 font-medium">
                        {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium text-neutral-800 mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  Data Privacy
                </h3>
                
                <div className="text-sm text-neutral-600 space-y-4">
                  <p>
                    Your health data is secured with end-to-end encryption and 
                    stored according to medical privacy standards.
                  </p>
                  
                  <p>
                    You can request a full export of your data or complete deletion 
                    of your account at any time.
                  </p>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="mr-2">
                      Export Data
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center">
                  <History className="h-4 w-4 mr-2" />
                  Test History
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="35" 
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                                      field.onChange(value);
                                    }}
                                    value={field.value === undefined ? "" : field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Profile"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Test History</CardTitle>
                    <CardDescription>
                      View your previous cancer screening test results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingResults ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-neutral-500">Loading test history...</p>
                      </div>
                    ) : testResults && testResults.length > 0 ? (
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
                              <TestResultCard
                                key={test.id}
                                testDate={formatDate(test.createdAt)}
                                testType={test.testType.charAt(0).toUpperCase() + test.testType.slice(1)}
                                cancerType={test.cancerType.charAt(0).toUpperCase() + test.cancerType.slice(1)}
                                result={test.result.charAt(0).toUpperCase() + test.result.slice(1)}
                                riskLevel={test.riskLevel.charAt(0).toUpperCase() + test.riskLevel.slice(1)}
                                onViewDetails={() => setLocation(`/test-results/${test.id}`)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                          <AlertCircle className="h-8 w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-neutral-600 font-medium mb-1">No test history</h3>
                        <p className="text-neutral-500 text-sm mb-4">You haven't taken any tests yet.</p>
                        <Button 
                          variant="default"
                          onClick={() => setLocation('/cancer-test')} 
                          className="mx-auto"
                        >
                          Take your first test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmNewPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                      Check the status of external services and APIs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ApiStatus />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive updates and reminders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-800">Email notifications</p>
                          <p className="text-sm text-neutral-500">Receive updates about your test results</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300">
                          <input 
                            type="checkbox" 
                            id="email-notifications" 
                            className="peer h-0 w-0 opacity-0" 
                            defaultChecked 
                          />
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:left-[1.375rem] peer-checked:bg-white peer-checked:[&+div]:bg-primary"></span>
                          <div className="absolute inset-0 rounded-full transition-colors"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-800">Test reminders</p>
                          <p className="text-sm text-neutral-500">Regular reminders for follow-up tests</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300">
                          <input 
                            type="checkbox" 
                            id="test-reminders" 
                            className="peer h-0 w-0 opacity-0" 
                          />
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:left-[1.375rem] peer-checked:bg-white peer-checked:[&+div]:bg-primary"></span>
                          <div className="absolute inset-0 rounded-full transition-colors"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-800">Health tips</p>
                          <p className="text-sm text-neutral-500">Receive personalized health recommendations</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300">
                          <input 
                            type="checkbox" 
                            id="health-tips" 
                            className="peer h-0 w-0 opacity-0" 
                            defaultChecked 
                          />
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:left-[1.375rem] peer-checked:bg-white peer-checked:[&+div]:bg-primary"></span>
                          <div className="absolute inset-0 rounded-full transition-colors"></div>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="mt-6">
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
