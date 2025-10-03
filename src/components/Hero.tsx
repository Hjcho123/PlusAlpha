
import { useState, useEffect } from "react";
import GlitchText from "./GlitchText";
import { ChevronDown } from "lucide-react";
import { Blocks, BotMessageSquare, ChartCandlestick, Shield } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  size: number;
}

const Hero = () => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  const scrollToContent = () => {
    const contentSection = document.getElementById("content");
    contentSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    // Show the plus symbol after a slight delay
    setTimeout(() => {
      setShowPlus(true);
    }, 100);

    // Generate galaxy particles after animation completes
    setTimeout(() => {
      generateParticles();
    }, 800); // Longer delay before particles start generating
  };

  const generateParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = 80; // More particles for full screen

    for (let i = 0; i < particleCount; i++) {
      // Spread particles across entire viewport
      const x = (Math.random() - 0.5) * window.innerWidth;
      const y = (Math.random() - 0.5) * window.innerHeight;

      newParticles.push({
        id: i,
        x,
        y,
        size: Math.random() * 5 + 1,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 3
      });
    }

    setParticles(newParticles);

    // Slowly fade in particles after a gentle delay
    setTimeout(() => {
      setShowParticles(true);
    }, 200);
  };

  const generateShootingStar = () => {
    // Only generate shooting stars occasionally (25% chance)
    if (Math.random() > 0.25) return;

    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * (window.innerHeight * 0.3); // Top 30% of screen
    const endX = startX + (Math.random() - 0.5) * 400; // Move horizontally with some variation
    const endY = startY + 200 + Math.random() * 300; // Move down across screen

    const newShootingStar: ShootingStar = {
      id: Date.now() + Math.random(),
      startX,
      startY,
      endX,
      endY,
      duration: 3 + Math.random() * 4, // 3-7 seconds for smoother animation
      delay: 0,
      size: 3 + Math.random() * 4 // 3-7px for more subtle appearance
    };

    setShootingStars(prev => [...prev, newShootingStar]);

    // Remove shooting star after animation completes
    setTimeout(() => {
      setShootingStars(prev => prev.filter(star => star.id !== newShootingStar.id));
    }, (newShootingStar.duration + 1) * 1000);
  };

  // Set up shooting star intervals
  useEffect(() => {
    if (!animationComplete) return;

    // Generate shooting stars occasionally (every 3-8 seconds)
    const interval = setInterval(() => {
      generateShootingStar();
    }, 2000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [animationComplete]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      <div className="text-center px-4 relative">
        <h1 className="text-7xl md:text-9xl font-bold text-foreground mb-8 relative">
          {/* Shooting Stars - Occasionally streak across the sky */}
          {animationComplete && (
            <div className="fixed inset-0 pointer-events-none z-5">
              {shootingStars.map((star) => (
                <div
                  key={star.id}
                  className="absolute shooting-star"
                  style={{
                    left: `${star.startX}px`,
                    top: `${star.startY}px`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    '--end-x': `${star.endX - star.startX}px`,
                    '--end-y': `${star.endY - star.startY}px`,
                    '--star-size': `${star.size}px`,
                    '--duration': `${star.duration}s`,
                    animationDuration: `${star.duration}s`,
                    animationDelay: `${star.delay}s`
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {/* Galaxy Particle Effect - Full Screen */}
          {animationComplete && particles.length > 0 && (
            <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
              showParticles ? 'opacity-100' : 'opacity-0'
            }`}>
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute particle-sparkle"
                  style={{
                    left: `calc(50% + ${particle.x}px)`,
                    top: `calc(50% + ${particle.y}px)`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    animationDuration: `${particle.duration}s`,
                    animationDelay: `${particle.delay}s`
                  }}
                />
              ))}
            </div>
          )}
          
          <GlitchText 
            text="PlusAlpha" 
            onComplete={handleAnimationComplete}
            className="tracking-tight relative z-10"
            highlightStart={10}
            highlightEnd={9}
            highlightColor="hsl(var(--accent))"
          />
          {/* Plus symbol that fades in after glitch - blue to purple gradient */}
          <span className={`
            absolute -top-2 -right-10 text-4xl md:text-7xl font-medium z-10
            bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent
            transition-opacity duration-500
            ${showPlus ? 'opacity-100' : 'opacity-0'}
          `}>
            +
          </span>
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
