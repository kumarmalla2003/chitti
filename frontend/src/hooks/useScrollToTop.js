import { useEffect } from "react";

const useScrollToTop = (trigger) => {
  useEffect(() => {
    if (trigger) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [trigger]);
};

export default useScrollToTop;
