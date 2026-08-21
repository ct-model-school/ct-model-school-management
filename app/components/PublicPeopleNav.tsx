"use client";

import { useEffect } from "react";

const PEOPLE_LINK = "public-people-nav-link";

function addPeopleLink(nav: Element, mobile = false) {
  if (nav.querySelector(`[data-${PEOPLE_LINK}]`)) return;

  const link = document.createElement("a");
  link.href = "/people";
  link.textContent = "People";
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

export default function PublicPeopleNav() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

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

  return (
    <style>{`
      @media (max-width: 767px) {
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
  );
}
