import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionLink, MotionButton, fadeHoverVariants, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

export default function RegisterPage() {
  useDocumentTitle("Create Account");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", phone: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(form);
      navigate("/account");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border-b border-foreground bg-transparent py-3 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none transition-colors font-light";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-muted">
        <img src="https://images.unsplash.com/photo-1520975954732-35dd22299614?w=900&h=1200&fit=crop&auto=format"
          alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants}
          className="absolute top-8 left-8 text-white text-xs tracking-widest uppercase">← Sturdy Life</MotionLink>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">Join Sturdy Life</p>
          <h1 className="text-3xl font-black mb-10" style={{ fontFamily: "'Fraunces', serif" }}>
            Create <em className="font-light italic">account.</em>
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="First name" value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
              <input required placeholder="Last name" value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)} className={inputCls} />
            </div>
            <input required type="email" placeholder="Email address" value={form.email}
              onChange={(e) => set("email", e.target.value)} className={inputCls} />
            <input placeholder="Phone (optional)" value={form.phone}
              onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            <input required type="password" placeholder="Password (min 8 chars)" minLength={8} value={form.password}
              onChange={(e) => set("password", e.target.value)} className={inputCls} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <MotionButton type="submit" disabled={loading}
              initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
              variants={solidButtonVariants}
              className="w-full flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
              {loading ? "Creating…" : <>Create Account <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span></>}
            </MotionButton>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-8">
            Already have an account?{" "}
            <MotionLink to="/login" initial="rest" whileHover="hover" variants={fadeHoverVariants}
              className="text-foreground underline underline-offset-2">Sign in</MotionLink>
          </p>
        </div>
      </div>
    </div>
  );
}
