export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
            >
              <defs>
                <linearGradient id="gradA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4D8BFF" />
                  <stop offset="100%" stopColor="#A464FF" />
                </linearGradient>
                <linearGradient id="gradBrush" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#87CEEB" />
                  <stop offset="100%" stopColor="#C8FFFF" />
                </linearGradient>
                <linearGradient id="gradHex" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF77A8" />
                  <stop offset="100%" stopColor="#E9A8FF" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
              </defs>
              <path 
                d="M100 450 C 150 300, 200 150, 256 50 C 312 150, 362 300, 412 450 L350 450 C 330 380, 300 280, 256 180 C 212 280, 182 380, 162 450 Z" 
                fill="url(#gradA)" 
                stroke="#300C9A"
                strokeWidth="15"
              />
               <path 
                d="M200,300 L312,300"
                stroke="url(#gradA)"
                strokeWidth="30"
              />
              <path 
                d="M120 180 L392 360"
                stroke="#2A0A8C"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M100 160 Q 110 170, 120 180 L 130 150 Q 115 140, 100 160 Z"
                fill="url(#gradBrush)"
                filter="url(#glow)"
              />
               <path
                d="M256 256 L291 236 L326 256 L326 296 L291 316 L256 296 Z"
                stroke="#87CEEB"
                strokeWidth="12"
                fill="none"
              />
              <path
                d="M266 261 L291 246 L316 261 L316 291 L291 306 L266 291 Z"
                fill="url(#gradHex)"
              />
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Arty.ai
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
