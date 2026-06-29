import { Outlet, NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { MotionButton, tapScaleSm } from "@/app/components/motion/primitives";

const nav = [
  { to: "/admin",           label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products",  label: "Products",  icon: Package },
  { to: "/admin/orders",    label: "Orders",    icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
];

const itemRestInactive = { backgroundColor: "rgba(0,0,0,0)", color: "var(--muted-foreground)" };
const itemHoverInactive = { backgroundColor: "var(--secondary)", color: "#0a0a0a" };
const itemActive = { backgroundColor: "var(--foreground)", color: "var(--primary-foreground)" };

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col py-8 px-4">
        <div className="mb-10 px-2">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Sturdy Life</p>
          <p className="text-xs font-bold tracking-wide uppercase">Admin</p>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="block">
              {({ isActive }) => (
                <motion.div
                  initial={false}
                  animate={isActive ? itemActive : itemRestInactive}
                  whileHover={isActive ? undefined : itemHoverInactive}
                  whileTap={tapScaleSm}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest uppercase">
                  <Icon size={14} strokeWidth={1.5} /> {label}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
        <MotionButton onClick={() => { logout(); navigate("/"); }}
          initial="rest" whileHover="hover" whileTap={tapScaleSm}
          variants={{ rest: { color: "var(--muted-foreground)" }, hover: { color: "#0a0a0a" } }}
          className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest uppercase">
          <LogOut size={14} strokeWidth={1.5} /> Sign Out
        </MotionButton>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
