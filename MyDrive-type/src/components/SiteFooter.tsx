export default function SiteFooter() {
  return (
    <footer className="section-padding py-10 mt-8">
      <div className="max-w-6xl mx-auto border-t border-border/40 pt-6 text-sm text-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>© 2025 — All rights reserved</div>
        <a
          href="#"
          className="hover:text-white/80 transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          TempShare
        </a>
      </div>
    </footer>
  );
}
