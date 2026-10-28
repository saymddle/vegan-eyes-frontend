import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { isAuthError } from "./data";
import { useSession } from "./useSession";

// Loads signed-in data each time the screen comes into view. Without a
// sign-in it opens the sign-in screen once, like the website sent you to
// /auth, and reports `signedOut` so the screen can offer a Sign In button.
export function useAccountData<T>(load: () => Promise<T>, initial: T) {
  const router = useRouter();
  const session = useSession();
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const asked = useRef(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const userId = session?.user.id;
  useFocusEffect(
    useCallback(() => {
      if (session === undefined) return;
      if (!userId) {
        setIsLoading(false);
        if (!asked.current) {
          asked.current = true;
          router.push("/auth");
        }
        return;
      }
      let active = true;
      setError("");
      loadRef
        .current()
        .then((next) => active && setData(next))
        .catch((loadError: unknown) => {
          if (!active) return;
          if (isAuthError(loadError)) router.push("/auth");
          else setError(loadError instanceof Error ? loadError.message : "Something went wrong.");
        })
        .finally(() => active && setIsLoading(false));
      return () => {
        active = false;
      };
    }, [session, userId, router])
  );

  return { data, setData, isLoading, error, signedOut: session === null };
}
