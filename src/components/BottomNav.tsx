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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to}
              className={cn("flex flex-col items-center gap-0.5 py-2.5 transition",
                active ? "text-primary" : "text-muted-foreground")}>
              <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
