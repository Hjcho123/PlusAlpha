import { useEffect, useState, useRef } from "react";

interface GlitchTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  highlightStart?: number;
  highlightEnd?: number;
  highlightColor?: string;
  showPlus?: boolean;
}

const GlitchText = ({ 
  text, 
  onComplete, 
  className = "",
  highlightStart,
  highlightEnd,
  highlightColor = "hsl(136, 64.40%, 40.80%)",
  showPlus = false
}: GlitchTextProps) => {
  const [displayText, setDisplayText] = useState<string[]>(Array(text.length).fill(""));
  const [settledIndices, setSettledIndices] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [glitchColors, setGlitchColors] = useState<string[]>(Array(text.length).fill(""));
  const [glitchOpacities, setGlitchOpacities] = useState<number[]>(Array(text.length).fill(0.3)); // Start with low opacity
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>([]);
  const hasRunRef = useRef(false);

  // Extended character sets for glitching effect
  const characterSets = [
    // Latin (basic + extended)
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",
    
    // Numbers and symbols
    "0123456789",
    "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
    
    // Greek and Coptic
    "αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",
    
    // Cyrillic (multiple languages)
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя",
    "ЀЁЂЃЄЅІЇЈЉЊЋЌЍЎЏѠѢѤѦѨѪѬѮѰѲѴѶѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾ",
    
    // Japanese (Hiragana + Katakana)
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
    
    // Korean (Hangul)
    "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호",
    
    // Chinese (common characters)
    "床前明月光疑是地上霜举头望明月低头思故乡春夏秋冬天地人",
    
    // Mathematical symbols
    "∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯",
    
    // Geometric shapes
    "■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯▰▱▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅◆◇◈◉◊○◌◍◎●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮◯"
  ];

  // Function to get random accent color appearance
  const getRandomGlitchColor = () => {
    const shouldUseAccent = Math.random() < 0.65;
    return shouldUseAccent ? "hsl(var(--accent))" : "";
  };

  // Function to get random opacity for glitching characters (never fully opaque)
  const getRandomGlitchOpacity = () => {
    return 0.3 + Math.random() * 0.5; // Range: 0.3 to 0.8 (never 1.0)
  };

  useEffect(() => {
    // Prevent double execution
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const initialGlitchDuration = 200;
    const settleAnimationDuration = 1800;
    const textLength = text.length;
    const settleInterval = settleAnimationDuration / textLength;
    const glitchInterval = 40;

    // Start all characters glitching immediately
    text.split("").forEach((_, index) => {
      intervalRefs.current[index] = setInterval(() => {
        if (!settledIndices.has(index)) {
          const randomSet = characterSets[Math.floor(Math.random() * characterSets.length)];
          const randomChar = randomSet[Math.floor(Math.random() * randomSet.length)];
          
          setDisplayText(prev => {
            const newText = [...prev];
            newText[index] = randomChar;
            return newText;
          });

          setGlitchColors(prev => {
            const newColors = [...prev];
            newColors[index] = getRandomGlitchColor();
            return newColors;
          });

          // Update opacity randomly for glitching characters
          setGlitchOpacities(prev => {
            const newOpacities = [...prev];
            newOpacities[index] = getRandomGlitchOpacity();
            return newOpacities;
          });
        }
      }, glitchInterval);
    });

    // After initial glitch phase, start settling characters one by one
    setTimeout(() => {
      text.split("").forEach((char, index) => {
        const settleTime = index * settleInterval;

        setTimeout(() => {
          if (intervalRefs.current[index]) {
            clearInterval(intervalRefs.current[index]!);
            intervalRefs.current[index] = null;
          }

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

          setGlitchOpacities(prev => {
            const newOpacities = [...prev];
            newOpacities[index] = 1; // Set to fully opaque when settled
            return newOpacities;
          });

          setSettledIndices(prev => new Set(prev).add(index));

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
    <div className={`${className} relative`}>
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
              opacity: isSettled ? 1 : glitchOpacities[index], // Use opacity array for glitching chars
              color: isSettled && isHighlighted ? highlightColor : glitchColors[index] || undefined,
            }}
          >
            {isSettled ? char : (displayText[index] || char)}
          </span>
        );
      })}
      
      {/* Plus symbol that appears when animation completes */}
      {showPlus && isComplete && (
        <span className="absolute -top-2 -right-14 text-accent text-4xl md:text-7xl font-light">
          +
        </span>
      )}
    </div>
  );
};

export default GlitchText;