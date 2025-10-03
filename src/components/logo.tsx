interface LogoProps {
  className?: string;
  showPlus?: boolean;
  plusClassName?: string;
}

const Logo = ({ className = "", showPlus = true, plusClassName = "" }: LogoProps) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="font-bold font-nanum tracking-tight">
        <span className="text-foreground">Plus</span>
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
          Alpha
        </span>
      </div>
        
    </div>
  );
};

export default Logo;
