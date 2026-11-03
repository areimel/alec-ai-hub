import { ArrowUpRight } from "lucide-react";

import branding from "@/data/branding.json";

const link =
  "hover:text-primary focus-visible:outline-ring flex h-fit min-h-6 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4";

export function Footer() {
  return (
    <footer className="bg-background text-foreground border-border mt-20 border-t">
      <div className="mx-auto max-w-[1600px] px-5 pt-10 md:px-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="kicker">Alec Reimel / Working files</p>
            <p className="mt-4 max-w-sm text-lg">
              A personal collection of AI prompts and personas. Copy what is
              useful.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-8 gap-y-4 font-mono text-xs"
          >
            {branding.navigation.main.map(({ title, url }) => (
              <a key={url} href={url} className={link}>
                {title}
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
            ))}
          </nav>
        </div>
        <nav
          aria-label="More"
          className="border-border mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t pt-6 font-mono text-xs"
        >
          {branding.navigation.footer.map((item) => (
            <a
              key={item.url}
              href={item.url}
              className={link}
              {...("isExternal" in item && item.isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.title}
            </a>
          ))}
        </nav>
        <a
          href="/"
          aria-label="AI Hub home"
          className="focus-visible:outline-ring mt-10 block w-fit text-[clamp(4rem,18.5vw,19rem)] leading-[1.05] font-bold tracking-[-0.075em] focus-visible:outline-2"
        >
          AI HUB<span className="text-primary">.</span>
        </a>
        <div className="text-muted-foreground border-border mt-6 flex flex-wrap justify-between gap-4 border-t py-6 font-mono text-[11px] tracking-wider uppercase">
          <span>
            &copy; {new Date().getFullYear()} {branding.company.legalName}
          </span>
          <span>Prompts and personas, free to copy</span>
        </div>
      </div>
    </footer>
  );
}
