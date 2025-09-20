import React from "react";
import { CertificateCard } from "../components";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

// Reusable fade-in-up variant
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const certifications = [
  {
    id: 1,
    name: "USDA Organic",
    description:
      "Certified organic products grown without synthetic fertilizers or pesticides.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/USDA_organic_seal.svg/240px-USDA_organic_seal.svg.png",
    file: "/files/usda-organic.pdf",
  },
  {
    id: 2,
    name: "FSSAI Certified",
    description:
      "Approved by the Food Safety and Standards Authority of India for safe consumption.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/FSSAI.svg/2560px-FSSAI.svg.png",
    file: "/files/fssai-certification.png",
  },
  {
    id: 3,
    name: "ISO 22000",
    description:
      "Food safety management system certification ensuring global quality standards.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/ISO_Logo.svg/320px-ISO_Logo.svg.png",
    file: "/files/iso22000.pdf",
  },
  {
    id: 4,
    name: "India Organic",
    description:
      "Government of India certification for organically produced products.",
    image:
      "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/India_organic.svg/1200px-India_organic.svg.png",
    file: "/files/india-organic.jpg",
  },
];

function Certificates() {
  return (
    <motion.div
      className="w-full bg-[#fafafa]"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeInUp}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Heading */}
        <motion.h1
          className="syne-bold text-3xl md:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative"
          variants={fadeInUp}
        >
          Our Certifications
          <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
        </motion.h1>

        {/* Certification Cards */}
        <motion.section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={fadeInUp}
        >
          {certifications.map((cert) => (
            <motion.div key={cert.id} variants={fadeInUp}>
              <CertificateCard cert={cert} />
            </motion.div>
          ))}
        </motion.section>

        {/* Why Certifications Matter */}
        <motion.section
          className="bg-[#e7ce9d]/20 p-8 rounded-lg shadow-inner text-center mb-16"
          variants={fadeInUp}
        >
          <h2 className="text-3xl syne-bold text-[#2d1d1a] mb-4">
            Why Certifications Matter
          </h2>
          <p className="text-[#613d38] ubuntu-regular mb-6 max-w-3xl mx-auto">
            Organic certifications are your assurance that products have been
            produced using methods that comply with organic standards. This
            means no synthetic pesticides, herbicides, GMOs, or artificial
            fertilizers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Guaranteed Purity",
                desc: "Ensures products are free from harmful chemicals.",
              },
              {
                title: "Environmental Stewardship",
                desc: "Supports sustainable farming practices.",
              },
              {
                title: "Consumer Trust",
                desc: "Provides confidence in your organic choices.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="space-y-3 p-6"
                variants={fadeInUp}
              >
                <CheckCircle className="h-10 w-10 text-[#69a72a] mx-auto" />
                <h3 className="text-xl syne-bold text-[#201413]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#613d38] ubuntu-regular">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

export default Certificates;
