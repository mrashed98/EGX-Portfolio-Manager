"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  LineChart,
  Settings
} from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    target: "welcome",
    title: "Welcome to FinSet! 🎉",
    description: "Let's take a quick tour to help you get started with managing your EGX portfolio. This will only take 2 minutes!",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    target: "[data-tour='portfolios']",
    title: "Portfolios",
    description: "Create and manage multiple portfolios to organize your investments. Track performance, sector allocation, and historical changes.",
    icon: <Target className="h-6 w-6" />,
    position: "right",
    action: "View your portfolios"
  },
  {
    target: "[data-tour='strategies']",
    title: "Investment Strategies",
    description: "Build automated investment strategies with custom allocation rules. Execute rebalancing actions and track historical performance.",
    icon: <TrendingUp className="h-6 w-6" />,
    position: "right",
    action: "Create a strategy"
  },
  {
    target: "[data-tour='holdings']",
    title: "Holdings",
    description: "View all your stock holdings in one place. Add manual holdings, map them to portfolios or strategies, and track real-time values.",
    icon: <Wallet className="h-6 w-6" />,
    position: "right",
    action: "Manage holdings"
  },
  {
    target: "[data-tour='stocks']",
    title: "Stock Universe",
    description: "Browse all available EGX stocks with real-time prices, recommendations, and fundamental data. Add stocks to watchlists or portfolios.",
    icon: <LineChart className="h-6 w-6" />,
    position: "right",
    action: "Explore stocks"
  },
  {
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    description: "Use these shortcuts to quickly create portfolios, strategies, add holdings, or refresh market prices.",
    icon: <Sparkles className="h-6 w-6" />,
    position: "right"
  },
  {
    target: "[data-tour='settings']",
    title: "Settings & Integration",
    description: "Connect your TradingView account for enhanced real-time data, customize appearance, and configure notifications.",
    icon: <Settings className="h-6 w-6" />,
    position: "right"
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("finset_onboarding_completed");
    if (!hasSeenTour) {
      // Delay to ensure DOM is ready
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep]) {
      const step = tourSteps[currentStep];
      if (step.target === "welcome") {
        setTargetElement(null);
      } else {
        const element = document.querySelector(step.target) as HTMLElement;
        setTargetElement(element);
        
        if (element) {
          // Scroll element into view
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight element
          element.style.position = "relative";
          element.style.zIndex = "1001";
        }
      }
    }

    return () => {
      // Cleanup highlight
      if (targetElement) {
        targetElement.style.zIndex = "";
      }
    };
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("finset_onboarding_completed", "true");
    setIsOpen(false);
    onComplete?.();
  };

  const handleComplete = () => {
    localStorage.setItem("finset_onboarding_completed", "true");
    setIsOpen(false);
    onComplete?.();
  };

  const getTooltipPosition = () => {
    if (!targetElement) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const rect = targetElement.getBoundingClientRect();
    const position = tourSteps[currentStep].position || "bottom";

    switch (position) {
      case "top":
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: "translate(0, -50%)",
        };
      default:
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isWelcome = step.target === "welcome";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]" />

      {/* Spotlight effect on target */}
      {targetElement && (
        <div
          className="fixed border-4 border-primary rounded-lg pointer-events-none z-[1001] transition-all duration-300"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tour Card */}
      <Card
        className="fixed z-[1002] w-[420px] shadow-2xl"
        style={isWelcome ? {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        } : getTooltipPosition()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {step.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Step {currentStep + 1} of {tourSteps.length}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.action && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <ChevronRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{step.action}</span>
            </div>
          )}

          <Progress value={progress} className="h-1.5" />
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  Complete
                  <Check className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

// Hook to restart the tour
export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem("finset_onboarding_completed");
    window.location.reload();
  };

  const hasCompletedTour = () => {
    return localStorage.getItem("finset_onboarding_completed") === "true";
  };

  return { restartTour, hasCompletedTour };
}

