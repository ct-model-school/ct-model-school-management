"use client";

import { useEffect } from "react";

const SCHOOL_LOGO_URL = "https://lvwhlyrzsgfzcglflcrd.supabase.co/storage/v1/object/public/school-assets/branding/logo_url-b086d7e5-a74f-498b-98e7-5dfa1a3f9c9e.png";

export default function PrintPatch() {
  useEffect(() => {
    const originalOpen = window.open;
    if (!originalOpen) return;

    window.open = function (...args: Parameters<typeof window.open>) {
      const child = originalOpen.apply(window, args as any);
      if (!child) return child;

      const originalWrite = child.document.write.bind(child.document);
      child.document.write = ((html: string) => {
        if (typeof html !== "string" || !html.includes("Service Request")) {
          originalWrite(html);
          return;
        }

        let patched = html.replace(
          /<img\s+class=\"logo\"\s+src=\"\/logo\.png\"/i,
          `<img class="logo" src="${SCHOOL_LOGO_URL}"`
        );

        const printCss = `
<style id="ctms-sr-print-fix">
@page { size: A4 portrait !important; margin: 0 !important; }
html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
.sheet { width: 210mm !important; height: 297mm !important; min-height: 0 !important; max-height: 297mm !important; overflow: hidden !important; page-break-after: avoid !important; break-inside: avoid !important; }
.logo { display: block !important; visibility: visible !important; }
</style>`;

        patched = patched.replace("</head>", `${printCss}</head>`);
        originalWrite(patched);
      }) as typeof child.document.write;

      return child;
    } as typeof window.open;

    return () => {
      window.open = originalOpen;
    };
  }, []);

  return null;
}
