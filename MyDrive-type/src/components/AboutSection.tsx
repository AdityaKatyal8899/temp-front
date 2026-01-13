const AboutSection = () => {
  return (
    <section className="section-padding py-20 animate-fade-up">
      <div className="max-w-3xl">
        <h2 className="text-section-title mb-6">
          About the Service
        </h2>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            Temp Share allows temporary file sharing with a focus on privacy and simplicity. 
            Upload any file and share it via a unique access code or URL.
          </p>
          
          <p className="text-lg leading-relaxed">
            Files are short-lived by design. No tracking, no accounts required. 
            Just fast, secure sharing that respects your privacy.
          </p>
          
          <ul className="space-y-2 pt-4">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Access via code or URL</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Automatic file expiration</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Minimal UI focused on speed</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
