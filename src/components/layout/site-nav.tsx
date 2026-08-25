import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useScrolled } from "@/hooks/use-scrolled";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { resetCloudReports } from "@/lib/reports/cloud";
import { cn } from "@/lib/utils";

type NavItem = { label: string; comingSoon?: boolean };

/** Routes that exist today. */
const NAV_LINKS = [
  { label: "Reports", to: "/reports" },
  { label: "Favorites", to: "/favorites" },
] as const;

const NAV_ITEMS: NavItem[] = [
  { label: "Documentation" },
  { label: "About" },
  { label: "Pricing", comingSoon: true },
];

const NAV_LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-micro) hover:text-foreground";

function NavItemButton({ item, className }: { item: NavItem; className?: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title={`${item.label} is coming soon`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-micro) hover:text-foreground",
        className,
      )}
    >
      {item.label}
      {item.comingSoon ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
          Coming Soon
        </span>
      ) : null}
    </button>
  );
}

/**
 * Fixed top navigation. Transparent at the top of the page, softly elevated
 * with a blur after 40px of scroll.
 */
export function SiteNav({ onAnalyzeClick }: { onAnalyzeClick?: () => void }) {
  const scrolled = useScrolled(40);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { session, email } = useSession();

  const handleAnalyze = () => {
    if (onAnalyzeClick) {
      onAnalyzeClick();
    } else {
      navigate({ to: "/" });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    resetCloudReports();
    setOpen(false);
    void navigate({ to: "/", replace: true });
  };

  const accountLabel = email ? email.split("@")[0] : "";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-(--motion-component) ease-(--motion-ease)",
        scrolled ? "bg-background/80 shadow-soft backdrop-blur-md" : "bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="safe-x mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between gap-4 px-5 sm:px-8"
      >

        <BrandMark />

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={NAV_LINK_CLASS}
              activeProps={{ className: "text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          {NAV_ITEMS.map((item) => (
            <NavItemButton key={item.label} item={item} />
          ))}
          <Button
            className="ml-2 min-h-11 rounded-lg shadow-soft transition-all duration-(--motion-component) ease-(--motion-ease) hover:-translate-y-0.5 hover:shadow-card"
            onClick={handleAnalyze}
          >
            Analyze Website
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            size="sm"
            className="min-h-11 rounded-lg px-4 shadow-soft transition-all duration-(--motion-component) ease-(--motion-ease) hover:-translate-y-0.5 hover:shadow-card"
            onClick={handleAnalyze}
          >
            Analyze
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[18rem]">
              <SheetHeader>
                <SheetTitle className="text-left font-display">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex flex-col gap-1 px-4 pb-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(NAV_LINK_CLASS, "justify-start")}
                    activeProps={{ className: "text-foreground" }}
                  >
                    {link.label}
                  </Link>
                ))}
                {NAV_ITEMS.map((item) => (
                  <NavItemButton key={item.label} item={item} className="justify-start" />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
