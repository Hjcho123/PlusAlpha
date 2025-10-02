import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gem, TrendingUp, BarChart3, Clock, Target, Zap, CheckCircle, Activity } from "lucide-react";

const PredictiveAnalytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Gem className="w-4 h-4 mr-2" />
            Future Market Intelligence
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
          Predictive Analytics
        </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Leverage cutting-edge AI to forecast market trends with unprecedented accuracy. 
            Make data-driven decisions based on predictive models that see beyond current market conditions.
          </p>
          <Button size="lg" className="gap-2">
            <Gem className="w-5 h-5" />
            Explore Predictions
          </Button>
        </div>

        {/* Prediction Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Price Forecasting</CardTitle>
              <CardDescription>
                Predict future price movements with 85% accuracy using advanced time series analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Short-term (1-7 days)</span>
                  <span className="font-semibold">92%</span>
                </div>
                <Progress value={92} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Medium-term (1-4 weeks)</span>
                  <span className="font-semibold">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Long-term (1-6 months)</span>
                  <span className="font-semibold">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Volatility Analysis</CardTitle>
              <CardDescription>
                Forecast market volatility to optimize entry and exit timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  VIX prediction models
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sector volatility forecasts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Event-driven volatility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Options pricing insights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Market Sentiment</CardTitle>
              <CardDescription>
                Analyze and predict market sentiment shifts before they happen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Social media analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  News sentiment tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Institutional flow prediction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Fear & greed indicators
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Live Predictions Dashboard */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-nanum">Live Market Predictions</CardTitle>
            <CardDescription>
              Real-time forecasts updated every minute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">↗ Bullish</div>
                <div className="text-sm text-muted-foreground mb-2">S&P 500 - Next 5 Days</div>
                <div className="text-xs">Confidence: 87%</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-2">→ Neutral</div>
                <div className="text-sm text-muted-foreground mb-2">NASDAQ - Next Week</div>
                <div className="text-xs">Confidence: 72%</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-2">↘ Bearish</div>
                <div className="text-sm text-muted-foreground mb-2">Russell 2000 - Next Month</div>
                <div className="text-xs">Confidence: 79%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-nanum mb-4">See the Future of Markets</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Don't just react to market movements—anticipate them. Start using predictive analytics to stay ahead of the curve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Gem className="w-5 h-5" />
              Start Predicting
            </Button>
            <Button size="lg" variant="outline">
              View Predictions
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PredictiveAnalytics;