"use client";

export default function Logo() {
  return (
    <>
      <style>{`
        .premium-shiny-text {
          position: relative;
          font-weight: 800; /* Slightly bolder for more presence */
          color: transparent; /* The text acts as a mask for the gradient below */
          
          /* A more complex gradient to simulate a platinum/silver metallic shine */
          background: linear-gradient(
            90deg,
            #9ca3af 0%,   /* Darker edge of the glint */
            #e5e7eb 25%,  /* Mid-tone */
            #ffffff 50%,  /* Sharp white highlight */
            #e5e7eb 75%,  /* Mid-tone */
            #9ca3af 100%  /* Other darker edge */
          );
          background-size: 200% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          
          /* A subtle shadow to lift the text from the background */
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          
          /* Slower, more elegant animation loop */
          animation: premium-shine-animation 4s linear infinite;
        }

        @keyframes premium-shine-animation {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
      `}</style>

      <div className="select-none flex items-center space-x-1 text-[20px] leading-none font-sans">
        <span className="tracking-tight premium-shiny-text">SSI</span>
        <span className="tracking-tight premium-shiny-text">Studios</span>
      </div>
    </>
  );
}
