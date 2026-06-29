// ═══════════════════════════════════════════════════════════
// PaymentSuccess.tsx
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import api from "@/lib/api";
import { MotionLink, ghostHoverVariants, tapScale } from "@/app/components/motion/primitives";

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const ref = params.get("ref") || params.get("reference") || "";
  const [status, setStatus] = useState<"verifying" | "paid" | "failed">("verifying");
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!ref) { setStatus("failed"); return; }
    api.get(`/payment/verify/${ref}`)
      .then(({ data }) => {
        setOrder(data.order);
        setStatus(data.status === "paid" ? "paid" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, [ref]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-widest uppercase animate-pulse">
          Confirming your payment…
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center">
          <span className="text-red-400 text-2xl">✕</span>
        </div>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>Payment not confirmed</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          We couldn't confirm your payment. If money was deducted, please contact us with reference: <strong>{ref}</strong>
        </p>
        <MotionLink to="/checkout" initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
          className="text-xs tracking-widest uppercase border border-foreground px-8 py-3 inline-block">
          Try Again
        </MotionLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center">
        <span className="text-foreground text-2xl">✓</span>
      </div>
      <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
        Order confirmed.
      </h1>
      <p className="text-muted-foreground text-sm">
        Thank you. Your order <strong>{order?.order_number}</strong> is being processed.
        A confirmation will be sent to {order?.email}.
      </p>
      <MotionLink to="/shop" initial="rest" whileHover="hover" whileTap={tapScale} variants={solidButtonVariants}
        className="flex items-center gap-2 text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold">
        Continue Shopping
      </MotionLink>
      {order?.user_id && (
        <MotionLink to="/account/orders" initial="rest" whileHover="hover" variants={ghostHoverVariants}
          className="text-xs underline underline-offset-2">
          View all orders
        </MotionLink>
      )}
    </div>
  );
}

export default PaymentSuccess;
