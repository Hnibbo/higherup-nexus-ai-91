import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { Download, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPrompt = () => {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember user dismissed for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if not installable, already dismissed, or user is on desktop
  if (!isInstallable || !isVisible || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="border-primary/20 shadow-lg backdrop-blur-sm bg-background/95">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm">Install HigherUp.ai</CardTitle>
                  <CardDescription className="text-xs">
                    Add to your home screen for easy access
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};