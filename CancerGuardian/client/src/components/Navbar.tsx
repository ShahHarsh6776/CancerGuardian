import { useAuth } from "@/hooks/use-auth";
import { useChatbot } from "@/context/ChatbotContext";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { toggleChatbot } = useChatbot();
  const [_, setLocation] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };
  
  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Cancer Test", href: "/cancer-test" },
    { name: "Nearby Hospitals", href: "/hospitals" },
  ];
  
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                <span className="font-bold">CG</span>
              </div>
              <span className="ml-2 text-xl font-bold text-primary font-montserrat">CancerGuardian</span>
            </Link>
          </div>
          
          {!isMobile && (
            <nav className="hidden md:flex space-x-8 items-center">
              {navItems.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  className="text-neutral-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="relative ml-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName || ''}+${user?.lastName || ''}&background=1D5B79&color=fff`} alt={user?.username || 'User'} />
                        <AvatarFallback className="bg-primary text-white">{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
          )}
          
          {isMobile && (
            <div className="flex items-center">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>CancerGuardian</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <Link 
                        key={item.name}
                        href={item.href}
                        className="text-neutral-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link 
                      href="/profile"
                      className="text-neutral-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Button variant="outline" onClick={handleLogout} className="mt-4">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
