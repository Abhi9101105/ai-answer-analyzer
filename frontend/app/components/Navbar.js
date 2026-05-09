"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/student", label: "Student", icon: "📝" },
    { href: "/teacher", label: "Teacher", icon: "📊" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-card-border/60">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <span className="text-accent text-xs font-bold">AI</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
            Grader
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150
                  ${active
                    ? "bg-accent text-white shadow-sm shadow-accent/25"
                    : "text-muted hover:text-foreground hover:bg-card-border/40"
                  }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
