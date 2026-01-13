// Theme initialization (runs synchronously before page render)
export function initTheme(): void {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "black" : "lofi");
  document.documentElement.setAttribute("data-theme", theme);
  
  const isDark = theme === "black";
  const checkbox = document.getElementById("theme-toggle") as HTMLInputElement | null;
  if (checkbox) {
    checkbox.checked = isDark;
    checkbox.setAttribute("aria-checked", isDark.toString());
  }
}

// Theme toggle with View Transitions API support
export function initThemeToggle(): void {
  const themeToggle = document.querySelector('[data-toggle-theme]') as HTMLInputElement | null;
  if (!themeToggle) return;
  
  const currentTheme = document.documentElement.getAttribute("data-theme");
  themeToggle.checked = currentTheme === "black";
  themeToggle.setAttribute("aria-checked", (currentTheme === "black").toString());
  
  const applyTheme = (isDark: boolean): void => {
    const newTheme = isDark ? "black" : "lofi";
    
    if (document.startViewTransition) {
      const toggle = document.getElementById('theme-toggle');
      let x = window.innerWidth / 2;
      let y = 0;
      
      if (toggle) {
        const rect = toggle.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
      
      document.documentElement.style.setProperty('--theme-x', `${x}px`);
      document.documentElement.style.setProperty('--theme-y', `${y}px`);
      
      document.startViewTransition(() => {
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      });
    } else {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };
  
  themeToggle.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const isDark = target.checked;
    applyTheme(isDark);
    target.setAttribute("aria-checked", isDark.toString());
  });
}
