import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const AITrading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold font-nanum text-foreground mb-8">
          AI Trading Assistant
        </h1>
        <div className="max-w-4xl">
          <p className="text-lg text-muted-foreground mb-6">
            Advanced machine learning algorithms analyze market patterns and provide real-time trading recommendations.
          </p>
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Real-time market analysis</li>
              <li>Machine learning pattern recognition</li>
              <li>Automated trading signals</li>
              <li>24/7 market monitoring</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AITrading;