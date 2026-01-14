// Scroll progress bar with RAF throttling for performance
export function initScrollProgress(): void {
  let ticking = false;
  
  const updateProgress = () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById("scroll-progress");
    if (progressBar) {
      progressBar.style.width = scrolled + "%";
    }
    
    // Parallax effect
    const parallaxSpeed = 0.3;
    document.body.style.setProperty('--parallax-y', `${winScroll * parallaxSpeed}px`);
    ticking = false;
  };
  
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  });
}

// Scroll reveal animations using IntersectionObserver
export function initScrollAnimations(): void {
  const observerOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        
        const staggerItems = entry.target.querySelectorAll(".stagger-item");
        staggerItems.forEach((item, index) => {
          (item as HTMLElement).style.transitionDelay = `${index * 100}ms`;
          item.classList.add("visible");
        });
      }
    });
  }, observerOptions);
  
  document.querySelectorAll(".collapse").forEach(section => {
    section.classList.add("animate-on-scroll");
    observer.observe(section);
  });
}

// Smooth scroll for anchor links
export function initSmoothScroll(): void {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = (anchor as HTMLAnchorElement).getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          history.pushState(null, '', href);
        }
      }
    });
  });
}
