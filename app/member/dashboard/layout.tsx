"use client";

import { useLayoutEffect, type ReactNode } from "react";

const TOKEN_KEY = "ctms_store_token";

export default function MemberDashboardLayout({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const originalGetItem = Storage.prototype.getItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.getItem = function (key: string) {
      if (this === window.localStorage && key === TOKEN_KEY) {
        return window.sessionStorage.getItem(TOKEN_KEY);
      }
      return originalGetItem.call(this, key);
    };

    Storage.prototype.removeItem = function (key: string) {
      if (this === window.localStorage && key === TOKEN_KEY) {
        window.sessionStorage.removeItem(TOKEN_KEY);
        return;
      }
      return originalRemoveItem.call(this, key);
    };

    return () => {
      Storage.prototype.getItem = originalGetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, []);

  return children;
}
