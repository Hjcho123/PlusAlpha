import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, LogIn, Shield, Zap } from "lucide-react";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Contact = () => {
  const { login, isAuthenticated, user } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAuthSuccess = (userData: any, token: string) => {
    login(userData, token);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  if (isAuthenticated && showSuccessMessage) {
    return (
      <section id="contact" className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Zap className="w-8 h-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                      Welcome to PlusAlpha, {user?.firstName}!
                    </h2>
                  </div>
                  <p className="text-green-700 dark:text-green-300 mb-4">
                    Your account has been created successfully. You can now access all our AI-powered trading features.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/api-demo'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Explore API Demo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isAuthenticated) {
    return null; // Don't show the signup section if already authenticated
  }

  return (
    <section id="contact" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-nanum text-foreground mb-4">
            Start Your Trading Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the next generation of traders using AI to make smarter decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Signup Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="font-nanum text-2xl flex items-center justify-center gap-2">
                <UserPlus className="w-6 h-6 text-accent" />
                Create your Account
              </CardTitle>
              <CardDescription>
                Discover the World of AI-driven Trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Click below to create your account and start trading with AI-powered insights
                </p>
                
                <AuthModal onAuthSuccess={handleAuthSuccess}>
                  <Button className="w-full h-12 gap-2 text-lg">
                    <Zap className="w-5 h-5" />
                    Start Your Trading Journey
                  </Button>
                </AuthModal>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <AuthModal onAuthSuccess={handleAuthSuccess}>
                      <a href="#" className="text-accent hover:underline font-medium">
                        Sign in
                      </a>
                    </AuthModal>
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure & Encrypted
                </div>
                <div>•</div>
                <div>No credit card required</div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold font-nanum text-foreground mb-6">
              Why Join PlusAlpha?
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">AI-Powered Insights</h4>
                  <p className="text-sm text-muted-foreground">Get real-time trading recommendations powered by machine learning</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Risk Management</h4>
                  <p className="text-sm text-muted-foreground">Protect your investments with advanced risk assessment tools</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <UserPlus className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Beginner Friendly</h4>
                  <p className="text-sm text-muted-foreground">Perfect for traders of all experience levels</p>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;