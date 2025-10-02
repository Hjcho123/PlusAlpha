import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Palette, Globe, Shield, Zap, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    marketNews: false,
    aiInsights: true,
    tradingSignals: true,
    weeklyReports: false
  });

  const [preferences, setPreferences] = useState({
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'US'
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    sharePerformance: false,
    allowAnalytics: true,
    marketingEmails: false
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-24 px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please log in to access settings.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleSavePrivacy = () => {
    toast({
      title: "Privacy Settings Updated",
      description: "Your privacy settings have been saved.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-nanum mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Customize your PlusAlpha experience
            </p>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Price Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your stocks hit target prices
                        </p>
                      </div>
                      <Switch
                        checked={notifications.priceAlerts}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, priceAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Portfolio Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Daily updates on your portfolio performance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.portfolioUpdates}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, portfolioUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Market News</Label>
                        <p className="text-sm text-muted-foreground">
                          Breaking news and market updates
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketNews}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, marketNews: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">AI Insights</Label>
                        <p className="text-sm text-muted-foreground">
                          New AI-generated trading insights
                        </p>
                      </div>
                      <Switch
                        checked={notifications.aiInsights}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, aiInsights: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Trading Signals</Label>
                        <p className="text-sm text-muted-foreground">
                          Buy/sell signals from our AI algorithms
                        </p>
                      </div>
                      <Switch
                        checked={notifications.tradingSignals}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, tradingSignals: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Weekly summary of your trading activity
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveNotifications}>
                      Save Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred color scheme
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant={!isDark ? 'default' : 'outline'}
                          onClick={() => isDark && toggleTheme()}
                          className="flex items-center gap-2"
                        >
                          <Sun className="w-4 h-4" />
                          Light
                        </Button>
                        <Button
                          variant={isDark ? 'default' : 'outline'}
                          onClick={() => !isDark && toggleTheme()}
                          className="flex items-center gap-2"
                        >
                          <Moon className="w-4 h-4" />
                          Dark
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Chart Style</Label>
                      <p className="text-sm text-muted-foreground">
                        Default chart style for stock visualizations
                      </p>
                      <Select defaultValue="candlestick">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="candlestick">Candlestick</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Density</Label>
                      <p className="text-sm text-muted-foreground">
                        Interface density and spacing
                      </p>
                      <Select defaultValue="comfortable">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Regional Preferences
                  </CardTitle>
                  <CardDescription>
                    Set your location and formatting preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={preferences.currency}
                        onValueChange={(value) => 
                          setPreferences(prev => ({ ...prev, currency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => 
                          setPreferences(prev => ({ ...prev, timezone: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST - Eastern Time</SelectItem>
                          <SelectItem value="PST">PST - Pacific Time</SelectItem>
                          <SelectItem value="CET">CET - Central European</SelectItem>
                          <SelectItem value="JST">JST - Japan Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => 
                          setPreferences(prev => ({ ...prev, dateFormat: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Number Format</Label>
                      <Select
                        value={preferences.numberFormat}
                        onValueChange={(value) => 
                          setPreferences(prev => ({ ...prev, numberFormat: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">1,234.56 (US)</SelectItem>
                          <SelectItem value="EU">1.234,56 (EU)</SelectItem>
                          <SelectItem value="IN">1,23,456.78 (IN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSavePreferences}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Data
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Share Performance Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow anonymized performance data to be used for research
                        </p>
                      </div>
                      <Switch
                        checked={privacy.sharePerformance}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, sharePerformance: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Analytics & Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Help improve our service through usage analytics
                        </p>
                      </div>
                      <Switch
                        checked={privacy.allowAnalytics}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, allowAnalytics: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive promotional emails about new features
                        </p>
                      </div>
                      <Switch
                        checked={privacy.marketingEmails}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, marketingEmails: checked }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Control who can see your profile information
                      </p>
                      <Select
                        value={privacy.profileVisibility}
                        onValueChange={(value) => 
                          setPrivacy(prev => ({ ...prev, profileVisibility: value }))
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSavePrivacy}>
                      Save Privacy Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Settings;
