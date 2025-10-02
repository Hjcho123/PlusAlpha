import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft, User, LogOut, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useNavigation } from "@/hooks/useNavigation";
import { useNavigate } from "react-router-dom";
import Logo from "./logo";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const Navigation = () => {
  const { isHomePage, isProductPage, currentPath } = useNavigation();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();

  const getPageTitle = () => {
    switch(currentPath) {
      case '/dashboard':
        return 'Dashboard';
      case '/portfolio':
        return 'Portfolio';
      case '/ai_trading':
        return 'AI Trading Assistant';
      case '/predictive-analytics':
        return 'Predictive Analytics';
      case '/portfolio-optimization':
        return 'Portfolio Optimization';
      case '/risk-management':
        return 'Risk Management';
      case '/api-demo':
        return 'API Demo';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      default:
        return 'PlusAlpha';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        {isAuthenticated ? (
          // Authenticated layout: Left (back button), Center (logo), Right (nav + user menu)
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center min-w-0 flex-1">
              {!isHomePage && (
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <span className="text-xl font-semibold text-foreground">
                    {getPageTitle()}
                  </span>
                </div>
              )}
            </div>

            {/* Center section - Logo */}
            <div className="flex justify-center flex-shrink-0">
              <a 
                href="/dashboard" 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <Logo className="text-2xl" />
              </a>
            </div>

            {/* Right section */}
            <div className="flex gap-4 items-center justify-end min-w-0 flex-1">
              <ThemeToggle />
              
              <a href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </a>
              <a href="/portfolio" className="text-foreground hover:text-primary transition-colors">
                Portfolio
              </a>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User size={16} />
                    {user?.firstName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          // Non-authenticated layout: Original two-column layout
          <div className="flex justify-between items-center">
            {/* Logo/Back Button */}
            {isHomePage ? (
              <a 
                href="/" 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <Logo className="text-2xl" />
              </a>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <span className="text-xl font-semibold text-foreground">
                  {getPageTitle()}
                </span>
              </div>
            )}
           
            <div className="flex gap-4 items-center">
              <ThemeToggle />
              
              {/* Navigation links for home page (non-authenticated) */}
              {isHomePage && (
                <>
                  <a href="#products" className="text-foreground hover:text-primary transition-colors">
                    Products
                  </a>
                  <a 
                    href="#journey" 
                    className="text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector('#journey');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    Create an Account
                  </a>
                  <a href="/api-demo" className="text-foreground hover:text-primary transition-colors">
                    API Demo
                  </a>
                </>
              )}
              
              {isProductPage && (
                <AuthModal onAuthSuccess={login}>
                  <Button variant="outline" className="gap-2">
                    <LogIn size={16} />
                    Get Started
                  </Button>
                </AuthModal>
              )}
              
              <AuthModal onAuthSuccess={login}>
                <Button variant="default" className="gap-2">
                  <LogIn size={18} />
                  Login
                </Button>
              </AuthModal>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
