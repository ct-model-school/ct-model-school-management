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

export default function LoginPortalNav() {
  useEffect(() => {
    let frame = 0;
    let observer: MutationObserver | null = null;

    const run = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncLoginLink);
    };

    run();
    observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return (
    <style>{`
      .ctms-public-nav-button,
      .ctms-login-desktop-link {
        position:relative;
        isolation:isolate;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        min-height:30px;
        min-width:52px;
        padding:.4rem .68rem;
        border:1px solid var(--school-primary-border);
        border-radius:.55rem;
        background:linear-gradient(180deg,var(--school-primary),var(--school-primary-hover,var(--school-primary)));
        color:var(--school-on-primary,#fff) !important;
        text-decoration:none !important;
        font-size:.68rem;
        font-weight:800;
        line-height:1;
        overflow:hidden;
        box-shadow:0 4px 10px var(--school-primary-border);
        transition:transform 180ms ease,box-shadow 180ms ease,filter 180ms ease;
      }
      .ctms-public-nav-button::before,
      .ctms-login-desktop-link::before {
        content:"";
        position:absolute;
        inset:0;
        z-index:-1;
        background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.18) 48%,transparent 76%);
        transform:translateX(-120%);
        transition:transform 420ms ease;
      }
      .ctms-public-nav-button:hover,
      .ctms-login-desktop-link:hover {
        transform:translateY(-2px);
        filter:brightness(1.04);
        box-shadow:0 7px 16px var(--school-primary-border);
      }
      .ctms-public-nav-button:hover::before,
      .ctms-login-desktop-link:hover::before {
        transform:translateX(120%);
      }
      .ctms-public-nav-button:active,
      .ctms-login-desktop-link:active {
        transform:translateY(0) scale(.98);
        box-shadow:0 3px 8px var(--school-primary-border);
      }
      .ctms-public-nav-button:focus-visible,
      .ctms-login-desktop-link:focus-visible,
      .ctms-public-nav-button-mobile:focus-visible,
      .ctms-login-mobile-link:focus-visible {
        outline:3px solid var(--school-primary-soft);
        outline-offset:2px;
      }
      .ctms-public-nav-button-mobile,
      .ctms-login-mobile-link {
        position:relative;
        isolation:isolate;
        display:flex !important;
        align-items:center;
        justify-content:center;
        width:100%;
        margin-top:.35rem;
        padding:.62rem .7rem;
        border:1px solid var(--school-primary-border);
        border-radius:.6rem;
        background:linear-gradient(180deg,var(--school-primary),var(--school-primary-hover,var(--school-primary)));
        color:var(--school-on-primary,#fff) !important;
        text-decoration:none !important;
        font-size:.8rem;
        font-weight:800;
        line-height:1;
        overflow:hidden;
        box-shadow:0 4px 10px var(--school-primary-border);
        transition:transform 180ms ease,box-shadow 180ms ease,filter 180ms ease;
      }
      .ctms-public-nav-button-mobile::before,
      .ctms-login-mobile-link::before {
        content:"";
        position:absolute;
        inset:0;
        z-index:-1;
        background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.18) 48%,transparent 76%);
        transform:translateX(-120%);
        transition:transform 420ms ease;
      }
      .ctms-public-nav-button-mobile:hover,
      .ctms-login-mobile-link:hover {
        transform:translateY(-1px);
        filter:brightness(1.04);
        box-shadow:0 7px 16px var(--school-primary-border);
      }
      .ctms-public-nav-button-mobile:hover::before,
      .ctms-login-mobile-link:hover::before {
        transform:translateX(120%);
      }
      .ctms-public-nav-button-mobile:active,
      .ctms-login-mobile-link:active {
        transform:scale(.98);
        box-shadow:0 3px 8px var(--school-primary-border);
      }
    `}</style>
  );
}
