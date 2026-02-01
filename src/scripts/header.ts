/**
 * Header component scripts
 * - Typewriter effect
 * - Portfolio visit counter
 * - Profile tilt interaction
 */

export function initTypewriter(): void {
  const typewriter = document.getElementById('typewriter-text');
  if (!typewriter) return;
  
  const text = typewriter.textContent || '';
  const length = text.length;
  
  typewriter.style.width = 'auto';
  typewriter.style.animation = 'none';
  const width = typewriter.offsetWidth;
  
  typewriter.style.setProperty('--typewriter-width', `${width}px`);
  typewriter.style.setProperty('--typewriter-steps', length.toString());
  
  void typewriter.offsetWidth; // Force reflow
  typewriter.style.width = '0';
  typewriter.style.animation = `typing 3.5s steps(${length}, end) forwards`;
}

export function initPortfolioCounter(): void {
  const projectsSection = document.getElementById('projects');
  const counterEl = document.getElementById('portfolio-counter');
  
  if (!projectsSection || !counterEl) return;
  
  const updateDisplay = (count: number): void => {
    counterEl.textContent = count > 999 ? '999+' : count.toString();
  };
  
  // Fetch initial count from API
  fetch('/api/portfolio-counter')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updateDisplay(data.count);
      }
    })
    .catch(console.error);
  
  // Track when user scrolls to portfolio section (only once per session)
  let hasTracked = sessionStorage.getItem('portfolio_visit_tracked') === 'true';
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTracked) {
          hasTracked = true;
          sessionStorage.setItem('portfolio_visit_tracked', 'true');
          
          // Increment via API
          fetch('/api/portfolio-counter', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                updateDisplay(data.count);
                counterEl.classList.add('animate-ping');
                setTimeout(() => counterEl.classList.remove('animate-ping'), 300);
              }
            })
            .catch(console.error);
        }
      });
    },
    { threshold: 0.3 } // Trigger when 30% of the section is visible
  );
  
  observer.observe(projectsSection);
}

export function initProfileTilt(): void {
  const profileWrapper = document.querySelector('[data-tilt-profile]') as HTMLElement;
  if (!profileWrapper) return;
  
  const inner = profileWrapper.querySelector('.profile-inner') as HTMLElement;
  
  profileWrapper.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = profileWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 5;
    const rotateY = (centerX - x) / 5;
    
    profileWrapper.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
    
    if (inner) {
      inner.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`);
      inner.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`);
    }
  });
  
  profileWrapper.addEventListener('mouseleave', () => {
    profileWrapper.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
  });
}

export function initHeader(): void {
  initTypewriter();
  initPortfolioCounter();
  initProfileTilt();
}
