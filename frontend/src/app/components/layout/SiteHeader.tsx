import { useState } from "react";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { MotionLink, tapScaleSm } from "@/app/components/motion/primitives";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import logoSrc from "@/imports/sturdy-life.png";

const navLinks = [
  { label: "Hoodies", slug: "hoodies" },
  { label: "Beanie Caps", slug: "beanie-caps" },
  { label: "Shirts", slug: "shirts" },
];

const navLinkVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

const iconVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "var(--foreground)" },
};

export function SiteHeader() {
  const { count: cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) {
      setSearchOpen(true);
      return;
    }
    navigate(`/shop?search=${encodeURIComponent(cleanQuery)}`);
  };

  const handleSearchIconClick = () => {
    const cleanQuery = searchQuery.trim();
    if (cleanQuery) {
      navigate(`/shop?search=${encodeURIComponent(cleanQuery)}`);
      return;
    }
    setSearchOpen((open) => !open);
  };

  return (
    <>
      {/* Announcement bar */}
      {/* <div className="bg-foreground text-primary-foreground text-center py-2 px-4 text-xs tracking-widest uppercase">
        Complimentary shipping on orders over ₦250,000 — Use code <span className="underline underline-offset-2">STURDY25</span>
      </div> */}

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#f8f8f6] border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <MotionLink to="/" whileTap={tapScaleSm} className="flex items-center h-10 w-32 shrink-0">
            <ImageWithFallback src={logoSrc} alt="Sturdy Life logo" className="h-10 w-32 object-contain" />
          </MotionLink>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <MotionLink key={link.slug} to={`/shop/${link.slug}`}
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={navLinkVariants}
                className="text-xs tracking-widest uppercase">
                {link.label}
              </MotionLink>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <motion.form onSubmit={handleSearchSubmit}
              initial={false}
              animate={searchOpen ? { width: 224, opacity: 1, marginRight: 4 } : { width: 0, opacity: 0, marginRight: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden md:flex items-center overflow-hidden">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full border-b border-border bg-transparent px-1 py-1.5 text-sm outline-none"
              />
            </motion.form>
            <motion.button type="button" initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={iconVariants}
              className="cursor-pointer" onClick={handleSearchIconClick}>
              {searchOpen ? <X size={18} strokeWidth={1.5} /> : <Search size={18} strokeWidth={1.5} />}
            </motion.button>
            <motion.button initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={iconVariants}
              className="relative cursor-pointer" onClick={() => navigate("/cart")}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-primary-foreground text-[10px] flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </motion.button>
            {user ? (
              <MotionLink to={user.role === "admin" ? "/admin" : "/account"}
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={navLinkVariants}
                className="hidden md:block text-xs tracking-widest uppercase">
                {user.first_name}
              </MotionLink>
            ) : (
              <MotionLink to="/login"
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={navLinkVariants}
                className="hidden md:block text-xs tracking-widest uppercase">
                Login
              </MotionLink>
            )}
            <motion.button initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={iconVariants}
              className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            </motion.button>
          </div>
        </div>

        <div className={`${searchOpen ? "flex" : "hidden"} md:hidden max-w-[1440px] mx-auto px-6 md:px-12 py-3`}>
          <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded border border-border bg-transparent px-4 py-2 text-sm outline-none"
            />
            <motion.button type="submit" whileTap={tapScaleSm}
              className="w-full rounded bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground">
              Search
            </motion.button>
          </form>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <MotionLink key={link.slug} to={`/shop/${link.slug}`}
                  whileTap={tapScaleSm}
                  className="text-sm tracking-widest uppercase text-foreground border-b border-border pb-4"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </MotionLink>
              ))}
              {user ? (
                <MotionLink to={user.role === "admin" ? "/admin" : "/account"}
                  whileTap={tapScaleSm}
                  className="text-sm tracking-widest uppercase text-foreground border-b border-border pb-4"
                  onClick={() => setMenuOpen(false)}>
                  {user.first_name}
                </MotionLink>
              ) : (
                <MotionLink to="/login"
                  whileTap={tapScaleSm}
                  className="text-sm tracking-widest uppercase text-foreground border-b border-border pb-4"
                  onClick={() => setMenuOpen(false)}>
                  Login
                </MotionLink>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
