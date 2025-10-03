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
    <section id="products" className="py-24 bg-background/95 backdrop-blur-sm border-y border-border/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold font-nanum text-foreground mb-4">
            Our Product
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge AI technology designed to give you the edge in trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <a
              href={product.link}
              key={index}
              className="block no-underline"
            >
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up bg-card/95 backdrop-blur-sm border-border cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="mb-4">{product.icon}</div>
                  <CardTitle className="text-2xl font-nanum">{product.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {product.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
