import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { MotionLink, MotionButton, ghostHoverVariants, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const solidButtonVariants = {
  rest: { backgroundColor: "#0a0a0a" },
  hover: { backgroundColor: "rgba(10,10,10,0.8)" },
};

export default function ProfilePage() {
  useDocumentTitle("My Profile");
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const setProfileField = (field: string, value: string) =>
    setProfileForm((prev) => ({ ...prev, [field]: value }));

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      await updateProfile(profileForm);
      setProfileSaved(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Could not update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSaved(false);
    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordSaved(true);
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Could not change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputCls = "w-full border-b border-foreground bg-transparent py-3 text-[16px] md:text-sm placeholder:text-muted-foreground focus:outline-none font-light";

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />

      <div className="border-b border-border px-6 md:px-12 py-8">
        <div className="max-w-[1440px] mx-auto">
          <MotionLink to="/account" initial="rest" whileHover="hover" variants={ghostHoverVariants}
            className="text-[10px] tracking-widest uppercase mb-4 block">← Account</MotionLink>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
            My <em className="font-light italic">Profile</em>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-2 gap-16">
        {/* Profile details */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6 border-b border-border pb-3">
            Personal Details
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="First name" value={profileForm.first_name}
                onChange={(e) => setProfileField("first_name", e.target.value)} className={inputCls} />
              <input required placeholder="Last name" value={profileForm.last_name}
                onChange={(e) => setProfileField("last_name", e.target.value)} className={inputCls} />
            </div>
            <input disabled value={user?.email || ""}
              className={`${inputCls} opacity-50 cursor-not-allowed`} />
            <input placeholder="Phone" value={profileForm.phone}
              onChange={(e) => setProfileField("phone", e.target.value)} className={inputCls} />

            {profileError && <p className="text-red-500 text-xs">{profileError}</p>}
            {profileSaved && <p className="text-xs">Profile updated.</p>}

            <MotionButton type="submit" disabled={profileSaving}
              initial="rest" whileHover={profileSaving ? undefined : "hover"} whileTap={profileSaving ? undefined : tapScale}
              variants={solidButtonVariants}
              className="flex items-center justify-center gap-3 text-white px-8 py-3 text-xs tracking-widest uppercase font-semibold disabled:opacity-50 w-fit">
              {profileSaving ? "Saving..." : "Save Changes"} <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
            </MotionButton>
          </form>
        </section>

        {/* Password */}
        <section>
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6 border-b border-border pb-3">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <input required type="password" placeholder="Current password" value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))} className={inputCls} />
            <input required type="password" placeholder="New password (min 8 chars)" minLength={8} value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))} className={inputCls} />

            {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
            {passwordSaved && <p className="text-xs">Password changed.</p>}

            <MotionButton type="submit" disabled={passwordSaving}
              initial="rest" whileHover={passwordSaving ? undefined : "hover"} whileTap={passwordSaving ? undefined : tapScale}
              variants={solidButtonVariants}
              className="flex items-center justify-center gap-3 text-white px-8 py-3 text-xs tracking-widest uppercase font-semibold disabled:opacity-50 w-fit">
              {passwordSaving ? "Updating..." : "Update Password"} <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={12} /></motion.span>
            </MotionButton>
          </form>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
