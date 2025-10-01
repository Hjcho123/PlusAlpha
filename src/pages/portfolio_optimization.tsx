import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PortfolioOptimization = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold font-nanum text-foreground mb-8">
          Portfolio Optimization
        </h1>
        <div className="max-w-4xl">
          <p className="text-lg text-muted-foreground mb-6">
            Automatically balance and optimize your portfolio based on your risk tolerance and investment goals.
          </p>
          {/* Add more content here */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PortfolioOptimization;