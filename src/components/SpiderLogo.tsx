import { cn } from "@/lib/utils";

interface SpiderLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SpiderLogo = ({ size = "md", className }: SpiderLogoProps) => {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={cn(sizes[size], className, "relative group")}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Web Pattern - Behind spider */}
        <g stroke="hsl(0 0% 85%)" strokeWidth="0.8" fill="none" opacity="0.6">
          {/* Radial web lines */}
          <line x1="50" y1="50" x2="50" y2="5" />
          <line x1="50" y1="50" x2="85" y2="15" />
          <line x1="50" y1="50" x2="95" y2="50" />
          <line x1="50" y1="50" x2="85" y2="85" />
          <line x1="50" y1="50" x2="50" y2="95" />
          <line x1="50" y1="50" x2="15" y2="85" />
          <line x1="50" y1="50" x2="5" y2="50" />
          <line x1="50" y1="50" x2="15" y2="15" />
          
          {/* Concentric circles */}
          <circle cx="50" cy="50" r="15" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="45" />
        </g>

        {/* Spider Body - Main body with segments */}
        <ellipse cx="50" cy="48" rx="8" ry="10" fill="url(#spiderRedGradient)" className="drop-shadow-md"/>
        <ellipse cx="50" cy="54" rx="6" ry="7" fill="url(#spiderRedDarkGradient)" className="drop-shadow-md"/>
        
        {/* Spider Head */}
        <circle cx="50" cy="42" r="5" fill="url(#spiderRedGradient)" />
        
        {/* Spider Eyes */}
        <circle cx="48" cy="41" r="1.5" fill="white" opacity="0.9" />
        <circle cx="52" cy="41" r="1.5" fill="white" opacity="0.9" />
        
        {/* Spider Legs - 8 legs total */}
        <g stroke="url(#spiderRedGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" className="drop-shadow-sm">
          {/* Front Right legs */}
          <path d="M 56 44 Q 70 35, 82 28" />
          <path d="M 58 48 Q 75 45, 88 42" />
          
          {/* Back Right legs */}
          <path d="M 58 54 Q 75 57, 88 60" />
          <path d="M 56 58 Q 70 67, 82 74" />
          
          {/* Front Left legs */}
          <path d="M 44 44 Q 30 35, 18 28" />
          <path d="M 42 48 Q 25 45, 12 42" />
          
          {/* Back Left legs */}
          <path d="M 42 54 Q 25 57, 12 60" />
          <path d="M 44 58 Q 30 67, 18 74" />
        </g>

        {/* Gradients */}
        <defs>
          <radialGradient id="spiderRedGradient" cx="40%" cy="40%">
            <stop offset="0%" style={{ stopColor: "hsl(0 85% 60%)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "hsl(0 85% 45%)", stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id="spiderRedDarkGradient" cx="40%" cy="40%">
            <stop offset="0%" style={{ stopColor: "hsl(0 75% 50%)", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "hsl(0 75% 35%)", stopOpacity: 1 }} />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
