import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { SignupForm } from "@/components/signup-form";

export default function RegisterPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </div>
            <span className="font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FinSet
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Start Managing Your Portfolio Today
            </h2>
            <p className="text-lg text-muted-foreground">
              Join FinSet to track your EGX investments with powerful analytics,
              portfolio management tools, and real-time market data.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">EGX Stocks</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">Real-time</div>
                <div className="text-sm text-muted-foreground">Updates</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">Free</div>
                <div className="text-sm text-muted-foreground">Forever</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
