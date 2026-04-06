import React from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

const CertificateCard = ({ cert }) => {
  const handleDownload = () => {
    if (cert.file) {
      const link = document.createElement("a");
      link.href = cert.file;
      link.download = cert.name || "certificate";
      link.target = "_blank";
      link.click();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative rounded-2xl border border-[#E7CE9D]/30 bg-white text-[#1a2e1a] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Hover Overlay with Download Button */}
      {cert.file && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={handleDownload}
            className="bg-white text-[#744531] flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-[#E7CE9D] hover:scale-105 transition-all"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center p-6 pb-4">
        <div className="relative h-24 w-24 mb-4">
          <img
            src={cert.image || "/placeholder.svg"}
            alt={cert.name}
            className="h-full w-full object-contain"
          />
        </div>
        <h3 className="syne-bold text-xl text-[#744531]">{cert.name}</h3>
      </div>

      {/* Content */}
      <div className="p-6 pt-0 flex-grow flex items-center">
        <p className="ubuntu-regular text-[#613d38] text-sm text-center">
          {cert.description}
        </p>
      </div>
    </motion.div>
  );
};

export default CertificateCard;
