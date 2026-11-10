import React from 'react';

interface NaoLogoProps {
  className?: string;
  size?: number | string;
}

export const NaoLogo: React.FC<NaoLogoProps> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 512 512" 
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="nao logo"
    >
      <defs>
        {/* Deep Royal Purple Background Gradient */}
        <radialGradient id="naoBgRadial" cx="50%" cy="40%" r="65%" fx="50%" fy="30%">
          <stop offset="0%" stopColor="#3d235f" />
          <stop offset="55%" stopColor="#24153b" />
          <stop offset="100%" stopColor="#140a22" />
        </radialGradient>

        {/* Edge Rim Lighting */}
        <linearGradient id="naoEdgeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9368d4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#3b1f61" stopOpacity="0.1" />
        </linearGradient>

        {/* Warm Golden Infinity Ribbon Main Gradient */}
        <linearGradient id="naoInfinityLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5722" />
          <stop offset="25%" stopColor="#ff7f36" />
          <stop offset="50%" stopColor="#ffa855" />
          <stop offset="75%" stopColor="#ffca7a" />
          <stop offset="100%" stopColor="#ffe6b8" />
        </linearGradient>

        {/* Inner Ribbon Overlap 3D Depth Gradient */}
        <linearGradient id="naoOverlapGrad" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#e64a19" />
          <stop offset="40%" stopColor="#ff7043" />
          <stop offset="80%" stopColor="#ffb74d" />
          <stop offset="100%" stopColor="#ffe082" />
        </linearGradient>

        {/* Luminous Ambient Ribbon Glow */}
        <filter id="naoRibbonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft Text Backlight */}
        <filter id="naoTextBacklight" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#ffa059" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Base App Icon Squircle */}
      <rect width="512" height="512" rx="116" fill="url(#naoBgRadial)" />
      
      {/* Subtle 3D Beveled Rim */}
      <rect width="508" height="508" x="2" y="2" rx="114" fill="none" stroke="url(#naoEdgeGlow)" strokeWidth="2.5" />

      {/* Ambient Radiant Glow in Center */}
      <circle cx="256" cy="220" r="140" fill="#ff7f36" opacity="0.14" filter="url(#naoRibbonGlow)" />
      <circle cx="256" cy="220" r="80" fill="#9355f6" opacity="0.18" filter="url(#naoRibbonGlow)" />

      {/* Infinity Symbol Group */}
      <g transform="translate(0, -14)">
        {/* Outer Warm Volumetric Halo */}
        <path
          d="M 166 166 C 104 166 64 206 64 246 C 64 286 104 326 166 326 C 222 326 248 286 256 268 C 264 286 290 326 346 326 C 408 326 448 286 448 246 C 448 206 408 166 346 166 C 290 166 264 206 256 224 C 248 206 222 166 166 166 Z"
          fill="none"
          stroke="#ff7a38"
          strokeWidth="56"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.32"
          filter="url(#naoRibbonGlow)"
        />

        {/* Main Solid Glowing Infinity Loop */}
        <path
          d="M 166 166 C 104 166 64 206 64 246 C 64 286 104 326 166 326 C 222 326 248 286 256 268 C 264 286 290 326 346 326 C 408 326 448 286 448 246 C 448 206 408 166 346 166 C 290 166 264 206 256 224 C 248 206 222 166 166 166 Z"
          fill="none"
          stroke="url(#naoInfinityLoopGrad)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3D Crossover Fold Ribbon */}
        <path
          d="M 226 226 C 238 208 254 186 288 174 C 306 168 326 166 346 166 C 408 166 448 206 448 246 C 448 286 408 326 346 326 C 302 326 272 294 256 268 L 226 226 Z"
          fill="none"
          stroke="url(#naoOverlapGrad)"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Gloss Highlight Ribbon */}
        <path
          d="M 166 168 C 114 168 78 202 74 244 C 74 245 74 246 74 247 C 76 210 114 178 166 178 C 218 178 244 214 254 230 C 255 228 255 226 256 224 C 248 206 222 168 166 168 Z"
          fill="#ffffff"
          opacity="0.38"
        />
      </g>

      {/* 'nao' Typography with Radiant Lighting */}
      <g filter="url(#naoTextBacklight)">
        <text
          x="256"
          y="432"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Montserrat', sans-serif"
          fontSize="82"
          fontWeight="800"
          letterSpacing="5"
          fill="#fff7ed"
        >
          nao
        </text>
      </g>
    </svg>
  );
};
