import { useState, useEffect } from "react";
import { useParams } from "react-router";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, ghostHoverVariants } from "@/app/components/motion/primitives";
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

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useDocumentTitle(order ? `Order ${order.order_number}` : "Order");

  useEffect(() => {
    api.get(`/orders/${orderNumber}`)
      .then(({ data }) => setOrder(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />
      <div className="border-b border-border px-6 md:px-12 py-8">
        <div className="max-w-[1440px] mx-auto">
          <MotionLink to="/account/orders" initial="rest" whileHover="hover" variants={ghostHoverVariants}
            className="text-[10px] tracking-widest uppercase mb-4 block">← My Orders</MotionLink>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
            Order <em className="font-light italic">{order?.order_number || ""}</em>
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-secondary animate-pulse rounded" />)}
          </div>
        ) : notFound || !order ? (
          <p className="text-muted-foreground text-sm">Order not found.</p>
        ) : (
          <Reveal>
            <div className="grid md:grid-cols-[1fr_360px] gap-12">
              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-[10px] tracking-widest uppercase border px-2 py-1 w-fit font-medium ${STATUS_STYLES[order.status] || ""}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Placed {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="space-y-6">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-5 border-b border-border pb-6">
                      <div className="w-20 h-28 bg-secondary overflow-hidden shrink-0">
                        <img src={getImageUrl(item.product_image) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"}
                          alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.product_name}</p>
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">
                          {item.size && `Size ${item.size}`} {item.size && "·"} Qty {item.quantity}
                        </p>
                        <p className="text-sm font-semibold mt-2">₦{Number(item.subtotal).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <aside className="h-fit bg-secondary p-6">
                <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₦{Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>{Number(order.shipping_fee) === 0 ? <span className="text-foreground">Free</span> : `₦${Number(order.shipping_fee).toLocaleString()}`}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>₦{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-1">
                  <h3 className="text-[10px] tracking-widest uppercase font-bold mb-2">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">{order.first_name} {order.last_name}</p>
                  <p className="text-sm text-muted-foreground">{order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{order.city}, {order.state}, {order.country}</p>
                  {order.phone && <p className="text-sm text-muted-foreground">{order.phone}</p>}
                </div>
              </aside>
            </div>
          </Reveal>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
