import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/FeatureCard";
import { SecurityIcon } from "@/components/SecurityIcon";
import { Shield, Lock, Eye, Server, CheckCircle, Star } from "lucide-react";
import heroImage from "@/assets/hero-security.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold text-foreground">Mega Secure App</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => window.location.href = '/auth'}>Login</Button>
            <Button variant="hero" onClick={() => window.location.href = '/auth'}>Get Started</Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Ultimate 
                <span className="bg-gradient-accent bg-clip-text text-transparent"> Security</span>
                <br />for Your Digital World
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Protect your business with enterprise-grade security solutions. 
                Advanced threat detection, real-time monitoring, and bulletproof encryption.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="shadow-glow" onClick={() => window.location.href = '/auth'}>
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/auth'}>
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-accent opacity-20 blur-3xl rounded-full"></div>
            <img 
              src={heroImage} 
              alt="Cybersecurity visualization with digital shields and network protection elements"
              className="relative z-10 w-full h-auto rounded-2xl shadow-card border border-security-border"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Comprehensive Security Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to protect your digital assets and maintain compliance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<SecurityIcon type="shield" />}
            title="Advanced Threat Protection"
            description="AI-powered threat detection blocks malicious attacks before they reach your network."
          />
          <FeatureCard
            icon={<SecurityIcon type="lock" />}
            title="End-to-End Encryption"
            description="Military-grade encryption protects your data in transit and at rest."
          />
          <FeatureCard
            icon={<SecurityIcon type="monitor" />}
            title="Real-Time Monitoring"
            description="24/7 surveillance with instant alerts for suspicious activities."
          />
          <FeatureCard
            icon={<SecurityIcon type="server" />}
            title="Secure Infrastructure"
            description="Hardened servers and networks designed for maximum security."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-card border border-security-border rounded-2xl p-12 shadow-card">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">50M+</div>
              <div className="text-muted-foreground">Threats Blocked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">10,000+</div>
              <div className="text-muted-foreground">Protected Organizations</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Ready to Secure Your Business?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of companies that trust Mega Secure App to protect their digital assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="shadow-glow" onClick={() => window.location.href = '/auth'}>
              Start Your Free Trial
            </Button>
            <Button variant="security" size="lg" onClick={() => window.location.href = '/auth'}>
              Contact Sales
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-1 text-accent">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-current" />
            ))}
            <span className="ml-2 text-muted-foreground">Rated 5/5 by security professionals</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-security-border bg-security-surface">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-accent" />
                <span className="font-bold text-foreground">Mega Secure App</span>
              </div>
              <p className="text-muted-foreground">
                Enterprise-grade security solutions for the modern digital world.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">About</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-security-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Mega Secure App. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;