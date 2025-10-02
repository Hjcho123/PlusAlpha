import { Linkedin, Github, Mail, GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold font-nanum text-foreground relative mb-4">
              PlusAlpha
              <span 
                className="absolute -top-1 -right-0.1 text-lg font-bold text-primary"
              >
                +
              </span>
            </div>
            <div className="flex items-start gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
              <p className="text-foreground">
                Founded in 2025 by Hee Jae Cho<br />
                at the Hong Kong University of Science and Technology
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              Making AI-powered trading accessible to everyone
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-foreground">Quick Links</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <a href="#products" className="hover:text-primary transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary/50 rounded-full"></span>
                  Solutions
                </a>
              </li>
              <li>
                <a href="#journey" className="hover:text-primary transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary/50 rounded-full"></span>
                  Create Account
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary/50 rounded-full"></span>
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-foreground">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a 
                href="https://www.linkedin.com/in/hee-jae-cho123" 
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/Hjcho123" 
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-foreground"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:your-email@example.com" 
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-foreground"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Open to opportunities</p>
              <p>and collaborations</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PlusAlpha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
