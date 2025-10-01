import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold font-nanum text-foreground mb-8">
          Risk Management
        </h1>
        <div className="max-w-4xl">
          <p className="text-lg text-muted-foreground mb-6">
            Comprehensive risk assessment tools powered by AI to protect your investments.
          </p>
          {/* Add more content here */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RiskManagement;