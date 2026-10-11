import { useCallback, useEffect, useState } from "react";
import { getJson, postJson, deleteJson } from "./api";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    getJson<{ icons: string[] }>("/api/favorites")
      .then((d) => setFavorites(d.icons ?? []))
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      const wasIn = favorites.includes(id);
      setFavorites((prev) => (wasIn ? prev.filter((x) => x !== id) : [id, ...prev]));
      try {
        if (wasIn) await deleteJson("/api/favorites", { iconId: id });
        else await postJson("/api/favorites", { iconId: id });
      } catch {
        setFavorites((prev) => (wasIn ? [id, ...prev] : prev.filter((x) => x !== id)));
      }
    },
    [favorites],
  );

  return { favorites, toggle };
}
