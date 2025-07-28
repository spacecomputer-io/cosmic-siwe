"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  style: {
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  };
}

export const Starfield = ({
  starCount = 50,
  className,
}: {
  starCount?: number;
  className?: string;
}) => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = Array.from({ length: starCount }).map(
        (_, i) => ({
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          },
        })
      );
      setStars(newStars);
    };
    generateStars();
  }, [starCount]);

  return (
    <div className={className}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={star.style}
        />
      ))}
    </div>
  );
};
