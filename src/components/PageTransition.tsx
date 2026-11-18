"use client";
import { ViewTransition, type ReactNode } from "react";

/** Wrap each page: slides left/right when switching tabs (types set by Nav links). */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "tab-forward": "tab-forward", "tab-back": "tab-back", default: "none" }}
      exit={{ "tab-forward": "tab-forward", "tab-back": "tab-back", default: "none" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
