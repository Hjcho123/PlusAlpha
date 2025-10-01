import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useNavigation } from "@/hooks/useNavigation";
import { useNavigate } from "react-router-dom";
import Logo from "./logo";

const Navigation = () => {
  const { isHomePage, isProductPage, currentPath } = useNavigation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch(currentPath) {
      case '/ai_trading':
        return 'AI Trading Assistant';
      case '/predictive-analytics':
        return 'Predictive Analytics';
      case '/portfolio-optimization':
        return 'Portfolio Optimization';
      case '/risk-management':
        return 'Risk Management';
      default:
        return 'PlusAlpha';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      
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
          {/* Rest of your navigation code remains the same */}
          {isHomePage && (
            <>
              <a href="#products" className="text-foreground hover:text-primary transition-colors">
                Solutions
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">
                Create an Account
              </a>
            </>
          )}
          
          {isProductPage && (
            <Button variant="outline" className="gap-2">
              <LogIn size={16} />
              Get Started
            </Button>
          )}
          
          <Button variant="default" className="gap-2">
            <LogIn size={18} />
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;