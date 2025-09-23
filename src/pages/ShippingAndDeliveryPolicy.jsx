import React from "react";
import { motion } from "framer-motion";

// Variants for reusable fade-in-up animation
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function ShippingAndDeliveryPolicy() {
  const policies = [
    {
      title: "1. Packaging",
      content: [
        "Each box of 12 Gir Kesar mangoes is carefully packed in premium, ventilated, eco-friendly cartons to ensure freshness.",
        "Organic products are packed in airtight, food-grade containers.",
      ],
    },
    {
      title: "2. Dispatch Timeline",
      content: [
        "Fresh mangoes are harvested and dispatched within 24 hours of order placement (during season).",
        "Organic products are usually dispatched within 24–48 hours.",
      ],
    },
    {
      title: "3. Delivery Coverage",
      content: [
        "Pan-India delivery through reputed courier partners (Bluedart, DTDC, Delhivery, etc.).",
        "Express shipping (2 days max) available for metro cities.",
      ],
    },
    {
      title: "4. Delivery Time",
      content: [
        "Metro Cities: 1–2 working days",
        "Tier-2 Cities: 2–3 working days",
        "Remote Areas: 3–5 working days",
      ],
    },
    {
      title: "5. Shipping Charges",
      content: [
        "Free shipping may be available during promotional periods.",
        "Standard packaging & courier charges are applied at checkout.",
      ],
    },
    {
      title: "6. Order Tracking",
      content: [
        "Customers receive real-time order tracking via SMS/Email/WhatsApp.",
      ],
    },
  ];

  return (
    <motion.div
      className="container py-8 md:py-12 font-sans"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeInUp}
    >
      {/* Page Heading */}
      <motion.h1
        className="syne-bold text-3xl md:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative"
        variants={fadeInUp}
      >
        Shipping & Delivery Policy
        <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
      </motion.h1>

      {/* Intro */}
      <motion.p
        className="ubuntu-regular text-center text-[#613d38] mb-10 max-w-3xl mx-auto"
        variants={fadeInUp}
      >
        At Vanveda, we take utmost care to ensure that your mangoes and organic
        products reach you in the freshest and safest condition. Please review
        our shipping and delivery policies below.
      </motion.p>

      {/* Policy Sections */}
      <div className="space-y-10">
        {policies.map((section, idx) => (
          <motion.section
            key={idx}
            className="bg-[#e7ce9d]/20 p-8 md:p-10 rounded-xl shadow-inner mx-6 md:mx-12"
            variants={fadeInUp}
          >
            <h2 className="syne-bold text-2xl mb-6 text-primary">
              {section.title}
            </h2>
            <div className="space-y-2 text-[#613d38] ubuntu-regular">
              {section.content.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </motion.div>
  );
}

export default ShippingAndDeliveryPolicy;
