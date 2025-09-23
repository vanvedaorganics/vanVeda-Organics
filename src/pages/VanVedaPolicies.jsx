import React from "react";
import { motion } from "framer-motion";

// Variants for reusable fade-in-up animation
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function VanVedaPolicies() {
  const policies = [
    {
      title: "1. Product Authenticity",
      content: [
        "All our mangoes are sourced directly from our farms in Gir and are GI-certified.",
        "Our organic products (honey, ghee, jaggery, millets, spices) are naturally grown or ethically sourced.",
      ],
    },
    {
      title: "2. Orders & Payments",
      content: [
        "Orders can be placed through our official website.",
        "We accept payments via UPI, Net Banking, Credit/Debit Cards, and Wallets.",
        "Orders are confirmed only after successful payment.",
      ],
    },
    {
      title: "3. Shipping & Delivery",
      content: [
        "We currently deliver across India.",
        "Orders are shipped within 24–48 hours of harvest/dispatch.",
        "Delivery is usually within 2–4 working days depending on your location.",
        "Vanveda is not liable for delays caused by courier/logistics providers.",
      ],
    },
    {
      title: "4. Returns & Refunds",
      content: [
        "Since mangoes and most organic products are perishable, returns are not accepted.",
        "Refunds or replacements are only applicable in case of:",
        "• Damaged packaging on arrival (with photo proof within 24 hrs).",
        "• Spoiled/damaged products upon delivery.",
      ],
    },
    {
      title: "5. Use of Website",
      content: [
        "Content, photos, and logos on Vanveda’s website are our intellectual property.",
        "Unauthorized copying, resale, or misuse of content is strictly prohibited.",
      ],
    },
    {
      title: "6. Liability Disclaimer",
      content: [
        "We ensure the best quality products; however, natural variations in size, taste, and ripening are part of organic produce.",
        "Vanveda shall not be held liable for issues beyond its control (e.g., transport delays, weather impact on harvest).",
      ],
    },
    {
      title: "7. Policy Updates",
      content: [
        "Vanveda reserves the right to update or modify these terms at any time. Customers are advised to review them periodically.",
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
        VanVeda Policies
        <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
      </motion.h1>

      {/* Introduction */}
      <motion.p
        className="ubuntu-regular text-center text-[#613d38] mb-10 max-w-3xl mx-auto"
        variants={fadeInUp}
      >
        Welcome to Vanveda – a farm-to-home initiative bringing you authentic
        GI-certified Gir Kesar mangoes and premium organic products. By
        accessing or purchasing from our website, you agree to the following
        terms and conditions.
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
            <div className="space-y-3 text-[#613d38] ubuntu-regular">
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

export default VanVedaPolicies;
