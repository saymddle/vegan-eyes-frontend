import { createContext, useContext, useRef } from "react";
import type { HostInstance, ScrollViewInstance } from "react-native";

// Lets a tap on a highlighted word scroll the page to its card.
type Jump = {
  register: (key: string, view: HostInstance | null) => void;
  jumpTo: (key: string) => void;
};

const JumpContext = createContext<Jump>({ register: () => {}, jumpTo: () => {} });

export function useJump() {
  return useContext(JumpContext);
}

export function useJumpProvider(
  scrollRef: React.RefObject<ScrollViewInstance | null>,
  contentRef: React.RefObject<HostInstance | null>
): Jump {
  const views = useRef(new Map<string, HostInstance>());
  return {
    register: (key, view) => {
      if (view) views.current.set(key, view);
      else views.current.delete(key);
    },
    jumpTo: (key) => {
      const view = views.current.get(key);
      const content = contentRef.current;
      if (!view || !content) return;
      view.measureLayout(content, (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
      });
    }
  };
}

export const JumpProvider = JumpContext.Provider;
