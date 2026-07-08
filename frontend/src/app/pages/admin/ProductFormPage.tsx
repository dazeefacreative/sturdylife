import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionButton, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const cancelButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

const submitButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const uploadLabelVariants = {
  rest: { borderColor: "var(--border)" },
  hover: { borderColor: "var(--action-border)" },
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

interface SizeStock { size: string; stock: number; }
interface ExistingImage { id: number; image_url: string; is_primary: boolean | number; }

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  useDocumentTitle(isEdit ? "Admin · Edit Product" : "Admin · Add Product");

  const [form, setForm] = useState({
    name: "", description: "", price: "", category_id: "", tag: "", is_active: true,
  });
  const [sizes, setSizes] = useState<SizeStock[]>(
    SIZES.map((size) => ({ size, stock: 0 }))
  );
  const [images, setImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    if (isEdit) {
      // Load existing product - fetch by id via admin endpoint
      api.get(`/admin/products/${id}`)
        .then(({ data }) => {
          setForm({
            name: data.name ?? "",
            description: data.description ?? "",
            price: data.price ?? "",
            category_id: data.category_id ?? "",
            tag: data.tag ?? "",
            is_active: !!data.is_active,
          });
          if (data.sizes) {
            setSizes(SIZES.map((s) => {
              const existing = data.sizes.find((x: any) => x.size === s);
              return { size: s, stock: existing?.stock_quantity || 0 };
            }));
          }
          if (data.images) setExistingImages(data.images);
        })
        .catch((err) => setError(err.response?.data?.error || "Failed to load product"))
        .finally(() => setLoadingProduct(false));
    }
  }, [id]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const remainingSlots = Math.max(0, 8 - existingImages.length - images.length);
    const candidates = Array.from(files).slice(0, remainingSlots);
    const oversized = candidates.filter((f) => f.size > MAX_IMAGE_SIZE);
    const arr = candidates.filter((f) => f.size <= MAX_IMAGE_SIZE);
    if (oversized.length) {
      setError(`${oversized.length === 1 ? "1 image was" : `${oversized.length} images were`} skipped — each must be 2MB or smaller.`);
    }
    setImages((prev) => [...prev, ...arr]);
    setNewPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = async (imageId: number) => {
    if (!id) return;
    await api.delete(`/products/${id}/images/${imageId}`);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const setStock = (size: string, stock: number) =>
    setSizes((prev) => prev.map((s) => s.size === size ? { ...s, stock } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append("sizes", JSON.stringify(sizes));
      images.forEach((img) => fd.append("images", img));

      if (isEdit) {
        await api.put(`/products/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      navigate("/admin/products");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "border border-border px-4 py-3 text-[16px] md:text-sm bg-transparent w-full focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
      <h1 className="text-2xl font-black mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
        {isEdit ? "Edit Product" : "Add New Product"}
      </h1>

      {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

      {loadingProduct ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary animate-pulse" />)}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            Product Info
          </h2>
          <div className="space-y-4">
            <input required placeholder="Product name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls} />
            <textarea rows={4} placeholder="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required type="number" placeholder="Price (₦)" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputCls} />
              <select value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className={inputCls}>
                <option value="">Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                className={inputCls}>
                <option value="">No tag</option>
                <option value="New">New</option>
                <option value="Limited">Limited</option>
                <option value="Bestseller">Bestseller</option>
                <option value="Sale">Sale</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sizes + stock */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            Sizes & Stock
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {sizes.map(({ size, stock }) => (
              <div key={size} className="text-center">
                <p className="text-[10px] tracking-widest uppercase mb-2 text-muted-foreground">{size}</p>
                <input
                  type="number" min="0" value={stock}
                  onChange={(e) => setStock(size, Number(e.target.value))}
                  className="border border-border w-full text-center py-2 text-[16px] md:text-sm bg-transparent focus:outline-none focus:border-foreground"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Images */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
            Product Images
          </h2>
          <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
            className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
            <Upload size={20} className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">Click to upload images (max 8, 2MB each — auto-compressed to 500KB)</span>
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </motion.label>
          {(existingImages.length > 0 || newPreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-[4/5] bg-muted overflow-hidden group">
                  <img src={getImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                  {!!img.is_primary && (
                    <span className="absolute bottom-1 left-1 bg-foreground text-primary-foreground text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
                      Primary
                    </span>
                  )}
                  <MotionButton type="button" onClick={() => removeExistingImage(img.id)}
                    whileTap={tapScaleSm}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white">
                    <X size={12} />
                  </MotionButton>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={i} className="relative aspect-[4/5] bg-muted overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {existingImages.length === 0 && i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-foreground text-primary-foreground text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
                      Primary
                    </span>
                  )}
                  <MotionButton type="button" onClick={() => removeNewImage(i)}
                    whileTap={tapScaleSm}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white">
                    <X size={12} />
                  </MotionButton>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Visibility */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="active" checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4" />
          <label htmlFor="active" className="text-sm">Product is active and visible in store</label>
        </div>

        <div className="flex gap-4">
          <MotionButton type="button" onClick={() => navigate("/admin/products")}
            initial="rest" whileHover="hover" whileTap={tapScale} variants={cancelButtonVariants}
            className="flex-1 border border-border py-3 text-xs tracking-widest uppercase">
            Cancel
          </MotionButton>
          <MotionButton type="submit" disabled={loading}
            initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
            variants={submitButtonVariants}
            className="flex-1 text-primary-foreground py-3 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
            {loading ? "Saving…" : isEdit ? "Update Product" : "Publish Product"}
          </MotionButton>
        </div>
      </form>
      )}
    </div>
  );
}

