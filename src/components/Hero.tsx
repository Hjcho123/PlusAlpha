import { useState } from "react";
import GlitchText from "./GlitchText";
import { ChevronDown } from "lucide-react";
import { Blocks, BotMessageSquare, ChartCandlestick, Shield } from "lucide-react";

const Hero = () => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const scrollToContent = () => {
    const contentSection = document.getElementById("content");
    contentSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-7xl md:text-9xl font-bold text-foreground mb-8">
          <GlitchText 
            text="PlusAlpha" 
            onComplete={() => setAnimationComplete(true)}
            className="tracking-tight"
            highlightStart={4}
            highlightEnd={9}
            highlightColor="hsl(var(--accent))" // Use CSS variable
          />
        </h1>
        
        <div 
          className={`transition-opacity duration-1000 ${
            animationComplete ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xl md:text-2xl text-muted-foreground font-nanum mb-12">
  Making trading accessible with AI<br />
  <span className="text-sm md:text-base">a project by Heejae Cho</span>
</p>

<div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
  <div className="text-center">
    <BotMessageSquare className="w-8 h-8 mx-auto mb-2 text-accent" />
    <p className="text-sm">AI-Powered Insights</p>
  </div>
  <div className="text-center">
    <Blocks className="w-8 h-8 mx-auto mb-2 text-accent" />
    <p className="text-sm">Entry-Level</p>
  </div>
  <div className="text-center">
    <ChartCandlestick className="w-8 h-8 mx-auto mb-2 text-accent" />
    <p className="text-sm">Real-time Analytics</p>
  </div>
</div>
          
          
        </div>
      </div>

      {animationComplete && (
        <button
          onClick={scrollToContent}
          className="absolute bottom-12 animate-bounce text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll to content"
        >
          <ChevronDown size={48} />
        </button>
      )}
    </section>
  );
};

export default Hero;