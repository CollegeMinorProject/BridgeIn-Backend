import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, LogOut, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  fillWhenActive?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, fillWhenActive: true },
  { to: "/search", label: "Search", icon: Search },
  {
    to: "/chat",
    label: "Messages",
    icon: MessageCircle,
    badge: 2,
    fillWhenActive: true,
  },
  {
    to: "/notification",
    label: "Notifications",
    icon: Bell,
    badge: 3,
    fillWhenActive: true,
  },
  { to: "/profile", label: "Profile", icon: User, fillWhenActive: true },
];

const itemClass =
  "group flex h-full flex-1 items-center justify-center text-neutral-900 transition-colors dark:text-white " +
  "lg:h-auto lg:flex-none lg:justify-start lg:gap-4 lg:rounded-lg lg:p-3 lg:hover:bg-neutral-100 lg:dark:hover:bg-neutral-900";

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <span className="relative transition-transform group-hover:scale-105">
      <Icon
        className="size-6 shrink-0"
        strokeWidth={active ? 2.5 : 1.75}
        fill={active && item.fillWhenActive ? "currentColor" : "none"}
      />
      {item.badge ? (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </span>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav
      className={cn(
        // Small screens: bottom bar
        "fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]",
        "dark:border-neutral-800 dark:bg-black",
        // Large screens: left sidebar
        "lg:inset-y-0 lg:right-auto lg:h-screen lg:w-61 lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:border-r lg:border-t-0 lg:px-3 lg:pb-5 lg:pt-8",
      )}
    >
      {/* Logo (sidebar only) */}
      <Link
        to="/"
        className="mb-4 hidden h-12 items-center px-3 font-serif text-2xl italic text-neutral-900 lg:flex dark:text-white"
      >
        MyApp
      </Link>

      {navItems.map((item) => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={cn(itemClass, active && "font-bold")}
          >
            <NavIcon item={item} active={active} />
            <span className="hidden text-base lg:block">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        aria-label="Logout"
        className={cn(itemClass, "lg:mt-auto")}
      >
        <LogOut className="size-6 shrink-0 transition-transform group-hover:scale-105" />
        <span className="hidden text-base lg:block">Logout</span>
      </button>
    </nav>
  );
}
