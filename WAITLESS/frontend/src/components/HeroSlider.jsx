import { useState, useEffect } from "react";

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "Digital Queue Management",
      subtitle: "Transforming healthcare access in Zimbabwe",
      description: "From paper queues to triage-aware digital flow",
      cta: "Get Started",
    },
    {
      title: "Real-time Patient Tracking",
      subtitle: "Know exactly where you stand in the queue",
      description: "WhatsApp notifications keep you informed every step of the way",
      cta: "Learn More",
    },
    {
      title: "Triage-Aware System",
      subtitle: "Prioritizing patients based on medical urgency",
      description: "Red, Yellow, Green priority routing for efficient care delivery",
      cta: "See How It Works",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)'
    }} className="hero-slider">
      {slides.map((slide, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className={`hero-slide ${index === currentSlide ? "active" : ""}`}
        >
          <div style={{
            textAlign: 'center',
            color: 'white',
            maxWidth: '56rem',
            padding: '2rem'
          }} className="hero-slide-content">
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '1rem',
              animationDelay: '0s'
            }} className="slide-in-left">
              {slide.title}
            </h1>
            <p style={{
              fontSize: '1.5rem',
              marginBottom: '1.5rem',
              animationDelay: '0.2s'
            }} className="slide-in-right">
              {slide.subtitle}
            </p>
            <p style={{
              fontSize: '1.125rem',
              marginBottom: '2rem',
              animationDelay: '0.4s'
            }} className="slide-in-up">
              {slide.description}
            </p>
            <button style={{
              backgroundColor: 'white',
              color: '#4f46e5',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '1.125rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              animationDelay: '0.6s'
            }} className="slide-in-up">
              {slide.cta}
            </button>
          </div>
        </div>
      ))}

      {/* Navigation dots */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.75rem',
        zIndex: 10
      }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '50%',
              transition: 'all 0.3s',
              backgroundColor: index === currentSlide ? 'white' : 'rgba(255, 255, 255, 0.5)',
              transform: index === currentSlide ? 'scale(1.25)' : 'scale(1)'
            }}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          zIndex: 10
        }}
      >
        <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          zIndex: 10
        }}
      >
        <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}