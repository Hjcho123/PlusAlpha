import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, CheckCircle, Activity } from "lucide-react";

const PredictiveAnalytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Clock className="w-4 h-4 mr-2" />
            Historical Price Data
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
          Stock Charts & History
        </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            View detailed stock price charts and historical data. See how prices have moved over time
            and get basic technical information about stock performance trends.
          </p>
        </div>

        {/* Chart Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Clock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Price Charts</CardTitle>
              <CardDescription>
                Interactive candlestick and line charts showing price movements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  1-day, 1-week, 1-month views
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Volume bars
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Moving averages
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Historical Data</CardTitle>
              <CardDescription>
                Access years of historical stock data and trading information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Price history (5+ years)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  High/low prices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trading volume trends
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Key Levels</CardTitle>
              <CardDescription>
                Important price levels and basic technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  52-week high/low
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Recent support/resistance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Basic trend lines
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Chart Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Price History</h3>
            <p className="text-sm text-muted-foreground">
              Access historical price data and trading volume over extended periods.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Interactive Charts</h3>
            <p className="text-sm text-muted-foreground">
              Navigate through different time frames and chart types for detailed analysis.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Technical Analysis</h3>
            <p className="text-sm text-muted-foreground">
              View basic technical indicators and chart patterns for market analysis.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PredictiveAnalytics;
