import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  LogOut, 
  Menu,
  X,
  Scissors,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const AppLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/new-order", label: "New Order", icon: PlusCircle },
    { path: "/orders", label: "All Orders", icon: ListOrdered },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-primary shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-primary-foreground">
                Tailor Book
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    location.pathname === item.path
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{profile?.shop_name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-primary-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary/95 border-t border-primary-foreground/10 animate-slide-up">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    location.pathname === item.path
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-primary-foreground/10 pt-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 text-primary-foreground/80">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{profile?.shop_name}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
