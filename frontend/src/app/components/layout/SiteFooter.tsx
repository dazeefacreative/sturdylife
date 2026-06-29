import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { MotionLink, MotionA, tapScaleSm } from "@/app/components/motion/primitives";
import logoSrc from "@/imports/sturdy-life.png";

const columns = [
  { heading: "Shop", links: [{ label: "All Products", to: "/shop" }, { label: "Hoodies", to: "/shop/hoodies" }, { label: "Beanie Caps", to: "/shop/beanie-caps" }, { label: "Shirts", to: "/shop/shirts" }] },
  { heading: "Company", links: [{ label: "About", to: "/about" }, { label: "Contact", to: "/contact" }] },
  { heading: "Help", links: [{ label: "Shipping", to: "/shipping" }, { label: "Returns", to: "/returns" }, { label: "Privacy Policy", to: "/privacy-policy" }, { label: "Terms of Service", to: "/terms-of-service" }] },
];

const footerLinkVariants = {
  rest: { color: "#6b7280" },
  hover: { color: "#0a0a0a" },
};

const socialLinkVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2 md:col-span-2">
            <div className="mb-4">
              <ImageWithFallback src={logoSrc} alt="Sturdy Life logo" className="h-10 w-32 object-contain" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs font-light">
              Menswear built for the long haul. Every piece constructed with intent, cut to outlast the trends.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h5 className="text-[10px] tracking-widest uppercase font-bold mb-4">{col.heading}</h5>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <MotionLink to={link.to}
                      initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={footerLinkVariants}
                      className="text-xs font-light">
                      {link.label}
                    </MotionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground tracking-wide font-light">© {new Date().getFullYear()} Sturdy Life. All rights reserved.</p>         
              <MotionA href="https://instagram.com/stxrdy_life" target="_blank"
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={socialLinkVariants}
                className="text-[10px] tracking-widest uppercase"> Instagram              
              </MotionA>    
        </div>
      </div>
    </footer>
  );
}
