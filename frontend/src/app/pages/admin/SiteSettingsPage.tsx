import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionButton, tapScale } from "@/app/components/motion/primitives";
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
const MAX_IMAGE_SIZE = 200 * 1024;
const RATIO_TOLERANCE = 0.08;

const CATEGORY_CONFIG = [
  { slug: "hoodies", label: "Hoodies", ratio: 1, ratioLabel: "square (1:1)" },
  { slug: "beanie-caps", label: "Beanie Caps", ratio: 3, ratioLabel: "wide banner (3:1)" },
  { slug: "shirts", label: "Shirts", ratio: 3, ratioLabel: "wide banner (3:1)" },
];

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

  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroError, setHeroError] = useState("");
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);

  const [categoryImages, setCategoryImages] = useState<Record<string, string[]>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string[]>>({});
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [categorySuccess, setCategorySuccess] = useState<Record<string, boolean>>({});
  const [categorySaving, setCategorySaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setHeroVideoUrl(data.hero_video_url || null);
        setCategoryImages(data.categoryImages || {});
      })
      .finally(() => setLoading(false));
  }, []);

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
      const { data } = await api.put("/settings/hero-video", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setHeroVideoUrl(data.hero_video_url);
      setHeroVideoFile(null);
      setHeroPreview(null);
      setHeroSuccess(true);
    } catch (err: any) {
      setHeroError(err.response?.data?.error || "Upload failed");
    } finally {
      setHeroSaving(false);
    }
  };

  const handleCategoryFiles = async (slug: string, ratio: number, ratioLabel: string, files: FileList | null) => {
    setCategoryErrors((prev) => ({ ...prev, [slug]: "" }));
    setCategorySuccess((prev) => ({ ...prev, [slug]: false }));
    if (!files || !files.length) return;

    const arr = Array.from(files);
    if (arr.length !== 3) {
      setCategoryErrors((prev) => ({ ...prev, [slug]: "Select exactly 3 images." }));
      return;
    }
    for (const file of arr) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setCategoryErrors((prev) => ({ ...prev, [slug]: "Only jpg, png, or webp images are allowed." }));
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setCategoryErrors((prev) => ({ ...prev, [slug]: `Each image must be 200KB or smaller (${file.name} is ${(file.size / 1024).toFixed(0)}KB).` }));
        return;
      }
    }
    try {
      for (const file of arr) {
        const { w, h } = await readImageDims(file);
        const actual = w / h;
        if (Math.abs(actual - ratio) > RATIO_TOLERANCE) {
          setCategoryErrors((prev) => ({ ...prev, [slug]: `${file.name} must be ${ratioLabel} — got ${w}x${h}.` }));
          return;
        }
      }
    } catch {
      setCategoryErrors((prev) => ({ ...prev, [slug]: "Could not read one of the images." }));
      return;
    }
    setPendingFiles((prev) => ({ ...prev, [slug]: arr }));
    setPendingPreviews((prev) => ({ ...prev, [slug]: arr.map((f) => URL.createObjectURL(f)) }));
  };

  const submitCategoryImages = async (slug: string) => {
    const files = pendingFiles[slug];
    if (!files || files.length !== 3) return;
    setCategorySaving((prev) => ({ ...prev, [slug]: true }));
    setCategoryErrors((prev) => ({ ...prev, [slug]: "" }));
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const { data } = await api.put(`/settings/category-images/${slug}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCategoryImages((prev) => ({ ...prev, [slug]: data.images }));
      setPendingFiles((prev) => ({ ...prev, [slug]: [] }));
      setPendingPreviews((prev) => ({ ...prev, [slug]: [] }));
      setCategorySuccess((prev) => ({ ...prev, [slug]: true }));
    } catch (err: any) {
      setCategoryErrors((prev) => ({ ...prev, [slug]: err.response?.data?.error || "Upload failed" }));
    } finally {
      setCategorySaving((prev) => ({ ...prev, [slug]: false }));
    }
  };

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
          .webm or .mp4, max 5MB, landscape orientation only.
        </p>

        {(heroPreview || heroVideoUrl) && (
          <video src={heroPreview || getImageUrl(heroVideoUrl)} muted autoPlay loop playsInline
            className="w-full max-h-64 object-cover bg-black mb-4" />
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

      {/* Category slideshow images */}
      {CATEGORY_CONFIG.map((cat) => {
        const current = categoryImages[cat.slug] || [];
        const previews = pendingPreviews[cat.slug] || [];
        const error = categoryErrors[cat.slug];
        const success = categorySuccess[cat.slug];
        const saving = categorySaving[cat.slug];
        const hasPending = (pendingFiles[cat.slug]?.length || 0) === 3;

        return (
          <section key={cat.slug} className="mb-12">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
              {cat.label} — Shop by Category Slideshow
            </h2>
            <p className="text-xs text-muted-foreground mb-1">
              Upload exactly 3 images, each {cat.ratioLabel}, max 200KB. They auto-rotate every 3 seconds on the homepage.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Tip: images with a dark background display best in this section.
            </p>

            {current.length > 0 && previews.length === 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {current.map((url) => (
                  <div key={url} className="relative aspect-square bg-muted overflow-hidden">
                    <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
              className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
              <Upload size={20} className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Click to select 3 images</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleCategoryFiles(cat.slug, cat.ratio, cat.ratioLabel, e.target.files)} />
            </motion.label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square bg-muted overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
            {success && <p className="text-green-600 text-xs mt-3">{cat.label} images updated.</p>}

            {hasPending && (
              <MotionButton type="button" onClick={() => submitCategoryImages(cat.slug)} disabled={saving}
                initial="rest" whileHover={saving ? undefined : "hover"} whileTap={saving ? undefined : tapScale}
                variants={submitButtonVariants}
                className="mt-4 text-primary-foreground py-3 px-8 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
                {saving ? "Uploading…" : `Save ${cat.label} Images`}
              </MotionButton>
            )}
          </section>
        );
      })}
    </div>
  );
}
