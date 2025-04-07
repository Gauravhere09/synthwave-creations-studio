
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
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
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                AI Studio
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
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
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`p-2 rounded-md flex flex-col items-center ${
                location.pathname === item.href
                  ? 'text-primary bg-secondary/50'
                  : 'text-muted-foreground'
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
