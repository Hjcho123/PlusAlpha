import { Linkedin, Github, Mail, GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold font-nanum text-primary-foreground relative mb-4">
              PlusAlpha
              <span 
                className="absolute -top-1 -right-100 text-lg font-bold"
                style={{ color: 'white' }}
              >
                +
              </span>
            </div>
            <div className="flex items-start gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-primary-foreground/80 mt-1 flex-shrink-0" />
              <p className="text-primary-foreground/80">
                Founded in 2025 by Hee Jae Cho<br />
                at the Hong Kong University of Science and Technology
              </p>
            </div>
            <p className="text-primary-foreground/60 text-sm">
              Making AI-powered trading accessible to everyone
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li>
                <a href="#products" className="hover:text-primary-foreground transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary-foreground/50 rounded-full"></span>
                  Solutions
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary-foreground transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary-foreground/50 rounded-full"></span>
                  Create Account
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-foreground transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary-foreground/50 rounded-full"></span>
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a 
                href="https://www.linkedin.com/in/hee-jae-cho123" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/Hjcho123" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:your-email@example.com" 
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <div className="text-sm text-primary-foreground/60">
              <p>Open to opportunities</p>
              <p>and collaborations</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} PlusAlpha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;