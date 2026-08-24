"use client";

import { useEffect } from "react";

const LOGIN_LINK = "ctms-login-portal-link";

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

function syncLoginLink() {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/management") || pathname.startsWith("/register")) return;

  const headers = document.querySelectorAll("main > header");
  headers.forEach((header) => {
    const desktopNav = header.querySelector("nav.hidden");
    if (desktopNav) addLoginLink(desktopNav, false);

    const mobileNav = Array.from(header.querySelectorAll("nav")).find((nav) => !nav.classList.contains("hidden"));
    if (mobileNav?.querySelector("div")) addLoginLink(mobileNav, true);
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
      .ctms-login-desktop-link {
        display:inline-flex;
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
      .ctms-login-desktop-link:hover {
        transform:translateY(-1px);
        opacity:.92;
      }
      .ctms-login-mobile-link {
        display:flex !important;
        align-items:center;
        justify-content:center;
        width:100%;
        margin-top:.35rem;
        padding:.7rem .75rem;
        border-radius:.65rem;
        background:var(--school-primary);
        color:var(--school-on-primary,#fff) !important;
        text-decoration:none !important;
        font-size:.875rem;
        font-weight:800;
      }
    `}</style>
  );
}
