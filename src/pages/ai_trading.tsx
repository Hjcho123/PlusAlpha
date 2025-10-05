import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Zap, Target, BarChart3, Shield, Clock, CheckCircle } from "lucide-react";

const AITrading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Brain className="w-4 h-4 mr-2" />
            AI Stock Analysis
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
            Stock Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get actionable trading insights based on stock price movements and market data.
            Use AI-powered analysis to make informed investment decisions.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Price Analysis</CardTitle>
              <CardDescription>
                Analyze recent stock price movements and trading volume patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Price trend identification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Volume analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Support and resistance levels
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-8 h-8 text-primary mb-2" />
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Machine learning-powered interpretation of market data patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Momentum indicators
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trading suggestions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Trading Signals</CardTitle>
              <CardDescription>
              Clear recommendations with confidence scoring for decision making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Buy/Hold/Sell ratings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Confidence indicators
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Key price levels
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-nanum text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Market Data</h3>
              <p className="text-sm text-muted-foreground">
                Access current stock prices, volume, and market information
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Machine learning algorithms process data and identify patterns
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Trading Signals</h3>
              <p className="text-sm text-muted-foreground">
                Receive buy/sell/hold recommendations based on analysis
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AITrading;
