import { motion } from "framer-motion";

const Loader = ({ fullscreen = false }) => {
  return (
    <div
      className={fullscreen ? "grid min-h-screen place-content-center" : "grid place-content-center py-12"}
    >
      <motion.div
        className="h-10 w-10 rounded-full border-4 border-accent/30 border-t-accent"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
};

export default Loader;
