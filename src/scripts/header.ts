/**
 * Header component scripts
 * - Typewriter effect
 * - Portfolio visit counter
 * - Profile tilt interaction
 */

export function initTypewriter(): void {
  const typewriter = document.getElementById('typewriter-text');
  if (!typewriter) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typewriter.style.width = 'auto';
    typewriter.style.animation = 'none';
    return;
  }
  
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

const COUNTER_SESSION_KEY = 'portfolio_visit_tracked';
const COUNTER_ENDPOINT = '/api/visitors';

function buildCounterUrl(action: 'get' | 'hit'): string {
  const mode = action === 'hit' ? 'hit' : 'get';
  return `${COUNTER_ENDPOINT}?mode=${mode}`;
}

async function requestCounter(action: 'get' | 'hit'): Promise<number | null> {
  const method = action === 'hit' ? 'POST' : 'GET';
  const response = await fetch(buildCounterUrl(action), {
    method,
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) return null;
  const data = await response.json();
  const value = Number(data?.value);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function initPortfolioCounter(): void {
  const projectsSection = document.getElementById('projects');
  const counterEl = document.getElementById('portfolio-counter');
  
  if (!projectsSection || !counterEl) return;
  
  const updateDisplay = (count: number): void => {
    counterEl.textContent = count > 999 ? '999+' : count.toString();
  };

  const fetchCurrentCount = async (): Promise<void> => {
    try {
      const value = await requestCounter('get');
      if (value !== null) {
        updateDisplay(value);
      }
    } catch {
      // Keep default value on transient network failure
    }
  };

  const incrementCount = async (): Promise<void> => {
    try {
      const value = await requestCounter('hit');
      if (value !== null) {
        updateDisplay(value);
      }
    } catch {
      // Ignore increment failures for UX continuity
    }
  };

  void fetchCurrentCount();
  
  // Track when user scrolls to portfolio section (only once per session)
  let hasTracked = sessionStorage.getItem(COUNTER_SESSION_KEY) === 'true';
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTracked) {
          hasTracked = true;
          sessionStorage.setItem(COUNTER_SESSION_KEY, 'true');
          void incrementCount();
          counterEl.classList.add('animate-ping');
          setTimeout(() => counterEl.classList.remove('animate-ping'), 300);
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

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  
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
