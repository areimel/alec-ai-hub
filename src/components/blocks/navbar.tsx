import { useEffect, useRef, useState } from "react";

import { ArrowUpRight, Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import branding from "@/data/branding.json";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

const NAV = branding.navigation.main;
const CTA = branding.navigation.cta;

const ctaStyle = {
  primary: "bg-primary text-primary-foreground hover:opacity-80",
  outline: "border-border border bg-transparent hover:border-primary",
} as const;

function CtaLinks({
  className,
  onNavigate,
}: {
  className: string;
  onNavigate?: () => void;
}) {
  return CTA.map(({ title, url, variant }) => (
    <a
      key={url + title}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={`${ctaStyle[variant as keyof typeof ctaStyle]} font-mono text-xs transition-opacity ${className} ${focus}`}
    >
      {title} <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  ));
}

export function Navbar({ pathname = "/" }: { pathname?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <header
      ref={header}
      className="bg-background text-foreground border-border relative z-40 w-full border-y"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-5 md:px-10">
        <a
          href="/"
          aria-label={`${branding.site.name} home`}
          className={`flex shrink-0 items-center gap-3 ${focus}`}
        >
          <span className="text-2xl font-bold tracking-[-0.06em]">
            {branding.site.wordmark}
            <span className="text-primary">.</span>
          </span>
          <span className="text-muted-foreground border-border hidden border-l pl-3 font-mono text-[11px] leading-tight tracking-[0.12em] sm:block">
            {branding.site.owner.toUpperCase()}
            <br />
            {branding.site.label.toUpperCase()}
          </span>
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {NAV.map(({ title, url }) => (
              <li key={url}>
                <a
                  href={url}
                  aria-current={active(url) ? "page" : undefined}
                  className={`hover:text-primary font-mono text-xs transition-colors ${active(url) ? "text-foreground" : "text-muted-foreground"} ${focus}`}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CtaLinks className="hidden min-h-11 items-center gap-5 px-4 lg:inline-flex" />
          <button
            ref={trigger}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
            className={`border-border flex size-11 items-center justify-center border lg:hidden ${focus}`}
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile primary"
        hidden={!open}
        className="border-border border-t px-5 py-4 lg:hidden"
      >
        <ul className="divide-border divide-y">
          {NAV.map(({ title, url }) => (
            <li key={url}>
              <a
                href={url}
                aria-current={active(url) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`hover:text-primary flex min-h-12 items-center justify-between font-mono text-sm ${focus}`}
              >
                {title}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-3">
          <CtaLinks
            className="flex min-h-12 items-center justify-between px-4"
            onNavigate={() => setOpen(false)}
          />
        </div>
      </nav>
    </header>
  );
}
