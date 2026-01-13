// Animated favicon on tab visibility change
export function initAnimatedFavicon(): void {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!favicon) return;
  
  const emojis = ['💻', '🚀', '⚡', '✨', '🎯'];
  let emojiIndex = 0;
  let isAnimating = false;
  
  const createFaviconFromEmoji = (emoji: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 16, 17);
    }
    return canvas.toDataURL('image/png');
  };
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isAnimating = true;
      const interval = setInterval(() => {
        if (!isAnimating || !document.hidden) {
          clearInterval(interval);
          favicon.href = '/favicon.webp';
          isAnimating = false;
          return;
        }
        favicon.href = createFaviconFromEmoji(emojis[emojiIndex]);
        emojiIndex = (emojiIndex + 1) % emojis.length;
      }, 500);
    }
  });
}

// Console easter egg
export function initConsoleEasterEgg(): void {
  const styles = {
    title: 'font-size: 24px; font-weight: bold; color: #6366f1; text-shadow: 2px 2px #a855f7;',
    subtitle: 'font-size: 14px; color: #64748b;',
    highlight: 'font-size: 12px; color: #10b981; font-weight: bold;',
    link: 'font-size: 12px; color: #3b82f6;'
  };
  
  console.log('%c\n' +
    '    ╔═══════════════════════════════════════╗\n' +
    '    ║                                       ║\n' +
    '    ║   🚀 Hey there, curious developer! 🚀  ║\n' +
    '    ║                                       ║\n' +
    '    ╚═══════════════════════════════════════╝\n',
    'color: #6366f1; font-family: monospace;'
  );
  
  console.log('%cNikhil Rathore', styles.title);
  console.log('%cFull-Stack Developer | React • Next.js • Node.js', styles.subtitle);
  console.log('\n%c✨ You found the secret! Since you\'re here...', styles.highlight);
  console.log('%c   Let\'s connect: https://github.com/Blazeiscoding', styles.link);
  console.log('%c   Or drop me a line: nikhilrathore52297@gmail.com\n', styles.link);
  
  console.log('%c🎮 Pro tip: Try typing "hire()" in the console 😉', 'color: #f59e0b; font-size: 11px;');
  
  (window as any).hire = () => {
    console.log('%c\n🎉 GREAT CHOICE! 🎉', 'font-size: 20px; color: #10b981;');
    console.log('%cI\'m currently open to exciting opportunities!', 'font-size: 14px; color: #64748b;');
    console.log('%cReach out: nikhilrathore52297@gmail.com', 'font-size: 14px; color: #3b82f6;');
    window.open('mailto:nikhilrathore52297@gmail.com?subject=Let\'s Work Together!', '_blank');
    return '📧 Opening email client...';
  };
}
