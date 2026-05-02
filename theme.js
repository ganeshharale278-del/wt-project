// ============================================================
// FEATURE 1: Dark Mode / Theme Switcher
// Uses CSS variables — no inline styles needed
// ============================================================
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  if (saved === 'dark') document.body.classList.add('dark-mode');

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.querySelectorAll('.theme-toggle').forEach(b => b.textContent = isDark ? '☀️' : '🌙');
    });
  });
}
document.addEventListener('DOMContentLoaded', initTheme);
