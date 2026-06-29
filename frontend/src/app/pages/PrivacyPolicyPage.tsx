import { StaticInfoPage } from "@/app/components/layout/StaticInfoPage";

export default function PrivacyPolicyPage() {
  return (
    <StaticInfoPage
      title="Privacy Policy"
      description="How Sturdy Life collects, uses, and protects your personal information."
      sections={[
        {
          heading: "Information We Collect",
          body: (
            <>
              <p>When you create an account, place an order, or contact us, we collect information like your name, email, phone number, and shipping address.</p>
              <p>We don't store your card details — payments are processed securely by Paystack, and we never see or save your card number.</p>
            </>
          ),
        },
        {
          heading: "How We Use Your Information",
          body: (
            <>
              <p>To process and deliver your orders, communicate with you about your account or orders, and improve our products and service.</p>
              <p>If you subscribe to our newsletter, we'll use your email to send occasional updates — you can unsubscribe at any time.</p>
            </>
          ),
        },
        {
          heading: "Sharing Your Information",
          body: <p>We don't sell your personal information. We only share what's necessary with service providers who help us operate — payment processing (Paystack) and order fulfillment.</p>,
        },
        {
          heading: "Your Rights",
          body: <p>You can view and update your personal details anytime from My Account → Profile, or contact us to request that we delete your data.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions about this policy? Reach us at <a href="mailto:sturdylifer@outlook.com" className="underline underline-offset-2">sturdylifer@outlook.com</a>.</p>,
        },
      ]}
    />
  );
}
