import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Heart, ArrowLeft, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { SiteHeader } from "@/app/components/layout/SiteHeader";

import { MotionLink, MotionButton, ghostHoverVariants, tapScale, tapScaleSm, tapScaleLg } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const thumbRest = { borderColor: "rgba(0,0,0,0)" };
const thumbHover = { borderColor: "var(--border)" };
const thumbActive = { borderColor: "var(--foreground)" };

const sizeRestUnselected = { backgroundColor: "rgba(0,0,0,0)", color: "#0f172a", borderColor: "#cbd5e1" };
const sizeHover = { backgroundColor: "var(--action)", color: "var(--action-foreground)", borderColor: "var(--action-border)" };
const sizeSelected = { backgroundColor: "#0f172a", color: "#ffffff", borderColor: "#0f172a" };

const addToBagVariants = {
  rest: { backgroundColor: "#0a0a0a" },
  hover: { backgroundColor: "rgba(10,10,10,0.8)" },
};

const wishlistButtonRest = { borderColor: "var(--border)", backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" };
const wishlistButtonHover = { borderColor: "var(--action-border)", backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" };
const wishlistButtonActive = { borderColor: "var(--foreground)", backgroundColor: "var(--foreground)", color: "var(--primary-foreground)" };

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [product, setProduct]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity]     = useState(1);
  const [activeImage, setActiveImage]   = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding]         = useState(false);
  const [sizeError, setSizeError]   = useState(false);
  const [related, setRelated]       = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate("/shop"); });
  }, [slug]);

  const allImages = product?.images?.length
    ? product.images.map((img: any) => getImageUrl(img.image_url))
    : ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop"];

  const availableSizes = product?.sizes?.filter((s: any) => s.stock_quantity > 0) || [];

  useEffect(() => {
    if (!selectedSize && availableSizes.length) {
      setSelectedSize(availableSizes[0].size);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (!user || !product) { setWishlisted(false); return; }
    api.get("/wishlist")
      .then((res: { data: { product_id: number }[] }) => setWishlisted(res.data.some((item) => item.product_id === product.id)))
      .catch(() => {});
  }, [user, product]);

  useEffect(() => {
    if (!product?.category_slug) { setRelated([]); return; }
    api.get("/products", { params: { category: product.category_slug, limit: 5 } })
      .then(({ data }) => setRelated(data.products.filter((p: any) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [product]);

  const handleAddToCart = async () => {
    if (!selectedSize) { setSizeError(true); return; }
    if (!user) { navigate("/login"); return; }
    setAdding(true);
    await addItem(product.id, selectedSize, quantity);
    setAdding(false);
  };

  const toggleWishlist = async () => {
    if (!user) { navigate("/login"); return; }
    if (wishlisted) {
      await api.delete(`/wishlist/${product.id}`);
      setWishlisted(false);
    } else {
      await api.post("/wishlist", { product_id: product.id });
      setWishlisted(true);
    }
  };

  useDocumentTitle(product?.name || "Product", product?.description?.slice(0, 160));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xs tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <SiteHeader />
      
      {/* Breadcrumb */}        
      <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
        <div className="border-b border-border px-6 md:px-12 py-3">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground">
            <MotionLink to="/" initial="rest" whileHover="hover" variants={ghostHoverVariants}>Home</MotionLink>
            <span>/</span>
            <MotionLink to="/shop" initial="rest" whileHover="hover" variants={ghostHoverVariants}>Shop</MotionLink>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 shrink-0">
                {allImages.map((img: string, i: number) => {
                  const isActive = activeImage === i;
                  return (
                    <motion.button key={i} onClick={() => setActiveImage(i)}
                      initial={false}
                      animate={isActive ? thumbActive : thumbRest}
                      whileHover={isActive ? undefined : thumbHover}
                      whileTap={tapScaleSm}
                      transition={{ duration: 0.2 }}
                      className="aspect-[4/5] overflow-hidden border-2">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </motion.button>
                  );
                })}
              </div>
            )}
            {/* Main image */}
            <div className="flex-1 aspect-[4/5] overflow-hidden bg-secondary relative">
              <img src={allImages[activeImage]} alt={product.name}
                className="w-full h-full object-cover" />
              {product.tag && (
                <span className="absolute top-4 left-4 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <MotionButton onClick={() => navigate(-1)}
              initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
              className="flex items-center gap-2 text-[10px] tracking-widest uppercase mb-8 w-fit">
              <ArrowLeft size={12} /> Back
            </MotionButton>

            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              {product.name}
            </h1>
            <p className="text-xl font-semibold mb-6">₦{Number(product.price).toLocaleString()}</p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8 font-light">{product.description}</p>

            {/* Size picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-widest uppercase font-bold">
                  Select Size {selectedSize && <span className="font-normal text-muted-foreground ml-1">- {selectedSize}</span>}
                </p>
              </div>
              {sizeError && <p className="text-red-500 text-xs mb-2">Please select a size</p>}
              <div className="flex flex-wrap gap-2">
                {availableSizes.length ? availableSizes.map((s: any) => {
                  const isSelected = selectedSize === s.size;
                  return (
                    <motion.button key={s.size} onClick={() => { setSelectedSize(s.size); setSizeError(false); }}
                      initial={false}
                      animate={isSelected ? sizeSelected : sizeRestUnselected}
                      whileHover={isSelected ? undefined : sizeHover}
                      whileTap={tapScaleSm}
                      transition={{ duration: 0.2 }}
                      className="w-12 h-12 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-slate-400/40">
                      {s.size}
                    </motion.button>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">Out of stock</p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-[10px] tracking-widest uppercase font-bold">Quantity</p>
              <div className="flex items-center border border-border">
                <MotionButton onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                  className="w-10 h-10 flex items-center justify-center">
                  <Minus size={12} />
                </MotionButton>
                <span className="w-10 h-10 flex items-center justify-center text-sm font-medium">{quantity}</span>
                <MotionButton onClick={() => setQuantity((q) => q + 1)}
                  initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                  className="w-10 h-10 flex items-center justify-center">
                  <Plus size={12} />
                </MotionButton>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <MotionButton onClick={handleAddToCart} disabled={adding || !availableSizes.length}
                initial="rest" whileHover={adding ? undefined : "hover"} whileTap={adding ? undefined : tapScaleLg}
                variants={addToBagVariants}
                className="flex-1 flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
                {adding ? "Adding…" : (
                  <><Plus size={12} /> Add to Bag</>
                )}
              </MotionButton>
              <motion.button onClick={toggleWishlist}
                initial={false}
                animate={wishlisted ? wishlistButtonActive : wishlistButtonRest}
                whileHover={wishlisted ? undefined : wishlistButtonHover}
                whileTap={tapScale}
                transition={{ duration: 0.2 }}
                className="w-14 h-14 border flex items-center justify-center">
                <Heart size={16} strokeWidth={1.5} className={wishlisted ? "fill-white stroke-white" : ""} />
              </motion.button>
            </div>

            {/* Perks */}
            <div className="border-t border-border pt-6 space-y-3">
              {["Free shipping on orders over ₦250,000", "Free 30-day returns", "Secure checkout with Paystack"].map((perk) => (
                <p key={perk} className="text-xs text-muted-foreground flex items-center gap-2 font-light">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" /> {perk}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 pb-16 md:pb-24 border-t border-border pt-12 md:pt-16">
            <h2 className="text-2xl font-black mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
              You might also <em className="font-light italic">like</em>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
              {related.map((p) => (
                <MotionLink key={p.id} to={`/product/${p.slug}`}
                  initial="rest" whileHover="hover" whileTap={tapScaleSm}
                  className="block cursor-pointer">
                  <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4">
                    <motion.img
                      src={getImageUrl(p.image) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop"}
                      alt={p.name}
                      variants={{ rest: { filter: "grayscale(1)", scale: 1 }, hover: { filter: "grayscale(0)", scale: 1.05 } }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{p.category}</p>
                  <h3 className="text-sm font-medium leading-snug">{p.name}</h3>
                  <p className="text-sm font-semibold mt-1">₦{Number(p.price).toLocaleString()}</p>
                </MotionLink>
              ))}
            </div>
          </div>
        )}
      </div>
</>
  );
}
