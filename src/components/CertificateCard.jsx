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
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative rounded-lg border border-[#d1cec7] bg-[#ffffff] text-[#330700] shadow-lg hover:shadow-xl transition-shadow duration-200 text-center overflow-hidden"
    >
      {/* Hover Overlay with Download Button */}
      {cert.file && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={handleDownload}
            className="bg-white text-[#2d1d1a] flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow hover:bg-gray-100"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center p-6 pb-4 box-border relative z-0">
        <div className="relative h-24 w-24 mb-4">
          <img
            src={cert.image || "/placeholder.svg"}
            alt={cert.name}
            className="h-full w-full object-contain"
          />
        </div>
        <h3 className="syne-bold text-xl text-[#2d1d1a]">{cert.name}</h3>
      </div>

      {/* Content */}
      <div className="p-6 pt-0 relative z-0">
        <p className="ubuntu-regular text-[#613d38] text-sm">
          {cert.description}
        </p>
      </div>
    </motion.div>
  );
};

export default CertificateCard;
