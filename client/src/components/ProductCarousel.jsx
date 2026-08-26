import { useEffect, useState } from "react";
import image1 from "../assets/image1.png";
import image2 from "../assets/image2.png";
import image3 from "../assets/image3.png";

const SLIDES = [
  {
    src: image1,
    alt: "Analytics dashboard preview",
    label: "Analytics",
  },
  {
    src: image2,
    alt: "Kanban board preview",
    label: "Kanban",
  },
  {
    src: image3,
    alt: "Workspace UI preview",
    label: "Workspace",
  },
];
const INTERVAL_MS = 4500;

function ProductCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="product-carousel" aria-live="polite">
      <div className="product-carousel__track">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`product-carousel__slide ${
              index === activeIndex ? "is-active" : ""
            }`}
            aria-hidden={index !== activeIndex}
          >
            <img src={slide.src} alt={slide.alt} loading="lazy" />
          </div>
        ))}
      </div>

      <div className="product-carousel__dots" role="tablist" aria-label="Product previews">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Show ${slide.label} preview`}
            className={`product-carousel__dot ${
              index === activeIndex ? "is-active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductCarousel;
