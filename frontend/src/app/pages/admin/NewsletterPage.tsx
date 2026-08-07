import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import api from "@/lib/api";
import { Reveal } from "@/app/components/motion/Reveal";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { tapScaleSm } from "@/app/components/motion/primitives";

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

export default function AdminNewsletterPage() {
  useDocumentTitle("Admin · Newsletter");
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/admin/newsletter").then(({ data }) => setSubscribers(data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await api.get("/admin/newsletter/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "application/xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.xml`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>Newsletter</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">{subscribers.length} subscribed</p>
        </div>
        <motion.button
          onClick={handleDownload}
          disabled={downloading || !subscribers.length}
          initial="rest" whileHover="hover" whileTap={tapScaleSm}
          className="flex items-center justify-center gap-2 bg-foreground text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase font-semibold shrink-0 disabled:opacity-50">
          <Download size={14} /> {downloading ? "Preparing…" : "Download XML"}
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-secondary animate-pulse" />)}</div>
      ) : subscribers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscribers yet.</p>
      ) : (
        <Reveal>
          <div className="border border-border overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_180px] gap-4 px-5 py-3 border-b border-border bg-secondary">
                {["Email", "Subscribed"].map((h) => (
                  <p key={h} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>
              {subscribers.map((s) => (
                <motion.div key={s.email}
                  initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                  className="grid grid-cols-[1fr_180px] gap-4 px-5 py-3 border-b border-border last:border-0 items-center">
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  <p className="text-xs">
                    {new Date(s.subscribed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
