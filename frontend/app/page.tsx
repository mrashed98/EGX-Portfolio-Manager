import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Target,
  Shield,
  Zap,
  LineChart,
  PieChart,
  Activity,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FinSet
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
            EGX Portfolio Management
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Master Your{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Egyptian Exchange
            </span>
            {" "}Investments
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Professional-grade portfolio management platform designed for the Egyptian stock market.
            Track, analyze, and optimize your investments with real-time data and advanced analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Free forever
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional tools designed for Egyptian investors
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Portfolio Management</h3>
                <p className="text-muted-foreground">
                  Create and manage multiple portfolios with real-time tracking and performance analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Investment Strategies</h3>
                <p className="text-muted-foreground">
                  Build custom investment strategies with automated rebalancing and risk management.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Comprehensive charts and metrics to analyze your portfolio's performance over time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Real-Time Data</h3>
                <p className="text-muted-foreground">
                  Live stock prices, market data, and instant updates from the Egyptian Exchange.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Sector Analysis</h3>
                <p className="text-muted-foreground">
                  Visualize your portfolio's sector allocation and diversification with interactive charts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Bank-level security with encrypted data storage and secure authentication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">100+</div>
              <p className="text-muted-foreground">EGX Stocks Tracked</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">Real-Time</div>
              <p className="text-muted-foreground">Market Data</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">24/7</div>
              <p className="text-muted-foreground">Portfolio Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-6 text-white">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              Ready to Take Control of Your Investments?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of investors managing their EGX portfolios smarter.
            </p>
            <div className="pt-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-semibold">FinSet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 FinSet. Professional EGX Portfolio Management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

