interface LogoProps {
    className?: string;
    showPlus?: boolean;
    plusClassName?: string;
  }
  
  const Logo = ({ className = "", showPlus = true, plusClassName = "" }: LogoProps) => {
    return (
      <div className={`font-bold font-nanum text-foreground relative ${className}`}>
        PlusAlpha
        <span className={`absolute -top-0.5 -right-2.5 text-accent text-base font-black ${plusClassName}`}>
  +
</span>
      </div>
    );
  };
  
  export default Logo;