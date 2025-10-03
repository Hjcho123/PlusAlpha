import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";
import Products from "@/components/Products";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && user) {
      console.log('User authenticated, redirecting to dashboard:', user.firstName);
      // Small delay to ensure authentication state has fully propagated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate]);

  // Don't render landing page if user is authenticated
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <div id="content">
        <Products />
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
