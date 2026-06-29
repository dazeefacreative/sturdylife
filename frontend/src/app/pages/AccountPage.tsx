import { useNavigate } from "react-router";
import { User, ShoppingBag, Heart, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, MotionButton, ghostHoverVariants, tapScaleSm } from "@/app/components/motion/primitives";

const cardVariants = {
  rest: { borderColor: "var(--border)" },
  hover: { borderColor: "var(--action-border)" },
};

const iconVariants = {
  rest: { color: "var(--muted-foreground)" },
  hover: { color: "#0a0a0a" },
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />
      <div className="border-b border-border px-6 md:px-12 py-8">
        <div className="max-w-[1440px] mx-auto">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2">My Account</p>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
            Hello, <em className="font-light italic">{user?.first_name}.</em>
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        <Reveal>
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl">
            {[
              { icon: ShoppingBag, label: "My Orders",  sub: "Track and manage orders",  to: "/account/orders" },
              { icon: Heart,       label: "Wishlist",    sub: "Saved items",              to: "/account/wishlist" },
              { icon: User,        label: "Profile",     sub: "Edit your details",        to: "/account/profile" },
            ].map(({ icon: Icon, label, sub, to }) => (
              <MotionLink key={label} to={to}
                initial="rest" whileHover="hover" whileTap={tapScaleSm}
                variants={cardVariants}
                className="border p-6">
                <motion.div variants={iconVariants} className="mb-4">
                  <Icon size={20} strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-sm font-bold tracking-wide uppercase mb-1">{label}</h3>
                <p className="text-xs text-muted-foreground font-light">{sub}</p>
              </MotionLink>
            ))}
          </div>
        </Reveal>

        <MotionButton onClick={handleLogout}
          initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
          className="flex items-center gap-2 text-xs tracking-widest uppercase mt-10">
          <LogOut size={14} /> Sign out
        </MotionButton>
      </div>

      <SiteFooter />
    </div>
  );
}
