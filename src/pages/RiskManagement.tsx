import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingDown, Target, Zap, CheckCircle } from "lucide-react";

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Shield className="w-4 h-4 mr-2" />
            Investment Protection
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
            Risk Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Tools and insights to help manage investment risk and protect your portfolio.
            Monitor potential risks and make informed decisions about your investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <AlertTriangle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Tools to evaluate and understand investment risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Portfolio risk evaluation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Individual stock risk factors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Market exposure analysis
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingDown className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk Controls</CardTitle>
              <CardDescription>
                Strategies and tools to manage investment risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Diversification insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Concentration warnings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Risk threshold monitoring
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk Monitoring</CardTitle>
              <CardDescription>
                Ongoing monitoring of portfolio risk levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Daily risk assessments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Portfolio risk alerts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Risk trend tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>


      </div>
      
      <Footer />
    </div>
  );
};

export default RiskManagement;
