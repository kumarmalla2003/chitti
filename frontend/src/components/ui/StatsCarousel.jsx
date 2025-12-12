// frontend/src/components/ui/StatsCarousel.jsx

import { useState, useRef, useEffect } from "react";
import StaggerContainer from "./StaggerContainer";
import StaggerItem from "./StaggerItem";
import Skeleton from "./Skeleton";

/**
 * StatsCarousel - A responsive carousel for stats cards
 * On mobile: Shows cards in a swipeable carousel with pagination dots
 * On desktop (md and above): Shows cards in a grid layout
 * Supports loading state with skeleton
 */
const StatsCarousel = ({ children, className = "", isLoading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  // Convert children to array to handle single or multiple children
  const items = Array.isArray(children) ? children : [children];
  const totalItems = items.length;

  // Handle scroll event to update pagination dots
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const itemWidth = carousel.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentIndex(newIndex);
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToIndex = (index) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const itemWidth = carousel.offsetWidth;
    carousel.scrollTo({
      left: itemWidth * index,
      behavior: "smooth",
    });
  };

  // Render skeleton state
  if (isLoading) {
    return (
      <div className={className}>
        {/* Mobile: Single skeleton card with pagination dots */}
        <div className="md:hidden">
          <Skeleton.StatsCard />
          {/* Pagination dots skeleton */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-8 h-2 rounded-full bg-background-tertiary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-background-tertiary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-background-tertiary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-background-tertiary animate-pulse" />
          </div>
        </div>

        {/* Desktop: Grid of 4 skeleton cards */}
        <div className="hidden md:flex flex-wrap -mx-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full md:w-1/2 xl:w-1/4 px-3 pb-6">
              <Skeleton.StatsCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile Carousel View (< md) */}
      <div className="md:hidden">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4"
        >
          {items.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full snap-center"
            >
              {child}
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {totalItems > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-2 bg-accent"
                    : "w-2 h-2 bg-border hover:bg-text-secondary"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Grid View (>= md) */}
      <StaggerContainer className="hidden md:flex flex-wrap -mx-3">
        {items.map((child, index) => (
          <StaggerItem
            key={index}
            className="w-full md:w-1/2 xl:w-1/4 px-3 pb-6"
          >
            {child}
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
};

export default StatsCarousel;
