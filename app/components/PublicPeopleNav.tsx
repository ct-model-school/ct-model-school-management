"use client";

import { useEffect, useState } from "react";

const PEOPLE_LINK = "public-people-nav-link";

function addPeopleLink(nav: Element, mobile = false) {
  if (nav.querySelector(`[data-${PEOPLE_LINK}]`)) return;

  const link = document.createElement("a");
  link.href = "/people";
  link.textContent = "Community";
  link.setAttribute(`data-${PEOPLE_LINK}`, "true");
  link.className = mobile
    ? "rounded-lg px-3 py-2 text-sm font-semibold"
    : "text-sm font-semibold";

  if (mobile) {
    nav.querySelector("div")?.appendChild(link);
  } else {
    nav.appendChild(link);
  }
}

function NavIcon({ type }: { type: "home" | "about" | "Community" | "principal" | "contact" }) {
  const common = "h-6 w-6";

  if (type === "home") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8" /><path d="M5.5 9.8V21h13V9.8" /><path d="M9 21v-6h6v6" /></svg>;
  if (type === "about") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h16" /><path d="M6 18V9h4v9" /><path d="M14 18V4h4v14" /><path d="M7.5 12h1M15.5 7h1M15.5 10h1M15.5 13h1" /></svg>;
  if (type === "Community") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.5-3.3 2.4-5 5.5-5s5 1.7 5.5 5" /><circle cx="17" cy="9" r="2.2" /><path d="M15.2 15.5c2.5.2 4.2 1.7 4.8 4.5" /></svg>;
  if (type === "principal") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.2" /><path d="M5 21c.7-4.1 3-6.2 7-6.2s6.3 2.1 7 6.2" /><path d="M18.5 4.5v4M16.5 6.5h4" /></svg>;
  return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z" /><path d="m4 6 8 6 8-6" /></svg>;
}

export default function PublicPeopleNav() {
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    const currentPath = window.location.pathname;
    setPathname(currentPath);

    if (currentPath !== "/") return;

    const ensureMenu = () => {
      const header = document.querySelector("main > header");
      if (!header) return;

      const desktopNav = header.querySelector("nav.hidden");
      if (desktopNav) addPeopleLink(desktopNav, false);

      const mobileNav = Array.from(header.querySelectorAll("nav")).find((nav) => !nav.classList.contains("hidden"));
      if (mobileNav && mobileNav.querySelector("div")) addPeopleLink(mobileNav, true);
    };

    ensureMenu();
    const observer = new MutationObserver(ensureMenu);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const isPrivateRoute = pathname.startsWith("/admin") || pathname.startsWith("/management") || pathname.startsWith("/register");
  if (!pathname || isPrivateRoute) return null;

  const items = [
    { label: "Home", href: "/", type: "home" as const, active: pathname === "/" },
    { label: "About", href: "/#about", type: "about" as const, active: false },
    { label: "Community", href: "/people", type: "Community" as const, active: pathname === "/people" },
    { label: "Principal", href: "/#principal", type: "principal" as const, active: false },
    { label: "Contact", href: "/#contact", type: "contact" as const, active: false },
  ];

  return (
    <>
      <nav className="ctms-mobile-bottom-nav" aria-label="Mobile navigation">
        {items.map((item) => (
          <a key={item.label} href={item.href} className={item.active ? "ctms-mobile-bottom-nav-item active" : "ctms-mobile-bottom-nav-item"} aria-current={item.active ? "page" : undefined}>
            <NavIcon type={item.type} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <style>{`
        .ctms-mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 767px) {
          .ctms-mobile-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            min-height: 70px;
            padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
            border-top: 1px solid var(--school-border);
            background: var(--school-surface);
            box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.10);
          }

          .ctms-mobile-bottom-nav-item {
            position: relative;
            display: flex;
            min-width: 0;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 5px 2px 4px;
            color: var(--school-muted);
            text-decoration: none;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.1;
            transition: color 160ms ease, transform 160ms ease;
          }

          .ctms-mobile-bottom-nav-item svg {
            flex: 0 0 auto;
          }

          .ctms-mobile-bottom-nav-item.active {
            color: var(--school-primary);
          }

          .ctms-mobile-bottom-nav-item.active::before {
            content: "";
            position: absolute;
            top: -6px;
            left: 50%;
            width: 32px;
            height: 3px;
            border-radius: 999px;
            transform: translateX(-50%);
            background: var(--school-primary);
          }

          body:has(.ctms-mobile-bottom-nav) main {
            padding-bottom: 78px;
          }

          main:has(> header + #top) > #top + section:first-of-type > div {
            aspect-ratio: 1600 / 400 !important;
            min-height: 0 !important;
          }

          main:has(> header + #top) > #top + section:first-of-type > div > div img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            object-position: center !important;
          }
        }
      `}</style>
    </>
  );
}
