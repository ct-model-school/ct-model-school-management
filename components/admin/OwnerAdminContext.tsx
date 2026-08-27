"use client";

import { createContext, useContext } from "react";

const OwnerAdminContext = createContext(false);

export function OwnerAdminProvider({ children }: { children: React.ReactNode }) {
  return <OwnerAdminContext.Provider value={true}>{children}</OwnerAdminContext.Provider>;
}

export function useOwnerAdminContext() {
  return useContext(OwnerAdminContext);
}
