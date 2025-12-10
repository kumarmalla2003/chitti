import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query matches the current viewport.
 * @param {string} query - The media query to match (e.g., "(min-width: 768px)")
 * @returns {boolean} - True if the query matches, false otherwise.
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  return matches;
};

export default useMediaQuery;
