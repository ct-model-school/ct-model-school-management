"use client";

import { useEffect } from "react";

const LOGIN_LINK = "ctms-login-portal-link";
const NAV_BUTTON_CLASS = "ctms-public-nav-button";
const NAV_BUTTON_MOBILE_CLASS = "ctms-public-nav-button-mobile";

function addLoginLink(nav: Element, mobile = false) {
  if (nav.querySelector(`[data-${LOGIN_LINK}]`)) return;

  const link = document.createElement("a");
  link.href = "/loginportal";
  link.textContent = "Login";
  link.setAttribute(`data-${LOGIN_LINK}`, "true");
  link.setAttribute("aria-label", "Open Login Portal");
  link.className = mobile ? "ctms-login-mobile-link" : "ctms-login-desktop-link";

  if (mobile) nav.querySelector("div")?.appendChild(link);
  else nav.appendChild(link);
}

function styleExistingNavLinks(nav: Element, mobile = false) {
  const className = mobile ? NAV_BUTTON_MOBILE_CLASS : NAV_BUTTON_CLASS;
  nav.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href === "/loginportal") return;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http")) return;
    link.classList.add(className);
  });
}

function syncLoginLink() {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/management") || pathname.startsWith("/register")) return;

  const headers = document.querySelectorAll("main > header");
  headers.forEach((header) => {
    const desktopNav = header.querySelector("nav.hidden");
    if (desktopNav) {
      styleExistingNavLinks(desktopNav, false);
      addLoginLink(desktopNav, false);
    }

    const mobileNav = Array.from(header.querySelectorAll("nav")).find((nav) => !nav.classList.contains("hidden"));
    if (mobileNav?.querySelector("div")) {
      styleExistingNavLinks(mobileNav, true);
      addLoginLink(mobileNav, true);
    }
  });
}

function enhanceHomepageHero() {
  if (window.location.pathname !== "/") return () => {};

  const header = document.querySelector("main > header");
  const hero = header?.nextElementSibling as HTMLElement | null;
  if (!hero || hero.dataset.ctmsHeroEnhanced === "true") return () => {};

  const heroImages = Array.from(hero.querySelectorAll<HTMLImageElement>("img"));
  if (!heroImages.length) return () => {};

  hero.dataset.ctmsHeroEnhanced = "true";
  hero.classList.add("ctms-home-hero-dynamic");
  heroImages.forEach((image) => image.classList.add("ctms-home-hero-image"));

  const progress = document.createElement("span");
  progress.className = "ctms-home-hero-progress";
  progress.setAttribute("aria-hidden", "true");
  hero.appendChild(progress);

  const restartMotion = () => {
    hero.classList.remove("ctms-home-hero-refresh");
    void hero.offsetWidth;
    hero.classList.add("ctms-home-hero-refresh");
  };

  restartMotion();

  const imageObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === "attributes" && mutation.attributeName === "src")) restartMotion();
  });
  imageObserver.observe(hero, { subtree: true, attributes: true, attributeFilter: ["src"] });

  const onMove = (event: PointerEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    hero.style.setProperty("--ctms-hero-x", `${x * 4}px`);
    hero.style.setProperty("--ctms-hero-y", `${y * 3}px`);
  };
  const resetMove = () => {
    hero.style.setProperty("--ctms-hero-x", "0px");
    hero.style.setProperty("--ctms-hero-y", "0px");
  };

  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", resetMove);

  return () => {
    imageObserver.disconnect();
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", resetMove);
    progress.remove();
  };
}

export default function LoginPortalNav() {
  useEffect(() => {
    let frame = 0;
    let observer: MutationObserver | null = null;
    let heroCleanup: (() => void) | null = null;

    const run = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        syncLoginLink();
        if (!heroCleanup) heroCleanup = enhanceHomepageHero();
      });
    };

    run();
    observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      heroCleanup?.();
    };
  }, []);

  return (
    <style>{`
      .ctms-public-nav-button,
      .ctms-login-desktop-link {
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        min-height:36px;
        padding:.5rem .9rem;
        border:1px solid var(--school-primary-border);
        border-radius:.7rem;
        background:var(--school-primary);
        color:var(--school-on-primary,#fff) !important;
        text-decoration:none !important;
        font-size:.8rem;
        font-weight:800;
        line-height:1;
        transition:transform 160ms ease,opacity 160ms ease,box-shadow 160ms ease;
        box-shadow:0 5px 14px var(--school-primary-border);
      }
      .ctms-public-nav-button:hover,
      .ctms-login-desktop-link:hover {
        transform:translateY(-1px) scale(1.02);
        opacity:.95;
        box-shadow:0 8px 20px var(--school-primary-border);
      }
      .ctms-public-nav-button-mobile,
      .ctms-login-mobile-link {
        display:flex !important;
        align-items:center;
        justify-content:center;
        width:100%;
        margin-top:.35rem;
        padding:.7rem .75rem;
        border:1px solid var(--school-primary-border);
        border-radius:.65rem;
        background:var(--school-primary);
        color:var(--school-on-primary,#fff) !important;
        text-decoration:none !important;
        font-size:.875rem;
        font-weight:800;
        line-height:1;
      }

      .ctms-home-hero-dynamic {
        position:relative !important;
        isolation:isolate;
        overflow:hidden !important;
        --ctms-hero-x:0px;
        --ctms-hero-y:0px;
        transform:translateZ(0);
      }
      .ctms-home-hero-dynamic::before {
        content:"";
        position:absolute;
        inset:0;
        z-index:2;
        pointer-events:none;
        background:
          linear-gradient(180deg,rgba(7,31,57,.05) 0%,transparent 28%,transparent 72%,rgba(7,31,57,.12) 100%),
          radial-gradient(circle at 12% 22%,rgba(255,255,255,.18),transparent 28%),
          radial-gradient(circle at 88% 78%,rgba(255,255,255,.12),transparent 25%);
        animation:ctmsHeroGlow 7s ease-in-out infinite alternate;
      }
      .ctms-home-hero-dynamic::after {
        content:"";
        position:absolute;
        left:0;
        right:0;
        bottom:0;
        height:4px;
        z-index:5;
        background:linear-gradient(90deg,var(--school-primary),var(--school-primary-soft),var(--school-primary));
        transform-origin:left center;
        animation:ctmsHeroProgress 5s linear infinite;
        box-shadow:0 -1px 8px var(--school-primary-border);
        pointer-events:none;
      }
      .ctms-home-hero-image {
        position:relative;
        z-index:1;
        transform:translate3d(var(--ctms-hero-x),var(--ctms-hero-y),0) scale(1.015);
        transform-origin:center center;
        animation:ctmsHeroKenBurns 9s ease-in-out infinite alternate;
        will-change:transform;
      }
      .ctms-home-hero-refresh .ctms-home-hero-image {
        animation:ctmsHeroEnter 900ms cubic-bezier(.22,.8,.24,1),ctmsHeroKenBurns 9s 900ms ease-in-out infinite alternate;
      }
      .ctms-home-hero-progress {
        position:absolute;
        left:50%;
        bottom:12px;
        z-index:6;
        width:34px;
        height:4px;
        transform:translateX(-50%);
        border-radius:999px;
        background:rgba(255,255,255,.85);
        box-shadow:0 1px 7px rgba(0,0,0,.25);
        pointer-events:none;
      }
      @keyframes ctmsHeroKenBurns {
        0% { transform:translate3d(calc(var(--ctms-hero-x) - 1px),calc(var(--ctms-hero-y) - 1px),0) scale(1.015); }
        100% { transform:translate3d(calc(var(--ctms-hero-x) + 1px),calc(var(--ctms-hero-y) + 1px),0) scale(1.045); }
      }
      @keyframes ctmsHeroEnter {
        0% { opacity:.45; filter:saturate(.82) brightness(.98); transform:translate3d(var(--ctms-hero-x),var(--ctms-hero-y),0) scale(1.07); }
        100% { opacity:1; filter:none; transform:translate3d(var(--ctms-hero-x),var(--ctms-hero-y),0) scale(1.015); }
      }
      @keyframes ctmsHeroGlow {
        0% { opacity:.45; }
        100% { opacity:.9; }
      }
      @keyframes ctmsHeroProgress {
        0% { transform:scaleX(0); }
        100% { transform:scaleX(1); }
      }
      @media (max-width:640px) {
        .ctms-home-hero-image { transform:scale(1.01); animation-duration:10s; }
        .ctms-home-hero-progress { bottom:8px; }
      }
      @media (prefers-reduced-motion:reduce) {
        .ctms-home-hero-dynamic::before,
        .ctms-home-hero-dynamic::after,
        .ctms-home-hero-image,
        .ctms-home-hero-refresh .ctms-home-hero-image { animation:none !important; }
      }
    `}</style>
  );
}
