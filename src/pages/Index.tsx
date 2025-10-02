import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";
import Products from "@/components/Products";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Don't render landing page if user is authenticated
  if (isAuthenticated) {
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
