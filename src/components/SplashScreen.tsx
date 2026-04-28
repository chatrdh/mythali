import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1400);
    const t2 = setTimeout(onDone, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1F1118 0%, #160E12 50%, #1A0F15 100%)" }}
    >
      <div
        className={`transition-all duration-500 ease-out ${
          phase === "in"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-110"
        }`}
      >
        {/* Icon with pulse glow */}
        <div className="relative">
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-[28px] animate-pulse"
            style={{
              background: "radial-gradient(circle, rgba(232,160,180,0.25) 0%, transparent 70%)",
              transform: "scale(1.5)",
            }}
          />
          {/* Icon */}
          <img
            src="./icon-192.png"
            alt=""
            className="w-24 h-24 rounded-[22px] relative z-10"
            style={{
              animation: "splash-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splash-rise {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
