import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, BarChart3, Shield } from "lucide-react";

const Products = () => {
  const products = [
    {
      icon: <Brain className="w-12 h-12 text-accent" />,
      title: "AI Trading Assistant",
      description: "Advanced machine learning algorithms analyze market patterns and provide real-time trading recommendations.",
      link: "/ai_trading"
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-accent" />,
      title: "Predictive Analytics", 
      description: "Leverage AI to forecast market trends with unprecedented accuracy and make data-driven decisions.",
      link: "/predictive-analytics"
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-accent" />,
      title: "Portfolio Optimization",
      description: "Automatically balance and optimize your portfolio based on your risk tolerance and investment goals.",
      link: "/portfolio-optimization"
    },
    {
      icon: <Shield className="w-12 h-12 text-accent" />,
      title: "Risk Management",
      description: "Comprehensive risk assessment tools powered by AI to protect your investments.",
      link: "/risk-management"
    },
  ];

  return (
    <section id="products" className="py-24 bg-background border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold font-nanum text-foreground mb-6">
            Trading Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional-grade tools designed to transform how you analyze and trade financial markets
          </p>
          <div className="mt-8 flex justify-center">
            <div className="px-6 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-primary font-semibold">Powered by Advanced AI</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {products.map((product, index) => (
            <a
              href={product.link}
              key={index}
              className="block no-underline group"
            >
              <Card
                className="terminal-panel hover:shadow-xl transition-all duration-500 hover:transform hover:scale-[1.02] cursor-pointer border-l-4 border-l-primary/0 hover:border-l-primary"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {product.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold font-nanum text-foreground group-hover:text-primary transition-colors">
                        {product.title}
                      </CardTitle>
                      <div className="mt-1 h-0.5 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary to-primary transition-all duration-300"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {product.description}
                  </CardDescription>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span className="text-sm">Explore Feature</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="px-3 py-1 bg-primary/10 rounded-full">
                      <span className="text-xs font-mono text-primary">AI Enhanced</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        {/* Footer Call-to-Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-card border border-border rounded-lg shadow-sm">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">Trusted by traders worldwide</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
