import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import "./Creators.css"; 
import zaibo from "../assets/creators/zahab.jpg";
import fizzy from "../assets/creators/fizza.jpg";
import zehra from "../assets/creators/zehra.jpg";

const Creators = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      {/* Button Transforms into Header */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="meet-button"
        whileTap={{ scale: 0.98 }}
      >
        {expanded ? "MEET THE CREATORS" : "MEET THE CREATORS"}
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="meet-container"
          >
            {[
              { name: "Zahab Jahangir", role: "THE EXECUTOR", img: zaibo, link: "https://www.linkedin.com/in/zahab-jahangir-11971623b/" },
              { name: "Syeda Fizza", role: "THE MASTERMIND", img: fizzy, link: "https://www.linkedin.com/in/syeda-fizza-2b66001b5/" },
              { name: "Zehra Waqar", role: "THE DEVISER", img: zehra, link: "https://www.linkedin.com/in/zehra-waqar-4a553124b/" }
            ].map((creator, index) => (
              <div key={index} className="creator-card">
                <img src={creator.img} className="creator-img" alt={creator.name} />
                <p className="creator-name">{creator.name}</p>
                <p className="creator-role">{creator.role}</p>
                <a href={creator.link} className="creator-link">
                  Visit LinkedIn Profile ➡
                </a>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Creators;