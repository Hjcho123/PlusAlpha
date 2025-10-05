import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, TrendingUp, BarChart3, Target, Shield, Zap, CheckCircle, DollarSign } from "lucide-react";

const PortfolioOptimization = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <PieChart className="w-4 h-4 mr-2" />
            Portfolio Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
          Portfolio Overview
        </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Monitor your complete portfolio performance and track individual stock contributions.
            Get insights into your overall investment strategy and performance.
          </p>
        </div>

        {/* What We Offer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Total Value Tracking</CardTitle>
              <CardDescription>
                See your total portfolio value across all your stocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Combined portfolio total
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Daily change tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Simple performance overview
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Gain/Loss Summary</CardTitle>
              <CardDescription>
                Understand which stocks are performing well or poorly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Winners and losers list
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Individual stock performance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Basic allocation view
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <PieChart className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Simple Reporting</CardTitle>
              <CardDescription>
                Clear summaries of your investment performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Portfolio composition
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Monthly performance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Basic diversification check
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-nanum text-center mb-12">Complete Portfolio View</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Total Value</h3>
              <p className="text-sm text-muted-foreground">
                See your complete portfolio value and track changes over time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Performance Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor overall returns and identify top and bottom performers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Portfolio Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                Understand your asset allocation and investment distribution.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PortfolioOptimization;
