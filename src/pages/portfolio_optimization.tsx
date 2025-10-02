import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            Smart Portfolio Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
          Portfolio Optimization
        </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Automatically balance and optimize your portfolio based on your risk tolerance, investment goals, 
            and market conditions using advanced mathematical models and AI-driven insights.
          </p>
          <Button size="lg" className="gap-2">
            <PieChart className="w-5 h-5" />
            Optimize My Portfolio
          </Button>
        </div>

        {/* Optimization Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk-Return Optimization</CardTitle>
              <CardDescription>
                Maximize returns while minimizing risk using Modern Portfolio Theory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Efficient frontier analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sharpe ratio optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Risk parity strategies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Volatility targeting
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Dynamic Rebalancing</CardTitle>
              <CardDescription>
                Automatically adjust allocations based on market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Threshold-based rebalancing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Calendar rebalancing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Volatility-based adjustments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Tax-loss harvesting
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Advanced risk controls to protect your investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Value at Risk (VaR) limits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Correlation monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Drawdown protection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sector concentration limits
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Analysis Dashboard */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-nanum">Portfolio Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators for optimized portfolios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary mb-1">12.8%</div>
                <div className="text-sm text-muted-foreground">Annual Return</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600 mb-1">1.42</div>
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 mb-1">8.9%</div>
                <div className="text-sm text-muted-foreground">Volatility</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600 mb-1">-4.2%</div>
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Strategies */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-nanum text-center mb-12">Optimization Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Conservative Growth
                </CardTitle>
                <CardDescription>
                  Balanced approach focusing on capital preservation with steady growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stocks</span>
                    <div className="flex items-center gap-2">
                      <Progress value={40} className="w-20 h-2" />
                      <span className="text-sm font-medium">40%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bonds</span>
                    <div className="flex items-center gap-2">
                      <Progress value={50} className="w-20 h-2" />
                      <span className="text-sm font-medium">50%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">REITs</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-20 h-2" />
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Aggressive Growth
                </CardTitle>
                <CardDescription>
                  High-growth strategy for maximum long-term returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Growth Stocks</span>
                    <div className="flex items-center gap-2">
                      <Progress value={70} className="w-20 h-2" />
                      <span className="text-sm font-medium">70%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">International</span>
                    <div className="flex items-center gap-2">
                      <Progress value={20} className="w-20 h-2" />
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Emerging Markets</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-20 h-2" />
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-nanum text-center mb-12">Why Optimize Your Portfolio?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Improved Returns</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimized portfolios typically outperform random allocations by 2-4% annually through better diversification.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Reduced Risk</h3>
                  <p className="text-sm text-muted-foreground">
                    Mathematical optimization reduces portfolio volatility while maintaining or improving expected returns.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Automated Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Set it and forget it - our algorithms continuously monitor and adjust your portfolio automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Goal-Based Investing</h3>
                  <p className="text-sm text-muted-foreground">
                    Align your portfolio with specific financial goals like retirement, home purchase, or education funding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-nanum mb-4">Optimize Your Portfolio Today</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop guessing and start optimizing. Let our advanced algorithms build the perfect portfolio for your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <PieChart className="w-5 h-5" />
              Start Optimizing
            </Button>
            <Button size="lg" variant="outline">
              View Sample Portfolio
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PortfolioOptimization;