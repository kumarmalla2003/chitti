import { useState, useEffect, useRef } from "react";

const useActiveSection = (sectionRefs) => {
  const [activeSection, setActiveSection] = useState("home");
  const observerRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    observerRef.current = observer;

    const currentRefs = sectionRefs.map((ref) => ref.current).filter(Boolean);
    currentRefs.forEach((ref) => {
      observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (observerRef.current) {
          observerRef.current.unobserve(ref);
        }
      });
    };
  }, [sectionRefs]);

  return activeSection;
};

export { useActiveSection };
