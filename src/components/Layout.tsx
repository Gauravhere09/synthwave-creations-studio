
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Twitter, Instagram } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { Button } from './ui/button';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: 'Script Generator', href: '/' },
    { name: 'Image Generator', href: '/image-generator' },
    { name: 'Voice Generator', href: '/voice-generator' },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 transition-transform hover:scale-105">
                AI Studio
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSettingsOpen(true)}
              className="transition-transform hover:scale-110"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>
      
      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-muted-foreground">
            © 2025 AI Studio. All rights reserved.
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a 
              href="https://twitter.com/yourusername" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a 
              href="https://instagram.com/yourusername" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </a>
          </div>
        </div>
      </footer>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`p-2 rounded-md flex flex-col items-center transition-colors ${
                location.pathname === item.href
                  ? 'text-primary bg-secondary/50'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  );
};

export default Layout;
