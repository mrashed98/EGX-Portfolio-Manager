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
}

const helpArticles: HelpArticle[] = [
  {
    id: "portfolios-overview",
    title: "Creating Your First Portfolio",
    category: "Portfolios",
    icon: <Target className="h-5 w-5" />,
    tags: ["portfolio", "beginner", "getting started"],
    content: `
# Creating Your First Portfolio

A portfolio is a collection of stocks you want to track together. Here's how to create one:

1. **Navigate to Portfolios** - Click on "Portfolios" in the sidebar
2. **Click "Create Portfolio"** - Enter a name for your portfolio
3. **Add Stocks** - Select stocks from the Egyptian Exchange (EGX)
4. **Track Performance** - View real-time performance, sector allocation, and historical changes

**Pro Tips:**
- Create separate portfolios for different investment strategies (growth, dividend, etc.)
- Use sector allocation charts to ensure diversification
- Export portfolio data for external analysis
    `
  },
  {
    id: "strategies-guide",
    title: "Building Investment Strategies",
    category: "Strategies",
    icon: <TrendingUp className="h-5 w-5" />,
    tags: ["strategy", "automation", "rebalancing"],
    content: `
# Building Investment Strategies

Strategies allow you to automate your investment decisions with custom allocation rules.

**Key Concepts:**
- **Initial Funds**: The total amount you want to invest
- **Stock Allocation**: Percentage of funds allocated to each stock
- **Rebalancing**: Adjusting holdings to match target allocation

**Creating a Strategy:**
1. Go to Strategies page
2. Click "Create Strategy"
3. Set your initial funds
4. Add stocks with target allocations (must total 100%)
5. Execute to create holdings

**Rebalancing:**
- View suggested actions to match target allocation
- Execute rebalancing when market conditions change
- Undo actions if needed
    `
  },
  {
    id: "holdings-management",
    title: "Managing Your Holdings",
    category: "Holdings",
    icon: <Wallet className="h-5 w-5" />,
    tags: ["holdings", "stocks", "manual"],
    content: `
# Managing Your Holdings

Holdings represent your actual stock positions. You can manage them in multiple ways:

**Adding Holdings:**
- **From Strategy**: Execute a strategy to automatically create holdings
- **Manual Entry**: Add stocks independently with custom purchase dates and prices
- **Import CSV**: Bulk import holdings from a CSV file

**Mapping Holdings:**
- Link unmapped holdings to existing portfolios or strategies
- Track holdings across multiple portfolios

**Viewing Holdings:**
- **Treemap View**: Visual representation of allocation
- **Table View**: Detailed list with prices and performance
- **Filters**: View all, mapped, or unmapped holdings
    `
  },
  {
    id: "stocks-analysis",
    title: "Stock Analysis & Research",
    category: "Stocks",
    icon: <LineChart className="h-5 w-5" />,
    tags: ["stocks", "analysis", "research"],
    content: `
# Stock Analysis & Research

Explore the complete universe of EGX stocks with comprehensive data:

**Stock Information:**
- **Price Data**: Real-time prices, OHLC data, volume
- **Recommendations**: Buy/Sell/Hold signals from TradingView
- **Fundamentals**: P/E ratio, EPS, dividend yield, market cap
- **Technical**: Beta, 52-week high/low, moving averages

**Features:**
- **Search & Filter**: Find stocks by symbol, sector, or metrics
- **Watchlists**: Save interesting stocks for monitoring
- **Stock Details**: Dive deep into individual stock data
- **Price History**: View historical price charts

**Pro Tips:**
- Use recommendations to identify potential opportunities
- Compare stocks within the same sector
- Set up watchlists for different themes (value, growth, dividend)
    `
  },
  {
    id: "tradingview-integration",
    title: "TradingView Integration",
    category: "Settings",
    icon: <Settings className="h-5 w-5" />,
    tags: ["tradingview", "integration", "data"],
    content: `
# TradingView Integration

Connect your TradingView account for enhanced real-time market data.

**Benefits:**
- Real-time price updates
- Enhanced historical data access
- Priority data fetching
- Advanced technical indicators

**How to Connect:**
1. Go to Settings page
2. Scroll to "TradingView Integration"
3. Enter your TradingView credentials
4. Click "Connect TradingView Account"
5. Test connection to verify

**Security:**
- Your credentials are encrypted and stored securely
- You can disconnect at any time
- Connection status is always visible

**Troubleshooting:**
- Ensure credentials are correct
- Check your TradingView account is active
- Test connection after setup
    `
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    category: "Tips",
    icon: <Keyboard className="h-5 w-5" />,
    tags: ["shortcuts", "productivity", "tips"],
    content: `
# Keyboard Shortcuts

Master these shortcuts to navigate faster:

**Navigation:**
- **⌘/Ctrl + K**: Quick search
- **⌘/Ctrl + H**: Go to Holdings
- **⌘/Ctrl + P**: Go to Portfolios
- **⌘/Ctrl + S**: Go to Strategies
- **⌘/Ctrl + B**: Go to Stocks

**Actions:**
- **⌘/Ctrl + N**: Create new (context-aware)
- **⌘/Ctrl + R**: Refresh prices
- **⌘/Ctrl + ?**: Open help center
- **Esc**: Close dialogs

**Pro Tips:**
- Most dialogs can be closed with Esc
- Use Tab to navigate form fields
- Search is available on most list pages
    `
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
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help Center
          </DialogTitle>
          <DialogDescription>
            Find answers, tutorials, and tips to get the most out of FinSet
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full gap-4">
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
            <div className="flex-1 flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArticle(null)}
                className="self-start mb-4"
              >
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                Back to articles
              </Button>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {selectedArticle.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
                      <Badge variant="secondary" className="mt-1">
                        {selectedArticle.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {selectedArticle.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold mt-4 mb-2">{line.slice(2, -2)}</p>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4">{line.slice(2)}</li>;
                      } else if (line.trim()) {
                        return <p key={i} className="mb-2 text-muted-foreground">{line}</p>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Related Articles */}
                  <div className="mt-8 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold mb-2">Was this helpful?</h3>
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

