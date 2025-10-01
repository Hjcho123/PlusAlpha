import { useEffect, useState, useRef } from "react";

interface GlitchTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  highlightStart?: number;
  highlightEnd?: number;
  highlightColor?: string;
}

const GlitchText = ({ 
  text, 
  onComplete, 
  className = "",
  highlightStart,
  highlightEnd,
  highlightColor = "hsl(136, 64.40%, 40.80%)"
}: GlitchTextProps) => {
  const [displayText, setDisplayText] = useState<string[]>(Array(text.length).fill(""));
  const [settledIndices, setSettledIndices] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [glitchColors, setGlitchColors] = useState<string[]>(Array(text.length).fill(""));
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>([]);
  const hasRunRef = useRef(false);

  // Extended character sets for glitching effect
  const characterSets = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*()_+-=[]{}|;:,.<>?",
    "αβγδεζηθικλμνξοπρστυφχψω",
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
    "あいうえおかきくけこさしすせそたちつてとなにぬねの",
    "가나다라마바사아자차카타파하",
    "床前明月光疑是地上霜"
  ];

  // Function to get random accent color appearance
  const getRandomGlitchColor = () => {
    const shouldUseAccent = Math.random() < 0.65; // 30% chance to use accent color
    return shouldUseAccent ? "hsl(var(--accent))" : "";
  };

  useEffect(() => {
    // Prevent double execution
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const initialGlitchDuration = 200; // All characters glitch together for 1.5 seconds
    const settleAnimationDuration = 1800; // Then settle over 1.5 seconds
    const textLength = text.length;
    const settleInterval = settleAnimationDuration / textLength; // Time between each character settling
    const glitchInterval = 40; // How fast characters change while glitching

    // Start all characters glitching immediately
    text.split("").forEach((_, index) => {
      intervalRefs.current[index] = setInterval(() => {
        // Only glitch if not settled
        if (!settledIndices.has(index)) {
          const randomSet = characterSets[Math.floor(Math.random() * characterSets.length)];
          const randomChar = randomSet[Math.floor(Math.random() * randomSet.length)];
          
          setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = randomChar;
            return newText;
          });

          // Randomly update glitch colors
          setGlitchColors(prev => {
            const newColors = [...prev];
            newColors[index] = getRandomGlitchColor();
            return newColors;
          });
        }
      }, glitchInterval);
    });

    // After initial glitch phase, start settling characters one by one from left to right
    setTimeout(() => {
      text.split("").forEach((char, index) => {
        const settleTime = index * settleInterval;

        setTimeout(() => {
          // Stop glitching this character
          if (intervalRefs.current[index]) {
            clearInterval(intervalRefs.current[index]!);
            intervalRefs.current[index] = null;
          }

          // Set final character and clear glitch color
          setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = char;
            return newText;
          });

          setGlitchColors(prev => {
            const newColors = [...prev];
            newColors[index] = ""; // Clear glitch color when settled
            return newColors;
          });

          setSettledIndices(prev => new Set(prev).add(index));

          // If this is the last character, mark as complete
          if (index === text.length - 1) {
            setTimeout(() => {
              setIsComplete(true);
              onComplete?.();
            }, 200);
          }
        }, settleTime);
      });
    }, initialGlitchDuration);

    return () => {
      intervalRefs.current.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  return (
    <div className={className}>
      {text.split("").map((char, index) => {
        const isSettled = settledIndices.has(index);
        const isHighlighted = highlightStart !== undefined && 
                            highlightEnd !== undefined && 
                            index >= highlightStart && 
                            index < highlightEnd;
        
        return (
          <span
            key={index}
            className={`inline-block font-nanum transition-all duration-200`}
            style={{
              opacity: displayText[index] || isSettled ? 1 : 0.3,
              color: isSettled && isHighlighted ? highlightColor : glitchColors[index] || undefined,
            }}
          >
            {isSettled ? char : (displayText[index] || char)}
          </span>
        );
      })}
    </div>
  );
};

export default GlitchText;