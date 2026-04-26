import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: Calendar, label: "History" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t border-border safe-bottom"
      style={{ background: "hsl(var(--background) / 0.85)" }}
    >
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 mx-2 rounded-2xl transition-colors",
                active ? "bg-rose-100 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-[18px] h-[18px] transition-transform", active && "scale-110")} strokeWidth={1.75} />
              <span className="font-mono-num text-[10px] uppercase tracking-[0.12em]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
