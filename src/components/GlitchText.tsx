import { useEffect, useState, useRef } from "react";

interface GlitchTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
}

const GlitchText = ({ text, onComplete, className = "" }: GlitchTextProps) => {
  const [displayText, setDisplayText] = useState<string[]>(Array(text.length).fill(""));
  const [isComplete, setIsComplete] = useState(false);
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>([]);

  // Extended character sets for glitching effect
  const characterSets = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*()_+-=[]{}|;:,.<>?",
    "αβγδεζηθικλμνξοπρστυφχψω",
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
    "あいうえおかきくけこさしすせそたちつてとなにぬねの",
    "가나다라마바사아자차카타파하",
  ];

  const fonts = [
    "font-sans",
    "font-serif",
    "font-mono",
    "font-nanum",
  ];

  useEffect(() => {
    const totalDuration = 2500; // Total glitch duration
    const charDelayIncrement = 150; // Delay between each character starting

    text.split("").forEach((char, index) => {
      const startDelay = index * charDelayIncrement;
      const glitchDuration = totalDuration - startDelay;
      const glitchInterval = 50;

      // Start glitching after delay
      const startTimeout = setTimeout(() => {
        intervalRefs.current[index] = setInterval(() => {
          const randomSet = characterSets[Math.floor(Math.random() * characterSets.length)];
          const randomChar = randomSet[Math.floor(Math.random() * randomSet.length)];
          
          setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = randomChar;
            return newText;
          });
        }, glitchInterval);

        // Stop glitching and show final character
        setTimeout(() => {
          if (intervalRefs.current[index]) {
            clearInterval(intervalRefs.current[index]!);
          }
          setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = char;
            return newText;
          });

          // Check if this is the last character
          if (index === text.length - 1) {
            setTimeout(() => {
              setIsComplete(true);
              onComplete?.();
            }, 300);
          }
        }, glitchDuration);
      }, startDelay);
    });

    return () => {
      intervalRefs.current.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [text, onComplete]);

  return (
    <div className={`${className} ${isComplete ? 'font-nanum' : ''}`}>
      {displayText.map((char, index) => {
        const isSettled = char === text[index];
        const randomFont = !isSettled ? fonts[Math.floor(Math.random() * fonts.length)] : 'font-nanum';
        
        return (
          <span
            key={index}
            className={`inline-block transition-all duration-100 ${
              isSettled ? 'font-nanum' : randomFont
            }`}
            style={{
              opacity: char ? 1 : 0,
            }}
          >
            {char || text[index]}
          </span>
        );
      })}
    </div>
  );
};

export default GlitchText;
