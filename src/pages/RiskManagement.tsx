import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, TrendingDown, Target, Zap, CheckCircle } from "lucide-react";

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Shield className="w-4 h-4 mr-2" />
            Advanced Risk Protection
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
            Risk Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Comprehensive risk assessment tools powered by AI to protect your investments. 
            Monitor, measure, and mitigate risks before they impact your portfolio.
          </p>
          <Button size="lg" className="gap-2">
            <Shield className="w-5 h-5" />
            Protect My Portfolio
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <AlertTriangle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Real-time Risk Monitoring</CardTitle>
              <CardDescription>
                Continuous monitoring of portfolio risk metrics and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Value at Risk (VaR) calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Stress testing scenarios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Correlation analysis
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingDown className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Drawdown Protection</CardTitle>
              <CardDescription>
                Advanced algorithms to minimize portfolio drawdowns during market downturns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Dynamic stop-loss orders
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trailing stop strategies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Volatility-based position sizing
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk Analytics</CardTitle>
              <CardDescription>
                Deep analytical insights into portfolio risk factors and exposures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Factor risk decomposition
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sector concentration analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Currency exposure tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold font-nanum mb-4">Protect Your Investments Today</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Don't wait for the next market crash. Start managing your risk proactively with our advanced tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Shield className="w-5 h-5" />
              Start Risk Management
            </Button>
            <Button size="lg" variant="outline">
              View Risk Report
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RiskManagement;
