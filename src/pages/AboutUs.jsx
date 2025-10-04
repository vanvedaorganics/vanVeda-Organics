import React from "react";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

// Variants for reusable fade-in-up animation
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function AboutUs() {
  return (
    <motion.div
      className="max-w-7xl mx-auto py-8 lg:py-12 font-sans px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeInUp}
    >
      {/* Page Heading */}
      <motion.h1
        className="syne-bold text-3xl lg:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative"
        variants={fadeInUp}
      >
        About Van Veda Organics
        <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
      </motion.h1>

      {/* Section 1 */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 px-4 sm:px-6 lg:px-10"
        variants={fadeInUp}
      >
        <div className="relative h-56 lg:h-96 w-full rounded-xl lg:rounded-xl overflow-hidden shadow-xl group">
          <img
            src="/ImageShowcase.jpg"
            alt="Photo Here"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
          />
        </div>
        <div className="space-y-6 text-foreground">
          <h2 className="syne-bold text-3xl leading-tight text-primary hover:underline underline-offset-4 decoration-[#69a72a] transition duration-300">
            From Our Farms To Your Home
          </h2>
          <p className="ubuntu-regular text-lg leading-relaxed text-[#613d38]">
            At Vanveda, we believe that real taste comes straight from the soil.
            For years, our family has been cultivating Gir Kesar Mangoes in the
            fertile lands of Gir. What started as a traditional farming practice
            has now grown into a vision to deliver the same authentic farm-fresh
            goodness to homes across India.
          </p>
          <h2 className="syne-bold text-3xl leading-tight text-primary hover:underline underline-offset-4 decoration-[#69a72a] transition duration-300">
            Celebrating Farmer's Life
          </h2>
          <p className="ubuntu-regular text-lg leading-relaxed text-[#613d38]">
            We are not just a brand, we are farmers first. Behind every mango,
            every organic product, there's a story of early mornings in the
            orchards, careful nurturing of trees, and a deep respect for the
            land. By choosing Vanveda, you're not only enjoying premium produce,
            but also supporting farmer families and helping us preserve age-old
            farming traditions.
          </p>
        </div>
      </motion.section>

      {/* Section 2 */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 px-4 sm:px-6 lg:px-10"
        variants={fadeInUp}
      >
        <div className="space-y-6 text-foreground order-2 lg:order-1">
          <h2 className="syne-bold text-3xl leading-tight text-primary hover:underline underline-offset-4 decoration-[#69a72a] transition duration-300">
            The Lands Of Gir
          </h2>
          <p className="ubuntu-regular text-lg leading-relaxed text-[#613d38]">
            Our mangoes are grown in the unique ecosystem of Gir, Gujarat home
            to the Asiatic Lion and famous for its GI tagged Kesar Mango. The
            red soil, perfect sunlight, and pure water of this region give the
            mango its saffron like pulp, unmatched aroma, and natural sweetness.
            This is why the Gir Kesar Mango cannot be replicated anywhere else
            in the world.
          </p>
          <h2 className="syne-bold text-3xl leading-tight text-primary hover:underline underline-offset-4 decoration-[#69a72a] transition duration-300">
            From Local To Digital
          </h2>
          <p className="ubuntu-regular text-lg leading-relaxed text-[#613d38]">
            For years, we sold our mangoes offline to loyal customers who
            trusted our quality. Now, with Vanveda, we are bringing this
            experience online so whether you're in Ahmedabad, Mumbai, Delhi, or
            Bangalore, you can enjoy the taste of authentic Gir Kesar Mangoes,
            delivered right to your doorstep in just 2-4 days. And this is just
            the beginning. Along with mangoes, we will soon introduce organic
            jaggery, honey, ghee, atta, millets, spices, and sauces all
            carefully sourced and produced, staying true to our farm-to-home
            philosophy.
          </p>
        </div>
        <div className="relative h-56 lg:h-96 w-full rounded-xl lg:rounded-xl overflow-hidden shadow-xl group order-1 lg:order-2">
          <img
            src="/Farm.jpg"
            alt="Photo Here"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-1"
          />
        </div>
      </motion.section>

      {/* Our Promise */}
      <motion.section
        className="bg-[#e7ce9d]/20 p-6 sm:p-8 lg:p-10 rounded-xl shadow-inner text-center mt-16 mx-3 sm:mx-6 lg:mx-16"
        variants={fadeInUp}
      >
        <h2 className="syne-bold text-3xl text-[#2d1d1a] mb-4 relative inline-block">
          Our Promise
          <span className="absolute left-0 bottom-0 w-0 h-1 bg-[#69a72a] transition-all duration-500 group-hover:w-full"></span>
        </h2>
        <p className="ubuntu-regular text-[#613d38] mb-8 max-w-3xl mx-auto">
          We are driven by a commitment to purity, sustainability, and
          community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Purity & Authentic",
              desc: "Delivering organic products, free from harmful additives and chemicals.",
            },
            {
              title: "Farm Fresh",
              desc: "Promoting eco-friendly farming practices that nurture the earth and its resources.",
            },
            {
              title: "From The Heart Of Gir",
              desc: "Bringing You Organic Farm Produced Products Straight From The Heart Of Gir",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="space-y-3 p-6 rounded-xl bg-white/50 shadow-md hover:shadow-xl hover:-translate-y-2 transform transition duration-500"
              variants={fadeInUp}
            >
              <CheckCircle className="h-10 w-10 text-[#69a72a] mx-auto" />
              <h3 className="syne-bold text-xl text-[#201413]">{item.title}</h3>
              <p className="ubuntu-regular text-sm text-[#613d38]">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

export default AboutUs;
