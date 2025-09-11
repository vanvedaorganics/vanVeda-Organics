import React from "react"
import { Button } from "./index"

const VideoShowcase = ({ src, title, description }) => {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-green-900/70 flex flex-col items-center justify-center text-center px-4 z-10">
        <h2 className="funnel-display-bold text-4xl md:text-5xl font-bold text-white font-serif mb-4 animate-fade-in">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-gray-100 max-w-3xl mb-8 animate-slide-up">
          {description}
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#E7CE9D] hover:bg-[#E7CE9D]/90 text-black text-sm py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 animate-slide-up delay-200"
        >
          <a href="/about-us">Learn More About Our Farms</a>
        </Button>
      </div>
    </section>
  )
}

export default VideoShowcase
