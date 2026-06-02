import { Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-white py-12 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-coral flex items-center justify-center text-white shadow-lg shadow-coral/20">
            <Globe className="size-[18px]" />
          </div>
          <span className="font-bold text-lg text-dark tracking-tight">
            Lagos Rhythm
          </span>
        </div>

        <div className="flex gap-8 text-sm font-semibold text-muted-foreground">
          {['About', 'Terms', 'Privacy', 'Contact'].map(link => (
            <a key={link} href="#" className="hover:text-coral transition-colors">{link}</a>
          ))}
        </div>

        <p className="text-muted-foreground text-sm font-medium">
          (c) 2024 Lagos Rhythm. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
