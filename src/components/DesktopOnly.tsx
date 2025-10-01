const DesktopOnly = () => {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6 md:hidden">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">💻</div>
          <h2 className="text-2xl font-bold font-nanum text-foreground mb-4">
            You'll Need a Bigger Screen...
          </h2>
          <p className="text-muted-foreground mb-6">
            PlusAlpha is optimized for desktop and tablet viewing. 
            Please visit us on a larger screen for the best experience.
          </p>
          <div className="text-sm text-muted-foreground/70">
            <p>Supported: Desktop, iPad (landscape)</p>
            <p>Minimum width: 768px</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default DesktopOnly;