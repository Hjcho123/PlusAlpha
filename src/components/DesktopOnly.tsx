import { useState, useEffect } from "react";

const DesktopOnly = () => {
  const [isValidScreen, setIsValidScreen] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });

      // Check both width and height for proper desktop/tablet experience
      // Minimum: 768px width, 650px height (proper laptop/tablet screen dimensions)
      const isValid = width >= 768 && height >= 650;
      setIsValidScreen(isValid);
    };

    // Check on mount
    checkScreenSize();

    // Check on resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isValidScreen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">💻</div>
        <h2 className="text-2xl font-bold font-nanum text-foreground mb-4">
          You'll Need a Better Screen...
        </h2>
        <p className="text-muted-foreground mb-6">
          PlusAlpha requires a proper desktop or tablet screen for optimal viewing.
          Please use a laptop, desktop computer, or tablet in landscape mode.
        </p>
        <div className="text-sm text-muted-foreground/70 bg-muted/30 rounded-lg p-4">
          <p className="font-medium mb-2">Current Screen: {screenSize.width} × {screenSize.height}</p>
          <div className="space-y-1">
            <p>Minimum requirements:</p>
            <p>• Width: 768px</p>
            <p>• Height: 650px</p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs">Supported: Desktop, Laptop, iPad (landscape)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopOnly;
