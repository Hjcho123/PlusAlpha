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
            AI-Powered Trading
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
            AI Trading Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Harness the power of advanced machine learning algorithms to analyze market patterns, 
            identify opportunities, and execute trades with unprecedented precision and speed.
          </p>
          <Button size="lg" className="gap-2">
            <Zap className="w-5 h-5" />
            Start Trading with AI
          </Button>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Real-time Analysis</CardTitle>
              <CardDescription>
                Process thousands of market indicators simultaneously for instant insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Live market data processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Multi-timeframe analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sentiment analysis integration
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Machine Learning</CardTitle>
              <CardDescription>
                Advanced neural networks trained on decades of market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pattern recognition algorithms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Adaptive learning models
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Continuous model improvement
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Smart Signals</CardTitle>
              <CardDescription>
                Precise buy/sell recommendations with confidence scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Entry and exit points
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Risk-reward ratios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Stop-loss recommendations
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-nanum text-center mb-12">How AI Trading Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Data Collection</h3>
              <p className="text-sm text-muted-foreground">
                Gather real-time market data, news, and social sentiment from multiple sources
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Process data through advanced neural networks to identify patterns and trends
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Signal Generation</h3>
              <p className="text-sm text-muted-foreground">
                Generate precise trading signals with confidence scores and risk assessments
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Execution</h3>
              <p className="text-sm text-muted-foreground">
                Receive instant notifications and execute trades with optimal timing
              </p>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-nanum">Proven Performance</CardTitle>
            <CardDescription>
              Our AI trading system has consistently outperformed traditional methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">87%</div>
                <div className="text-sm text-muted-foreground">Signal Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Market Monitoring</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">15%</div>
                <div className="text-sm text-muted-foreground">Average Annual Return</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">0.3s</div>
                <div className="text-sm text-muted-foreground">Signal Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-nanum mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have already upgraded their strategy with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Zap className="w-5 h-5" />
              Get Started Now
            </Button>
            <Button size="lg" variant="outline">
              View Live Demo
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AITrading;