import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold font-nanum text-foreground">PlusAlpha</h2>
        
        <div className="flex gap-4 items-center">
          <a href="#products" className="text-foreground hover:text-primary transition-colors">
            Products
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">
            Contact
          </a>
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
