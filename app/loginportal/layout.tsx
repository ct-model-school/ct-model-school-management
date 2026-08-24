"use client";

import { useLayoutEffect, type ReactNode } from "react";

const TOKEN_KEY = "ctms_store_token";

export default function LoginPortalLayout({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.localStorage && key === TOKEN_KEY) {
        window.sessionStorage.setItem(TOKEN_KEY, value);
        return;
      }
      return originalSetItem.call(this, key, value);
    };

    Storage.prototype.removeItem = function (key: string) {
      if (this === window.localStorage && key === TOKEN_KEY) {
        window.sessionStorage.removeItem(TOKEN_KEY);
        return;
      }
      return originalRemoveItem.call(this, key);
    };

    return () => {
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, []);

  return children;
}
