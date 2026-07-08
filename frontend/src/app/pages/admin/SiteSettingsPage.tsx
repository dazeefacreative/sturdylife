import { useState, useEffect } from "react";
import { Upload, X, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionButton, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const uploadLabelVariants = {
  rest: { borderColor: "var(--border)" },
  hover: { borderColor: "var(--action-border)" },
};

const submitButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const MAX_VIDEO_SIZE = 5 * 1024 * 1024;
const MAX_CATEGORY_RAW_SIZE = 2 * 1024 * 1024;
const MAX_ABOUT_RAW_SIZE = 2 * 1024 * 1024;
const RATIO_TOLERANCE = 0.08;
const MAX_ABOUT_IMAGES = 4;
const ABOUT_RATIO = 3 / 2;
const ABOUT_RATIO_LABEL = "3:2";

const CATEGORY_CONFIG = [
  { slug: "hoodies", label: "Hoodies", ratio: 1, ratioLabel: "square (1:1)" },
  { slug: "beanie-caps", label: "Beanie Caps", ratio: 3, ratioLabel: "wide banner (3:1)" },
  { slug: "shirts", label: "Shirts", ratio: 3, ratioLabel: "wide banner (3:1)" },
];

interface AboutImage { id: number; image_url: string; }

function readImageDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

function readVideoDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => { resolve({ w: video.videoWidth, h: video.videoHeight }); URL.revokeObjectURL(url); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video")); };
    video.src = url;
  });
}

export default function SiteSettingsPage() {
  useDocumentTitle("Admin · Site Content");

  const [loading, setLoading] = useState(true);

  // Hero video
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroError, setHeroError] = useState("");
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);

  // Category images (1 per category)
  const [categoryImages, setCategoryImages] = useState<Record<string, string | null>>({});
  const [categoryPendingFile, setCategoryPendingFile] = useState<Record<string, File | null>>({});
  const [categoryPendingPreview, setCategoryPendingPreview] = useState<Record<string, string | null>>({});
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [categorySuccess, setCategorySuccess] = useState<Record<string, boolean>>({});
  const [categorySaving, setCategorySaving] = useState<Record<string, boolean>>({});

  // About slideshow
  const [aboutImages, setAboutImages] = useState<AboutImage[]>([]);
  const [aboutError, setAboutError] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setHeroVideoUrl(data.hero_video_url || null);
        setCategoryImages(data.categoryImages || {});
        setAboutImages(data.aboutImages || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Hero video ────────────────────────────────────────────
  const handleHeroFile = async (file: File | null) => {
    setHeroError("");
    setHeroSuccess(false);
    if (!file) return;

    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setHeroError("Only .mp4 or .webm videos are allowed.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setHeroError(`Video must be 5MB or smaller (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    try {
      const { w, h } = await readVideoDims(file);
      if (h >= w) {
        setHeroError(`Video must be landscape orientation — got ${w}x${h}.`);
        return;
      }
    } catch {
      setHeroError("Could not read this video file.");
      return;
    }
    setHeroVideoFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const submitHeroVideo = async () => {
    if (!heroVideoFile) return;
    setHeroSaving(true);
    setHeroError("");
    setHeroSuccess(false);
    try {
      const fd = new FormData();
      fd.append("video", heroVideoFile);
      const { data } = await api.put("/settings/hero-video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // videos take longer to upload/process than the client's default timeout
      });
      setHeroVideoUrl(data.hero_video_url);
      setHeroVideoFile(null);
      setHeroPreview(null);
      setHeroSuccess(true);
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        setHeroError("The upload timed out, but it may have finished on the server — reload the page to check before retrying.");
      } else {
        setHeroError(err.response?.data?.error || "Upload failed");
      }
    } finally {
      setHeroSaving(false);
    }
  };

  // ─── Category image (1 per category) ──────────────────────
  const handleCategoryFile = async (slug: string, ratio: number, ratioLabel: string, file: File | null) => {
    setCategoryErrors((prev) => ({ ...prev, [slug]: "" }));
    setCategorySuccess((prev) => ({ ...prev, [slug]: false }));
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setCategoryErrors((prev) => ({ ...prev, [slug]: "Only jpg, png, or webp images are allowed." }));
      return;
    }
    if (file.size > MAX_CATEGORY_RAW_SIZE) {
      setCategoryErrors((prev) => ({ ...prev, [slug]: `Image must be 2MB or smaller (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB).` }));
      return;
    }
    try {
      const { w, h } = await readImageDims(file);
      const actual = w / h;
      if (Math.abs(actual - ratio) > RATIO_TOLERANCE) {
        setCategoryErrors((prev) => ({ ...prev, [slug]: `Image must be ${ratioLabel} — got ${w}x${h}.` }));
        return;
      }
    } catch {
      setCategoryErrors((prev) => ({ ...prev, [slug]: "Could not read this image." }));
      return;
    }
    setCategoryPendingFile((prev) => ({ ...prev, [slug]: file }));
    setCategoryPendingPreview((prev) => ({ ...prev, [slug]: URL.createObjectURL(file) }));
  };

  const submitCategoryImage = async (slug: string) => {
    const file = categoryPendingFile[slug];
    if (!file) return;
    setCategorySaving((prev) => ({ ...prev, [slug]: true }));
    setCategoryErrors((prev) => ({ ...prev, [slug]: "" }));
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.put(`/settings/category-images/${slug}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCategoryImages((prev) => ({ ...prev, [slug]: data.image_url }));
      setCategoryPendingFile((prev) => ({ ...prev, [slug]: null }));
      setCategoryPendingPreview((prev) => ({ ...prev, [slug]: null }));
      setCategorySuccess((prev) => ({ ...prev, [slug]: true }));
    } catch (err: any) {
      setCategoryErrors((prev) => ({ ...prev, [slug]: err.response?.data?.error || "Upload failed" }));
    } finally {
      setCategorySaving((prev) => ({ ...prev, [slug]: false }));
    }
  };

  // ─── About slideshow (up to 4, add/remove/reorder) ────────
  const handleAboutFile = async (file: File | null) => {
    setAboutError("");
    if (!file) return;
    if (aboutImages.length >= MAX_ABOUT_IMAGES) {
      setAboutError(`You can upload up to ${MAX_ABOUT_IMAGES} images. Remove one first.`);
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setAboutError("Only jpg, png, or webp images are allowed.");
      return;
    }
    if (file.size > MAX_ABOUT_RAW_SIZE) {
      setAboutError(`Image must be 2MB or smaller (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    try {
      const { w, h } = await readImageDims(file);
      const actual = w / h;
      if (Math.abs(actual - ABOUT_RATIO) > RATIO_TOLERANCE) {
        setAboutError(`Image must be ${ABOUT_RATIO_LABEL} — got ${w}x${h}.`);
        return;
      }
    } catch {
      setAboutError("Could not read this image.");
      return;
    }
    setAboutSaving(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/settings/about-images", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAboutImages((prev) => [...prev, { id: data.id, image_url: data.image_url }]);
    } catch (err: any) {
      setAboutError(err.response?.data?.error || "Upload failed");
    } finally {
      setAboutSaving(false);
    }
  };

  const removeAboutImage = async (id: number) => {
    const prevImages = aboutImages;
    setAboutImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await api.delete(`/settings/about-images/${id}`);
    } catch (err: any) {
      setAboutImages(prevImages);
      setAboutError(err.response?.data?.error || "Failed to remove image");
    }
  };

  const persistAboutOrder = async (reordered: AboutImage[]) => {
    setAboutImages(reordered);
    try {
      await api.put("/settings/about-images/reorder", { order: reordered.map((img) => img.id) });
    } catch (err: any) {
      setAboutError(err.response?.data?.error || "Failed to reorder images");
    }
  };

  const moveAboutImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= aboutImages.length) return;
    const reordered = [...aboutImages];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    persistAboutOrder(reordered);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && index !== dragOverIndex) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return; }
    const reordered = [...aboutImages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    persistAboutOrder(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
      <h1 className="text-2xl font-black mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
        Site Content
      </h1>

      {/* Hero video */}
      <section className="mb-12">
        <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
          Homepage Hero Video
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          .webm or .mp4, max 5MB, landscape orientation only (recommended size 2:1 aspect ratio). 
        </p>

        {(heroPreview || heroVideoUrl) && (
          <video src={heroPreview || getImageUrl(heroVideoUrl)} muted autoPlay loop playsInline
            className="w-full max-h-86 object-cover bg-black mb-4" />
        )}

        <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
          className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
          <Upload size={20} className="text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Click to upload a new hero video</span>
          <input type="file" accept="video/mp4,video/webm" className="hidden"
            onChange={(e) => handleHeroFile(e.target.files?.[0] || null)} />
        </motion.label>

        {heroError && <p className="text-red-500 text-xs mt-3">{heroError}</p>}
        {heroSuccess && <p className="text-green-600 text-xs mt-3">Hero video updated.</p>}

        {heroVideoFile && (
          <MotionButton type="button" onClick={submitHeroVideo} disabled={heroSaving}
            initial="rest" whileHover={heroSaving ? undefined : "hover"} whileTap={heroSaving ? undefined : tapScale}
            variants={submitButtonVariants}
            className="mt-4 text-primary-foreground py-3 px-8 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
            {heroSaving ? "Uploading…" : "Save Hero Video"}
          </MotionButton>
        )}
      </section>

      {/* Category images */}
      {CATEGORY_CONFIG.map((cat) => {
        const current = categoryImages[cat.slug];
        const preview = categoryPendingPreview[cat.slug];
        const error = categoryErrors[cat.slug];
        const success = categorySuccess[cat.slug];
        const saving = categorySaving[cat.slug];
        const hasPending = !!categoryPendingFile[cat.slug];

        return (
          <section key={cat.slug} className="mb-12">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
              {cat.label} — Shop by Category Image
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {cat.ratioLabel}, up to 2MB
            </p>

            {(preview || current) && (
              <div className={`h-40 max-w-full ${cat.ratio === 1 ? "aspect-square" : "aspect-[3/1]"} bg-muted overflow-hidden mb-4`}>
                <img src={preview || getImageUrl(current)} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
              className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
              <Upload size={20} className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Click to upload a new image</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => handleCategoryFile(cat.slug, cat.ratio, cat.ratioLabel, e.target.files?.[0] || null)} />
            </motion.label>

            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
            {success && <p className="text-green-600 text-xs mt-3">{cat.label} image updated.</p>}

            {hasPending && (
              <MotionButton type="button" onClick={() => submitCategoryImage(cat.slug)} disabled={saving}
                initial="rest" whileHover={saving ? undefined : "hover"} whileTap={saving ? undefined : tapScale}
                variants={submitButtonVariants}
                className="mt-4 text-primary-foreground py-3 px-8 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
                {saving ? "Uploading…" : `Save ${cat.label} Image`}
              </MotionButton>
            )}
          </section>
        );
      })}

      {/* About section slideshow */}
      <section className="mb-12">
        <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
          About Section Slideshow
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Up to {MAX_ABOUT_IMAGES} images. Drag to reorder, or use the arrows.
          Each image must be {ABOUT_RATIO_LABEL}, max 2MB.
        </p>

        {aboutImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {aboutImages.map((img, i) => (
              <div key={img.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-[3/2] bg-muted overflow-hidden group cursor-grab active:cursor-grabbing transition-opacity
                  ${dragIndex === i ? "opacity-40" : ""}
                  ${dragOverIndex === i && dragIndex !== null && dragIndex !== i ? "ring-2 ring-foreground" : ""}`}>
                <img src={getImageUrl(img.image_url)} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
                <MotionButton type="button" onClick={() => removeAboutImage(img.id)}
                  whileTap={tapScaleSm}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white">
                  <X size={12} />
                </MotionButton>
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <MotionButton type="button" onClick={() => moveAboutImage(i, -1)} disabled={i === 0}
                    whileTap={tapScaleSm}
                    className="w-6 h-6 flex items-center justify-center bg-black/60 text-white disabled:opacity-30">
                    <ChevronUp size={12} />
                  </MotionButton>
                  <MotionButton type="button" onClick={() => moveAboutImage(i, 1)} disabled={i === aboutImages.length - 1}
                    whileTap={tapScaleSm}
                    className="w-6 h-6 flex items-center justify-center bg-black/60 text-white disabled:opacity-30">
                    <ChevronDown size={12} />
                  </MotionButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {aboutImages.length < MAX_ABOUT_IMAGES && (
          <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
            className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
            <Upload size={20} className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">
              {aboutSaving ? "Uploading…" : `Click to add an image (${aboutImages.length}/${MAX_ABOUT_IMAGES})`}
            </span>
            <input type="file" accept="image/*" className="hidden" disabled={aboutSaving}
              onChange={(e) => handleAboutFile(e.target.files?.[0] || null)} />
          </motion.label>
        )}

        {aboutError && <p className="text-red-500 text-xs mt-3">{aboutError}</p>}
      </section>
    </div>
  );
}
