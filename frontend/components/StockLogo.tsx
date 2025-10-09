"use client";

import React from "react";
import Image from "next/image";

interface StockLogoProps {
  symbol: string;
  name?: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

export function StockLogo({ 
  symbol, 
  name, 
  logoUrl, 
  size = 40,
  className = "" 
}: StockLogoProps) {
  // If logo URL is provided, use it
  if (logoUrl) {
    return (
      <div className={`flex-shrink-0 ${className}`}>
        <Image
          src={logoUrl}
          alt={`${symbol} logo`}
          width={size}
          height={size}
          className="rounded-full object-cover"
          unoptimized // For external URLs
        />
      </div>
    );
  }

  // Fallback: Generate a colored circle with the stock symbol
  const getBackgroundColor = (symbol: string) => {
    const colors = [
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-orange-600",
      "bg-teal-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-red-600",
    ];
    const index = symbol.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const bgColor = getBackgroundColor(symbol);

  return (
    <div 
      className={`flex-shrink-0 ${bgColor} rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>
        {symbol.substring(0, 2)}
      </span>
    </div>
  );
}

