import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionLink, MotionButton, fadeHoverVariants, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/account";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border-b border-foreground bg-transparent py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors font-light";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Left image panel */}
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-muted">
        <img src="https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=900&h=1200&fit=crop&auto=format"
          alt="" className="absolute inset-0 w-full h-full object-cover grayscale" />
        <div className="absolute inset-0 bg-black/30" />
        <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants}
          className="absolute top-8 left-8 text-white text-xs tracking-widest uppercase">
          ← Sturdy Life
        </MotionLink>
      </div>

      {/* Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <MotionLink to="/" initial="rest" whileHover="hover" variants={fadeHoverVariants}
            className="md:hidden text-xs tracking-widest uppercase text-muted-foreground mb-10 block">
            ← Sturdy Life
          </MotionLink>
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-3">Welcome back</p>
          <h1 className="text-3xl font-black mb-10" style={{ fontFamily: "'Fraunces', serif" }}>
            Sign <em className="font-light italic">in.</em>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="email" placeholder="Email address" required value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            <input type="password" placeholder="Password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputCls} />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <MotionButton type="submit" disabled={loading}
              initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
              variants={solidButtonVariants}
              className="w-full flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
              {loading ? "Signing in…" : <>Sign In <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span></>}
            </MotionButton>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Don't have an account?{" "}
            <MotionLink to="/register" initial="rest" whileHover="hover" variants={fadeHoverVariants}
              className="text-foreground underline underline-offset-2">Create one</MotionLink>
          </p>
        </div>
      </div>
    </div>
  );
}
