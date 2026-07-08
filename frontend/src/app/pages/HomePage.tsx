import { useState, useEffect } from "react";
import { ArrowRight, ChevronRight, Plus, Heart } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, fadeHoverVariants, arrowShiftVariants, tapScale, tapScaleSm, tapScaleLg } from "@/app/components/motion/primitives";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";

import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import beanieCap from "@/imports/beanie caps.jpg";
import hoodies from "@/imports/hoodies.jpg";
import shirts from "@/imports/shirts.jpg";
import editorialShoot2 from "@/imports/editorialShoot2.jpg";

const categoryDefaults = [
  { name: "Hoodies", subtitle: "Essential comfort", image: hoodies, slug: "hoodies" },
  { name: "Beanie Caps", subtitle: "All-season warmth", image: beanieCap, slug: "beanie-caps" },
  { name: "Shirts", subtitle: "Elevated essentials", image: shirts, slug: "shirts" },
];

const filters = [
  { label: "All", slug: "" },
  { label: "Hoodies", slug: "hoodies" },
  { label: "Beanie Caps", slug: "beanie-caps" },
  { label: "Shirts", slug: "shirts" },
];

const shopButtonVariants = {
  rest: { backgroundColor: "#ffffff", color: "#000000" },
  hover: { backgroundColor: "#000000", color: "#ffffff" },
};

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)" },
};

const categoryOverlayVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0.2)" },
  hover: { backgroundColor: "rgba(0,0,0,0.1)" },
};

const productImageVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
};

const addToBagVariants = {
  rest: { y: "100%", opacity: 0 },
  hover: { y: 0, opacity: 1 },
};

const filterPillVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)" },
  hover: { backgroundColor: "#0f172a", color: "#ffffff" },
};

function Slideshow({ images, alt, imgClassName }: { images: string[]; alt: string; imgClassName?: string }) {
  const [index, setIndex] = useState(0);
  const safeImages = images.length ? images : [editorialShoot2];

  useEffect(() => {
    setIndex(0);
    if (safeImages.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % safeImages.length), 3000);
    return () => clearInterval(id);
  }, [safeImages]);

  return (
    <AnimatePresence>
      <motion.img
        key={safeImages[index]}
        src={safeImages[index]}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className={`absolute inset-0 w-full h-full object-cover ${imgClassName || ""}`}
      />
    </AnimatePresence>
  );
}

export default function HomePage() {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string | null>>({});
  const [aboutImages, setAboutImages] = useState<string[]>([]);

  const categories = categoryDefaults.map((c) => ({
    ...c,
    image: categoryImages[c.slug] ? getImageUrl(categoryImages[c.slug])! : c.image,
  }));

  useEffect(() => {
    setLoadingProducts(true);
    const params: Record<string, string> = { limit: "6" };
    if (activeFilter) params.category = activeFilter;
    api.get("/products", { params })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [activeFilter]);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setHeroVideoUrl(data.hero_video_url || null);
        setCategoryImages(data.categoryImages || {});
        setAboutImages((data.aboutImages || []).map((img: { image_url: string }) => img.image_url));
      })
      .catch(() => {});
  }, []);

  const toggleWishlist = async (id: number) => {
    if (!user) { navigate("/login"); return; }
    if (wishlist.includes(id)) {
      await api.delete(`/wishlist/${id}`);
      setWishlist((prev) => prev.filter((i) => i !== id));
    } else {
      await api.post("/wishlist", { product_id: id });
      setWishlist((prev) => [...prev, id]);
    }
  };

  const handleAddToCart = async (product: any) => {
    await addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image }, "M", 1);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/newsletter/subscribe", { email });
      setSubscribed(true);
    } catch (_) { setSubscribed(true); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: "95vh", minHeight: 540 }}>
        <motion.video
          key={heroVideoUrl || "default"}
          initial={{ scale: 3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-top origin-top"
        >
          <source
            src={heroVideoUrl ? getImageUrl(heroVideoUrl) : "/videos/hero-loop.webm"}
            type={heroVideoUrl?.endsWith(".mp4") ? "video/mp4" : "video/webm"}
          />
        </motion.video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-20 pb-16 md:pb-24">
          <h1 className="text-white text-6xl md:text-[7rem] leading-[0.9] font-black mb-8 max-w-2xl"
            style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
            Life<br /><em className="font-light italic">with</em><br />Purpose.
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <MotionLink to="/shop"
              initial="rest"
              whileHover="hover"
              whileTap={tapScale}
              variants={shopButtonVariants}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 px-8 py-4 text-xs tracking-widest uppercase font-semibold border border-white">
              Shop Collection
              <motion.span variants={arrowShiftVariants} className="flex">
                <ArrowRight size={14} />
              </motion.span>
            </MotionLink>
          </div>
        </div>
        <div className="absolute top-8 right-8 text-white/30 text-xs tracking-widest uppercase hidden md:block">
          Premium Quality
        </div>
      </section>

      {/* Category grid */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <Reveal className="flex items-end justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Shop by<br /><em className="font-light italic">category</em>
          </h2>
          <MotionLink to="/shop"
            initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={fadeHoverVariants}
            className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground">
            View all <ChevronRight size={12} />
          </MotionLink>
        </Reveal>
        <Reveal delay={0.1} y={32}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" style={{ gridTemplateRows: "auto auto" }}>
            <motion.div
              initial="rest" whileHover="hover"
              className="group relative overflow-hidden bg-muted cursor-pointer row-span-2 col-span-1" style={{ minHeight: 520 }}
              onClick={() => navigate(`/shop/${categories[0].slug}`)}>
              <img src={categories[0].image} alt={categories[0].name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <motion.div variants={categoryOverlayVariants} transition={{ duration: 0.5 }} className="absolute inset-0 pointer-events-none" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white/60 text-[10px] tracking-widest uppercase mb-1">{categories[0].subtitle}</p>
                <h3 className="text-white text-xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{categories[0].name}</h3>
              </div>
            </motion.div>
            {[categories[1], categories[2]].map((cat) => (
              <motion.div key={cat.slug}
                initial="rest" whileHover="hover"
                className="group relative overflow-hidden bg-muted cursor-pointer col-span-1 md:col-span-2" style={{ minHeight: 250 }}
                onClick={() => navigate(`/shop/${cat.slug}`)}>
                <img src={cat.image} alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <motion.div variants={categoryOverlayVariants} transition={{ duration: 0.5 }} className="absolute inset-0 pointer-events-none" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-white/60 text-[10px] tracking-widest uppercase mb-1">{cat.subtitle}</p>
                  <h3 className="text-white text-xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{cat.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* New Arrivals */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase mb-2">Just landed</p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                New <em className="font-light italic">arrivals</em>
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => {
                const isActive = activeFilter === f.slug;
                return (
                  <motion.button key={f.slug} onClick={() => setActiveFilter(f.slug)}
                    initial="rest" whileHover={isActive ? undefined : "hover"} whileTap={tapScaleSm}
                    variants={filterPillVariants}
                    animate={isActive ? { backgroundColor: "#0f172a", color: "#ffffff" } : "rest"}
                    transition={{ duration: 0.2 }}
                    className={`px-4 py-1.5 text-[11px] tracking-widest uppercase border ${isActive ? "border-slate-900 shadow-sm" : "border-slate-300"}`}>
                    {f.label}
                  </motion.button>
                );
              })}
            </div>
          </Reveal>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-secondary mb-4" />
                  <div className="h-3 bg-secondary w-1/3 mb-2" />
                  <div className="h-4 bg-secondary w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <Reveal delay={0.1} y={32}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                {products.map((product) => (
                  <motion.div key={product.id}
                    initial="rest" whileHover="hover"
                    className="cursor-pointer group"
                    onClick={() => navigate(`/product/${product.slug}`)}>
                    <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4">
                      <motion.img src={getImageUrl(product.image)}
                        alt={product.name}
                        variants={productImageVariants}
                        transition={{ duration: 0.7 }}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        className="absolute inset-0 w-full h-full object-cover protected-img" />
                      {product.tag && (
                        <span className="absolute top-3 left-3 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1">
                          {product.tag}
                        </span>
                      )}
                      <motion.button
                        whileTap={tapScaleSm}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center">
                        <Heart size={16} strokeWidth={1.5} className={wishlist.includes(product.id) ? "fill-white stroke-white" : "stroke-white"} />
                      </motion.button>
                      <motion.div
                        variants={addToBagVariants}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                        className="absolute bottom-0 left-0 right-0 bg-foreground text-primary-foreground flex items-center justify-center gap-2 py-3 text-[11px] tracking-widest uppercase font-semibold">
                        <Plus size={12} strokeWidth={2} /> Add to bag
                      </motion.div>
                    </div>
                    <h3 className="text-sm font-medium leading-snug mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{product.category}</p>
                      <p className="text-sm font-semibold shrink-0">₦{Number(product.price).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          )}

          <div className="mt-14 text-center">
            <MotionLink to="/shop"
              initial="rest" whileHover="hover" whileTap={tapScaleLg}
              className="inline-flex items-center gap-3 border border-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold"
              variants={outlineButtonVariants}>
              View all products <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
            </MotionLink>
          </div>
        </div>
      </section>

      {/* Editorial band */}
      <section className="grid md:grid-cols-2 min-h-[500px]">
        <div className="relative overflow-hidden bg-muted min-h-[300px] md:min-h-0">
          <Slideshow
            images={aboutImages.map((u) => getImageUrl(u)!)}
            alt="Sturdy Life" />
        </div>
        <Reveal className="bg-foreground text-primary-foreground flex flex-col justify-center px-10 md:px-16 py-16 md:py-24">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-6">The Sturdy Edit</p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            What does<br /><em className="font-light italic">sturdy life</em><br />mean to you?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-10 font-light">
            This isn't fashion. It's identity. Sturdy Life was built for those who move with intention — those who understand that life is given, but purpose is chosen.
          </p>
          <MotionLink to="/about"
            initial="rest" whileHover="hover" whileTap={tapScaleSm}
            className="inline-flex items-center gap-3 text-xs tracking-widest uppercase font-semibold text-gray-500 border-b border-gray-500 pb-0.5 w-fit">
            Read about Sturdy <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
          </MotionLink>
        </Reveal>
      </section>

      {/* Brand values */}
      <Reveal>
        <section className="border-t border-border">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { title: "Free Delivery", body: "On all orders above ₦250,000" },
                { title: "Sustainably Made", body: "Certified organic & recycled materials" },
                { title: "Easy Returns", body: "Free 30-day returns nationwide" },
                { title: "Secure Payment", body: "Encrypted checkout, always" },
              ].map((item) => (
                <div key={item.title} className="border-l border-border pl-5">
                  <h4 className="text-sm font-bold mb-1 tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Newsletter */}
      <Reveal>
        <section className="bg-secondary border-t border-border py-20">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            <div className="max-w-sm">
              <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">Stay in the loop</p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                The letter,<br /><em className="font-light italic">once a month.</em>
              </h2>
            </div>
            <div className="w-full md:max-w-md">
              {subscribed ? (
                <div className="border-b border-foreground pb-4">
                  <p className="text-sm tracking-wide">{"You're on the list. Welcome to Sturdy Life."}</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address" required
                    className="flex-1 border-b border-foreground bg-transparent py-3 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none font-light" />
                  <motion.button type="submit"
                    initial="rest" whileHover="hover" whileTap={tapScale}
                    variants={fadeHoverVariants}
                    className="flex items-center justify-center gap-2 bg-foreground text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase font-semibold shrink-0">
                    Subscribe <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
                  </motion.button>
                </form>
              )}
              <p className="text-muted-foreground text-[10px] mt-3 font-light">No spam. Unsubscribe any time.</p>
            </div>
          </div>
        </section>
      </Reveal>

      <SiteFooter />
    </div>
  );
}
