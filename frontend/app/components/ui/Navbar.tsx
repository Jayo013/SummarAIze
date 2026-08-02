"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { AnimatePresence, motion } from "framer-motion";
import { History, LayoutDashboard, Menu, Settings, Sparkles, X } from "lucide-react";
import { cn } from "./cn";
import Button from "./Button";
import Container from "./Container";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/70 backdrop-blur-xl">
      <Container size="wide" className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg">SummarAIze</span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-white bg-white/10" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <span className="text-sm text-[var(--color-text-faint)]">…</span>
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-[var(--color-text-muted)] max-w-[12rem] truncate">{user?.name || user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}
            >
              Login
            </Button>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-[var(--color-text-muted)]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <Container className="flex flex-col gap-1 py-3">
              {isAuthenticated &&
                NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              <div className="pt-2 border-t border-[var(--color-border)] mt-1">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}
                  >
                    Login
                  </Button>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
