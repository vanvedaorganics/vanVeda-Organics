import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const faqData = [
  {
    category: "Our Philosophy",
    items: [
      {
        question: "What makes Truesoil mangoes exceptional?",
        answer: "Each mango is cultivated in the natural ecosystem of Gir, where soil, climate, and patience come together. We don’t rush the process — our mangoes are tree-ripened and grown without shortcuts, preserving their true character, aroma, and depth of flavour."
      },
      {
        question: "Do you use any artificial ripening methods?",
        answer: "Never. We do not use chemicals such as Calcium Carbide. Time and nature are the only ripening agents we trust."
      },
      {
        question: "Are your mangoes certified organic?",
        answer: "While certification is a process, our commitment is a practice. We follow mindful, chemical-free farming methods focused on soil integrity and authentic taste — values that go beyond labels."
      }
    ]
  },
  {
    category: "Delivery Experience",
    items: [
      {
        question: "When will my order arrive?",
        answer: "Your order is dispatched with care and typically reaches you within 2–5 days, depending on your location. We prioritise freshness over speed — always."
      },
      {
        question: "How are the mangoes packaged?",
        answer: "Each box is thoughtfully packed to allow the fruit to breathe while staying protected in transit. Our packaging reflects the same care we put into growing them."
      }
    ]
  },
  {
    category: "The Fruit & Its Journey",
    items: [
      {
        question: "Will the mangoes be ready to eat upon arrival?",
        answer: "They may arrive slightly firm — intentionally so. This ensures they complete their ripening journey naturally in your home, reaching peak flavour at the right moment."
      },
      {
        question: "Why do some mangoes have marks or spots?",
        answer: "Nature leaves its signature. Minor surface marks are a reflection of chemical-free cultivation — not a compromise on quality, but proof of authenticity."
      },
      {
        question: "How should I store and ripen them?",
        answer: "Keep them at room temperature, away from direct sunlight. Once fragrant and soft to touch, they are ready to be enjoyed."
      }
    ]
  },
  {
    category: "Value & Exclusivity",
    items: [
      {
        question: "Why are Truesoil mangoes priced at a premium?",
        answer: "Because they are not mass-produced. From limited farm yield to natural cultivation and careful handling — every step prioritises quality over quantity."
      },
      {
        question: "Do you offer gifting or bulk orders?",
        answer: "Yes, we curate bespoke boxes for gifting and larger orders. For a more personalised experience, we invite you to connect with us directly."
      }
    ]
  },
  {
    category: "Care & Assurance",
    items: [
      {
        question: "What if my order arrives damaged?",
        answer: "While we take utmost care, if something isn’t right, simply reach out within 24 hours. We will make it right — thoughtfully and promptly."
      },
      {
        question: "How can I reach you?",
        answer: "We’re always available via WhatsApp or email — whichever you prefer. A real person, always ready to assist."
      }
    ]
  }
];

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-[#744531]/10 last:border-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-6 text-left group"
      >
        <span className="syne-bold text-lg md:text-xl text-[#744531] group-hover:text-[#28543d] transition-colors duration-300">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="ml-4 flex-shrink-0"
        >
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#28543d]' : 'text-[#744531]/40'}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-[#613d38] ubuntu-regular leading-relaxed text-base md:text-lg max-w-3xl">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#744531] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#E7CE9D] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#28543d] rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E7CE9D] mb-4 block"
          >
            Support Center
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="syne-bold text-4xl md:text-6xl text-white mb-6"
          >
            Frequently Asked —<br />Thoughtfully Answered
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#E7CE9D]/80 max-w-2xl mx-auto text-lg font-medium"
          >
            Everything you need to know about our harvest, our journey, and our promise to you.
          </motion.p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {faqData.map((category, catIdx) => (
              <div key={catIdx} className="mb-20 last:mb-0">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="syne-bold text-2xl md:text-3xl text-[#744531] mb-8 pb-4 border-b-2 border-[#E7CE9D]/30 flex items-center gap-4"
                >
                  <span className="text-[#E7CE9D]">0{catIdx + 1}</span>
                  {category.category}
                </motion.h2>
                
                <div className="space-y-2">
                  {category.items.map((item, itemIdx) => {
                    const currentIndex = `${catIdx}-${itemIdx}`;
                    return (
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: itemIdx * 0.1 }}
                      >
                        <AccordionItem
                          question={item.question}
                          answer={item.answer}
                          isOpen={openIndex === currentIndex}
                          onClick={() => setOpenIndex(openIndex === currentIndex ? null : currentIndex)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Final Touch CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-32 p-12 bg-white rounded-[3rem] border border-[#744531]/5 shadow-xl shadow-[#744531]/5 text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E7CE9D]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              
              <h3 className="syne-bold text-3xl text-[#744531] mb-6 relative z-10">
                Still curious?
              </h3>
              <p className="text-[#613d38] text-lg mb-10 max-w-xl mx-auto relative z-10">
                We’d love to hear from you — connect with us directly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                <a 
                  href="https://wa.me/yournumber" 
                  className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-full font-bold hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </a>
                <Link 
                  to="/contact-us" 
                  className="flex items-center gap-3 px-8 py-4 bg-[#744531] text-white rounded-full font-bold hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Contact Us
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
