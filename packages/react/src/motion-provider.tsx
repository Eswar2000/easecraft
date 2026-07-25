import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  defaultMotionTokens,
  resolveMotionTokens,
  type MotionTokenOverrides,
  type MotionTokens,
} from "easecraft-tokens";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type ReducedMotionMode = "system" | "always" | "never";

export interface MotionProviderProps {
  readonly children: ReactNode;
  readonly reducedMotion?: ReducedMotionMode;
  readonly tokens?: MotionTokenOverrides;
}

export interface MotionConfig {
  readonly reducedMotion: boolean;
  readonly reducedMotionMode: ReducedMotionMode;
  readonly tokens: MotionTokens;
}

interface MotionContextValue {
  readonly reducedMotionMode: ReducedMotionMode;
  readonly tokens: MotionTokens;
}

const MotionContext = createContext<MotionContextValue | null>(null);

function getMediaQueryList(): MediaQueryList | undefined {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return undefined;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function getSystemReducedMotion(): boolean {
  return getMediaQueryList()?.matches ?? false;
}

function getNonReducedMotion(): false {
  return false;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function subscribeToSystemReducedMotion(onStoreChange: () => void): () => void {
  const mediaQueryList = getMediaQueryList();

  if (!mediaQueryList) {
    return () => undefined;
  }

  mediaQueryList.addEventListener("change", onStoreChange);

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function useSystemReducedMotion(enabled: boolean): boolean {
  return useSyncExternalStore(
    enabled ? subscribeToSystemReducedMotion : subscribeToNothing,
    enabled ? getSystemReducedMotion : getNonReducedMotion,
    getNonReducedMotion,
  );
}

export function MotionProvider({
  children,
  reducedMotion = "system",
  tokens,
}: MotionProviderProps) {
  const resolvedTokens = useMemo(() => resolveMotionTokens(tokens), [tokens]);
  const contextValue = useMemo<MotionContextValue>(
    () => ({ reducedMotionMode: reducedMotion, tokens: resolvedTokens }),
    [reducedMotion, resolvedTokens],
  );

  return <MotionContext.Provider value={contextValue}>{children}</MotionContext.Provider>;
}

export function useMotionConfig(): MotionConfig {
  const contextValue = useContext(MotionContext);
  const reducedMotionMode = contextValue?.reducedMotionMode ?? "system";
  const systemReducedMotion = useSystemReducedMotion(reducedMotionMode === "system");

  return useMemo(
    () => ({
      reducedMotion:
        reducedMotionMode === "always" || (reducedMotionMode === "system" && systemReducedMotion),
      reducedMotionMode,
      tokens: contextValue?.tokens ?? defaultMotionTokens,
    }),
    [contextValue?.tokens, reducedMotionMode, systemReducedMotion],
  );
}

export function useReducedMotion(): boolean {
  return useMotionConfig().reducedMotion;
}
