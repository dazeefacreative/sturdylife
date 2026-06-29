import { useState, useEffect } from "react";
import api from "@/lib/api";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, ghostHoverVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-50  text-yellow-700 border-yellow-200",
  paid:       "bg-green-50   text-green-700  border-green-200",
  processing: "bg-blue-50    text-blue-700   border-blue-200",
  shipped:    "bg-purple-50  text-purple-700 border-purple-200",
  delivered:  "bg-green-100  text-green-800  border-green-300",
  cancelled:  "bg-red-50     text-red-700    border-red-200",
  refunded:   "bg-gray-100   text-gray-600   border-gray-200",
};

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

const rowVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)" },
  hover: { backgroundColor: "var(--secondary)" },
};

export default function OrdersPage() {
  useDocumentTitle("My Orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />
      <div className="border-b border-border px-6 md:px-12 py-8">
        <div className="max-w-[1440px] mx-auto">
          <MotionLink to="/account" initial="rest" whileHover="hover" variants={ghostHoverVariants}
            className="text-[10px] tracking-widest uppercase mb-4 block">← Account</MotionLink>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
            My <em className="font-light italic">Orders</em>
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-secondary animate-pulse rounded" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-6">No orders yet.</p>
            <MotionLink to="/shop" initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
              className="text-xs tracking-widest uppercase border border-foreground px-8 py-3 inline-block">
              Start Shopping
            </MotionLink>
          </div>
        ) : (
          <Reveal>
            <div className="space-y-3">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_120px_120px_120px] gap-4 pb-3 border-b border-border">
                {["Order", "Date", "Total", "Status"].map((h) => (
                  <p key={h} className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold">{h}</p>
                ))}
              </div>

              {orders.map((order) => (
                <MotionLink key={order.id} to={`/account/orders/${order.order_number}`}
                  initial="rest" whileHover="hover" variants={rowVariants} transition={{ duration: 0.2 }}
                  className="grid md:grid-cols-[1fr_120px_120px_120px] gap-4 py-4 px-2 border-b border-border items-center cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                  </div>
                  <p className="text-sm text-muted-foreground font-light">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm font-semibold">₦{Number(order.total).toLocaleString()}</p>
                  <span className={`text-[10px] tracking-widest uppercase border px-2 py-1 w-fit font-medium ${STATUS_STYLES[order.status] || ""}`}>
                    {order.status}
                  </span>
                </MotionLink>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
