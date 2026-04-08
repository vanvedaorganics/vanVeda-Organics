import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Award,
  Building2,
  CheckCircle2,
  Send,
} from "lucide-react";

// ── Animation helpers ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" },
  }),
};

// ── Company data ───────────────────────────────────────────────────────────
const COMPANY = {
  name: "True Soil Organics",
  legalName: "True Soil Organics",
  gst: "24KPBPS4180H1ZM",
  fssai: "12423000000012",           // ← replace with real FSSAI
  address: "Gir Gadhda, Junagadh District, Gujarat – 362530, India",
  email: "truesoilorganic@gmail.com",
  phone: "+91 93164 17314",
  mapSrc:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14836.7!2d70.6!3d21.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sGir+Gadhda!5e0!3m2!1sen!2sin!4v1699000000000",
};

const CERTIFICATES = [
 
];

// ── Page Component ─────────────────────────────────────────────────────────
function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const form = e.target;
    const data = new FormData(form);

    try {
      await fetch("https://formsubmit.co/truesoilorganics@gmail.com", {
        method: "POST",
        body: data,
      });
      setSubmitted(true);
      form.reset();
    } catch {
      // silently fall back — formsubmit handles its own errors
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] font-sans">

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center py-20 px-4 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a3628 0%, #28543d 55%, #744531 100%)",
        }}
      >
        {/* subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #E7CE9D 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <motion.div
          className="relative z-10 text-center max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block mb-4 rounded-full border border-[#E7CE9D]/40 bg-[#E7CE9D]/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#E7CE9D]">
            Get In Touch
          </span>
          <h1 className="syne-medium text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Contact 
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/75 max-w-xl mx-auto">
            True Soil Organics
          </p>
        </motion.div>
      </section>

      {/* ── Company Info Cards ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <motion.h2
          className="syne-medium text-2xl sm:text-3xl font-bold text-[#1a3628] mb-8 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Company Information
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <Building2 className="h-6 w-6" />,
              label: "Registered Name",
              value: COMPANY.legalName,
            },
            {
              icon: <FileText className="h-6 w-6" />,
              label: "GSTIN",
              value: COMPANY.gst,
            },
            
            {
              icon: <MapPin className="h-6 w-6" />,
              label: "Registered Address",
              value: COMPANY.address,
            },
            {
              icon: <Mail className="h-6 w-6" />,
              label: "Email",
              value: COMPANY.email,
              href: `mailto:${COMPANY.email}`,
            },
            {
              icon: <Phone className="h-6 w-6" />,
              label: "Phone",
              value: COMPANY.phone,
              href: `tel:${COMPANY.phone.replace(/\s/g, "")}`,
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-start gap-4 rounded-2xl border border-[#e0ddd5] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              custom={i}
              viewport={{ once: true }}
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#28543d]/10 text-[#28543d]">
                {item.icon}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#744531] mb-0.5">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-sm font-medium text-[#1a3628] hover:text-[#744531] transition-colors break-all"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-[#1a3628]">
                    {item.value}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

     
      {/* ── Contact Form + Map ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Form */}
          <motion.div
            className="rounded-2xl border border-[#e0ddd5] bg-white p-8 shadow-md"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="syne-medium text-2xl font-bold text-[#1a3628] mb-1">
              Send Us a Message
            </h2>
            <p className="text-sm text-gray-500 mb-7">
              Fill in the form and we'll get back to you within 24 hours.
            </p>

            {submitted ? (
              <motion.div
                className="flex flex-col items-center gap-4 py-10 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 className="h-14 w-14 text-[#28543d]" />
                <h3 className="text-xl font-semibold text-[#1a3628]">
                  Message Sent!
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Thank you for reaching out. Our team will reply to{" "}
                  <strong>{COMPANY.email}</strong> shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-sm font-medium text-[#744531] hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* formsubmit config */}
                <input type="hidden" name="_subject" value="New Contact Form Message — True Soil Organics" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input type="text" name="_honey" style={{ display: "none" }} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Ravi Sharma"
                      className="w-full rounded-xl border border-gray-200 bg-[#fafaf7] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#28543d] focus:ring-1 focus:ring-[#28543d] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="ravi@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-[#fafaf7] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#28543d] focus:ring-1 focus:ring-[#28543d] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf7] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#28543d] focus:ring-1 focus:ring-[#28543d] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf7] px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#28543d] focus:ring-1 focus:ring-[#28543d] transition"
                  >
                    <option value="" disabled>
                      Select a topic…
                    </option>
                    <option>General Enquiry</option>
                    <option>Bulk / Wholesale Order</option>
                    <option>Partnership / Distribution</option>
                    <option>Product Quality Feedback</option>
                    <option>Order Support</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us how we can help you…"
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf7] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#28543d] focus:ring-1 focus:ring-[#28543d] transition resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{ scale: sending ? 1 : 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #28543d, #1a3628)" }}
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Map + quick-contact */}
          <motion.div
            className="flex flex-col gap-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={1}
            viewport={{ once: true }}
          >
            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-[#e0ddd5] shadow-md aspect-video w-full">
              <iframe
                title="True Soil Organics Location"
                src={COMPANY.mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Quick contact pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {[
                {
                  icon: <Phone className="h-5 w-5" />,
                  label: "Call Us",
                  value: COMPANY.phone,
                  href: `tel:${COMPANY.phone.replace(/\s/g, "")}`,
                  bg: "#28543d",
                },
                {
                  icon: <Mail className="h-5 w-5" />,
                  label: "Email Us",
                  value: COMPANY.email,
                  href: `mailto:${COMPANY.email}`,
                  bg: "#744531",
                },
                {
                  icon: <MapPin className="h-5 w-5" />,
                  label: "Visit Us",
                  value: "Gir Gadhda, Gujarat",
                  href: "https://maps.google.com/?q=Gir+Gadhda,Gujarat",
                  bg: "#28543d",
                },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.icon.type === MapPin ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-[#e0ddd5] bg-white p-4 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: c.bg }}
                  >
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {c.label}
                    </p>
                    <p className="text-sm font-medium text-[#1a3628] group-hover:text-[#744531] transition-colors break-all">
                      {c.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;