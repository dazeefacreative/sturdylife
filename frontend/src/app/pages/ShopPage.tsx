import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Heart, Plus, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, MotionButton, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";

const CATEGORIES = [
  { label: "All",        slug: "" },
  { label: "Hoodies",    slug: "hoodies" },
  { label: "Beanie Caps",slug: "beanie-caps" },
  { label: "Shirts",     slug: "shirts" },
];
const CATEGORY_LABELS: Record<string, string> = {
  hoodies: "Hoodies",
  "beanie-caps": "Beanie Caps",
  shirts: "Shirts",
};
const TAGS = ["New", "Limited", "Bestseller", "Sale"];

const breadcrumbVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

const pillRestUnselected = { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)", borderColor: "var(--border)" };
const pillHover = { backgroundColor: "rgba(0,0,0,0)", color: "#0a0a0a", borderColor: "#0a0a0a" };
const pillSelected = { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)", borderColor: "var(--foreground)" };

const ghostLinkVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

const imageVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
};

const addToBagVariants = {
  rest: { y: "100%", opacity: 0 },
  hover: { y: 0, opacity: 1 },
};

const loadMoreVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

export default function ShopPage() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [products, setProducts]     = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [wishlist, setWishlist]     = useState<number[]>([]);
  const [activeTag, setActiveTag]   = useState("");
  const [search, setSearch]         = useState(searchParams.get("search") || "");
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCategory = categoryParam || "";
  const activeLabel = CATEGORY_LABELS[activeCategory] || "All Products";
  useDocumentTitle(activeLabel, "Shop the full Sturdy Life collection — hoodies, beanie caps, and shirts built to last.");

  useEffect(() => {
    const paramSearch = searchParams.get("search") || "";
    if (paramSearch !== search) {
      setSearch(paramSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [categoryParam, activeTag, search]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 12 };
    if (activeCategory) params.category = activeCategory;
    if (activeTag)      params.tag      = activeTag;
    if (search)         params.search   = search;

    api.get("/products", { params })
      .then(({ data }) => {
        setProducts((prev) => page === 1 ? data.products : [...prev, ...data.products]);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, activeTag, search, page]);

  const toggleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (wishlist.includes(id)) {
      await api.delete(`/wishlist/${id}`);
      setWishlist((p) => p.filter((i) => i !== id));
    } else {
      await api.post("/wishlist", { product_id: id });
      setWishlist((p) => [...p, id]);
    }
  };

  const handleAdd = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    await addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image }, "M", 1);
  };

  return (
    <>
    <SiteHeader/>
    <div className="min-h-screen bg-background mb-12" style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Page header */}
      <div className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2">
            <MotionLink to="/" initial="rest" whileHover="hover" variants={breadcrumbVariants}>Home</MotionLink> / Shop
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-4xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
              {activeCategory
                ? <span>{activeLabel}</span>
                : <span>All <em className="font-light italic">Products</em></span>
              }
            </h1>
            <span className="text-muted-foreground text-xs">{total} items</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        {/* Filters row */}
        <div className="mb-10">
          {/* Row 1: category pills + tag filter toggle (full width) */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map((c) => {
                const isActive = activeCategory === c.slug;
                return (
                  <motion.button key={c.slug}
                    onClick={() => navigate(c.slug ? `/shop/${c.slug}` : "/shop")}
                    initial={false}
                    animate={isActive ? pillSelected : pillRestUnselected}
                    whileHover={isActive ? undefined : pillHover}
                    whileTap={tapScaleSm}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-1.5 text-[11px] tracking-widest uppercase border">
                    {c.label}
                  </motion.button>
                );
              })}
            </div>
            <MotionButton onClick={() => setFilterOpen(!filterOpen)}
              initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostLinkVariants}
              className="flex items-center gap-2 text-[11px] tracking-widest uppercase border border-border px-3 py-1.5 shrink-0">
              <SlidersHorizontal size={12} /> Filter
            </MotionButton>
          </div>

          {/* Row 2: search (full width) */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const cleanSearch = search.trim();
            if (cleanSearch) {
              setSearchParams({ search: cleanSearch });
            } else {
              setSearchParams({});
            }
          }} className="w-full">
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border px-4 py-2 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors"
            />
          </form>
        </div>

        {/* Tag filter panel */}
        {filterOpen && (
          <div className="border border-border p-4 mb-8 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground mr-2">Tag:</span>
            {TAGS.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <motion.button key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                  initial={false}
                  animate={isActive ? pillSelected : pillRestUnselected}
                  whileHover={isActive ? undefined : pillHover}
                  whileTap={tapScaleSm}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-1 text-[11px] tracking-widest uppercase border">
                  {tag}
                </motion.button>
              );
            })}
            {activeTag && (
              <MotionButton onClick={() => setActiveTag("")}
                initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostLinkVariants}
                className="flex items-center gap-1 text-[11px] ml-2">
                <X size={10} /> Clear
              </MotionButton>
            )}
          </div>
        )}

        {/* Grid */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-secondary mb-4" />
                <div className="h-3 bg-secondary w-1/3 mb-2 rounded" />
                <div className="h-4 bg-secondary w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground text-sm">No products found.</div>
        ) : (
          <Reveal y={32}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {products.map((product) => (
                <MotionLink key={product.id} to={`/product/${product.slug}`}
                  initial="rest" whileHover="hover"
                  className="cursor-pointer block group">
                  <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4">
                    <motion.img
                      src={getImageUrl(product.image) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop"}
                      alt={product.name}
                      variants={imageVariants}
                      transition={{ duration: 0.7 }}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="absolute inset-0 w-full h-full object-cover protected-img"
                    />
                    {product.tag && (
                      <span className="absolute top-3 left-3 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1">
                        {product.tag}
                      </span>
                    )}
                    <motion.button onClick={(e) => toggleWishlist(e, product.id)}
                      whileTap={tapScaleSm}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center">
                      <Heart size={16} strokeWidth={1.5} className={wishlist.includes(product.id) ? "fill-white stroke-white" : "stroke-white"} />
                    </motion.button>
                    <motion.div onClick={(e) => handleAdd(e, product)}
                      variants={addToBagVariants}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 bg-foreground text-primary-foreground flex items-center justify-center gap-2 py-3 text-[11px] tracking-widest uppercase font-semibold">
                      <Plus size={12} strokeWidth={2} /> Add to bag
                    </motion.div>
                  </div>
                  <h3 className="text-sm font-medium leading-snug mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{product.category}</p>
                    <p className="text-sm font-semibold shrink-0">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </MotionLink>
              ))}
            </div>
          </Reveal>
        )}

        {/* Load more */}
        {page < pages && (
          <div className="text-center mt-14">
            <MotionButton onClick={() => setPage((p) => p + 1)} disabled={loading}
              initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
              variants={loadMoreVariants}
              className="border border-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
              {loading ? "Loading…" : "Load More"}
            </MotionButton>
          </div>
        )}
      </div>
    </div>
    <SiteFooter/>
    </>
  );
}
