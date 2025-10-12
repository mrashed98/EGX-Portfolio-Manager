"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Target,
  TrendingUp,
  Wallet,
  LineChart,
  BarChart3,
  Settings,
  Keyboard,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  icon: React.ReactNode;
  tags: string[];
  imageUrl?: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: "portfolios-overview",
    title: "Creating Your First Portfolio",
    category: "Portfolios",
    icon: <Target className="h-5 w-5" />,
    tags: ["portfolio", "beginner", "getting started"],
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    content: `A portfolio is a collection of stocks you want to track together. Here's how to create one:

**Step 1: Navigate to Portfolios**
Click on "Portfolios" in the sidebar to access the portfolios page.

**Step 2: Click "Create Portfolio"**
Enter a descriptive name for your portfolio that reflects its purpose or strategy.

**Step 3: Add Stocks**
Select stocks from the Egyptian Exchange (EGX) to include in your portfolio. You can add multiple stocks at once.

**Step 4: Track Performance**
View real-time performance, sector allocation, and historical changes of your portfolio.

**Pro Tips:**
• Create separate portfolios for different investment strategies (growth, dividend, etc.)
• Use sector allocation charts to ensure diversification
• Export portfolio data for external analysis
• Review and rebalance your portfolio regularly`
  },
  {
    id: "strategies-guide",
    title: "Building Investment Strategies",
    category: "Strategies",
    icon: <TrendingUp className="h-5 w-5" />,
    tags: ["strategy", "automation", "rebalancing"],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    content: `Strategies allow you to automate your investment decisions with custom allocation rules.

**Key Concepts:**

**Initial Funds:** The total amount you want to invest across all stocks in the strategy.

**Stock Allocation:** Percentage of funds allocated to each stock. The total must equal 100%.

**Rebalancing:** Adjusting holdings to match your target allocation when market movements cause drift.

**Creating a Strategy:**

1. Navigate to the Strategies page
2. Click "Create Strategy" button
3. Enter your initial investment funds
4. Add stocks with target allocations (must total 100%)
5. Execute the strategy to create actual holdings

**Rebalancing Your Strategy:**

• View suggested actions to match target allocation
• Execute rebalancing when market conditions change
• Undo actions if you made a mistake
• Track historical rebalancing actions

**Best Practices:**
• Start with equal-weight allocations if unsure
• Rebalance quarterly or when allocation drifts >5%
• Document your investment thesis for each holding`
  },
  {
    id: "holdings-management",
    title: "Managing Your Holdings",
    category: "Holdings",
    icon: <Wallet className="h-5 w-5" />,
    tags: ["holdings", "stocks", "manual"],
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop",
    content: `Holdings represent your actual stock positions. You can manage them in multiple ways:

**Adding Holdings:**

**From Strategy:** Execute a strategy to automatically create holdings based on your allocation rules.

**Manual Entry:** Add stocks independently with custom purchase dates and prices for holdings you already own.

**Import CSV:** Bulk import holdings from a CSV file for quick setup.

**Mapping Holdings:**

• Link unmapped holdings to existing portfolios or strategies
• Track the same holdings across multiple portfolios
• Organize your investments for better analysis

**Viewing Holdings:**

**Treemap View:** Visual representation of your portfolio allocation by value

**Table View:** Detailed list with current prices, purchase prices, and performance metrics

**Filters:** Easily switch between all holdings, mapped, or unmapped holdings`
  },
  {
    id: "stocks-analysis",
    title: "Stock Analysis & Research",
    category: "Stocks",
    icon: <LineChart className="h-5 w-5" />,
    tags: ["stocks", "analysis", "research"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop",
    content: `Explore the complete universe of EGX stocks with comprehensive data:

**Stock Information:**

**Price Data:** Real-time prices, OHLC (Open, High, Low, Close), and trading volume

**Recommendations:** Buy/Sell/Hold signals sourced from TradingView analysis

**Fundamentals:** P/E ratio, EPS, dividend yield, market cap, and other key metrics

**Technical Indicators:** Beta, 52-week highs/lows, and moving averages

**Features:**

**Search & Filter:** Find stocks by symbol, sector, industry, or specific metrics

**Watchlists:** Save interesting stocks for monitoring and quick access

**Stock Details:** Dive deep into individual stock data with comprehensive charts

**Price History:** View historical price movements and trends

**Pro Tips:**
• Use recommendations to identify potential opportunities
• Compare stocks within the same sector for relative valuation
• Create themed watchlists (value stocks, growth stocks, dividend payers)
• Monitor stock fundamentals alongside technical indicators`
  },
  {
    id: "tradingview-integration",
    title: "TradingView Integration",
    category: "Settings",
    icon: <Settings className="h-5 w-5" />,
    tags: ["tradingview", "integration", "data"],
    imageUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&auto=format&fit=crop",
    content: `Connect your TradingView account for enhanced real-time market data.

**Benefits:**

• Real-time price updates without delays
• Enhanced historical data access for deeper analysis
• Priority data fetching for faster load times
• Access to advanced technical indicators

**How to Connect:**

1. Navigate to the Settings page from the sidebar
2. Scroll down to the "TradingView Integration" section
3. Enter your TradingView username and password
4. Click "Connect TradingView Account" button
5. Test the connection to verify it's working

**Security:**

• Your credentials are encrypted using industry-standard encryption
• You can disconnect your account at any time
• Connection status is always visible in settings
• We never store your password in plain text

**Troubleshooting:**

• Double-check that your credentials are entered correctly
• Verify your TradingView account is active and in good standing
• Use the "Test Connection" button after connecting
• If issues persist, try disconnecting and reconnecting`
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    category: "Tips",
    icon: <Keyboard className="h-5 w-5" />,
    tags: ["shortcuts", "productivity", "tips"],
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop",
    content: `Master these keyboard shortcuts to navigate faster and boost your productivity:

**Navigation Shortcuts:**

• **⌘/Ctrl + K** - Quick search across the app
• **⌘/Ctrl + H** - Jump to Holdings page
• **⌘/Ctrl + P** - Jump to Portfolios page
• **⌘/Ctrl + S** - Jump to Strategies page
• **⌘/Ctrl + B** - Jump to Stocks page

**Action Shortcuts:**

• **⌘/Ctrl + N** - Create new (context-aware based on current page)
• **⌘/Ctrl + R** - Refresh stock prices
• **⌘/Ctrl + /** - Open this help center
• **Esc** - Close any open dialog or modal

**Pro Tips:**

• Most dialogs and modals can be closed by pressing Esc
• Use Tab to navigate between form fields efficiently
• Search functionality is available on most list pages
• Hold Shift while using shortcuts for additional actions`
  },
];

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultArticle?: string;
}

export function HelpCenter({ open, onOpenChange, defaultArticle }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = helpArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help Center
          </DialogTitle>
          <DialogDescription>
            Find answers, tutorials, and tips to get the most out of FinSet
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Articles List */}
          {!selectedArticle && (
            <div className="flex-1 flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Guides
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Tutorials
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </div>

              {/* Articles by Category */}
              <Tabs defaultValue="all" className="flex-1">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="h-[calc(80vh-280px)] mt-4">
                  <TabsContent value="all" className="space-y-2 mt-0">
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {article.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{article.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {article.category}
                              </Badge>
                              {article.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </TabsContent>

                  {categories.map((category) => (
                    <TabsContent key={category} value={category} className="space-y-2 mt-0">
                      {filteredArticles
                        .filter((a) => a.category === category)
                        .map((article) => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {article.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{article.title}</h3>
                                <div className="flex flex-wrap gap-1">
                                  {article.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>
            </div>
          )}

          {/* Article Content */}
          {selectedArticle && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArticle(null)}
                className="self-start mb-3 flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                Back to articles
              </Button>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {/* Header Image */}
                  {selectedArticle.imageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img 
                        src={selectedArticle.imageUrl} 
                        alt={selectedArticle.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-background/95 backdrop-blur-sm">
                          {selectedArticle.icon}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">{selectedArticle.title}</h2>
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {selectedArticle.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No image fallback */}
                  {!selectedArticle.imageUrl && (
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {selectedArticle.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedArticle.title}</h2>
                        <Badge variant="secondary" className="mt-0.5 text-xs">
                          {selectedArticle.category}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Article Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
                    {selectedArticle.content.split('\n').map((line, i) => {
                      const trimmedLine = line.trim();
                      
                      // Skip empty lines
                      if (!trimmedLine) {
                        return <div key={i} className="h-1" />;
                      }
                      
                      // Bold headers (text between **)
                      if (trimmedLine.startsWith('**') && trimmedLine.includes('**')) {
                        const text = trimmedLine.replace(/\*\*/g, '');
                        // Check if it's a header (ends with :)
                        if (text.endsWith(':')) {
                          return (
                            <h3 key={i} className="text-base font-bold mt-4 mb-2 text-foreground">
                              {text.slice(0, -1)}
                            </h3>
                          );
                        }
                        return (
                          <p key={i} className="font-bold text-foreground mt-3 mb-1.5">
                            {text}
                          </p>
                        );
                      }
                      
                      // Bullet points
                      if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
                        return (
                          <li key={i} className="ml-6 mb-1.5 text-muted-foreground list-disc text-sm">
                            {trimmedLine.slice(2)}
                          </li>
                        );
                      }
                      
                      // Numbered lists
                      if (/^\d+\.\s/.test(trimmedLine)) {
                        return (
                          <li key={i} className="ml-6 mb-1.5 text-muted-foreground list-decimal text-sm">
                            {trimmedLine.replace(/^\d+\.\s/, '')}
                          </li>
                        );
                      }
                      
                      // Regular paragraphs
                      return (
                        <p key={i} className="leading-relaxed text-muted-foreground text-sm">
                          {trimmedLine.split('**').map((part, j) => 
                            j % 2 === 0 ? part : <strong key={j} className="font-semibold text-foreground">{part}</strong>
                          )}
                        </p>
                      );
                    })}
                  </div>

                  {/* Feedback Section */}
                  <div className="mt-6 p-3 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-sm mb-2">Was this helpful?</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        👍 Yes
                      </Button>
                      <Button variant="outline" size="sm">
                        👎 No
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use help center
export function useHelpCenter() {
  const [open, setOpen] = useState(false);

  const openHelp = (articleId?: string) => {
    setOpen(true);
  };

  const closeHelp = () => {
    setOpen(false);
  };

  return { open, setOpen, openHelp, closeHelp };
}

