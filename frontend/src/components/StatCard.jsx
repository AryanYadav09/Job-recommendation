import { motion } from "framer-motion";

const StatCard = ({ label, value, accent = "accent" }) => {
  const accentClass = {
    accent: "text-accent",
    green: "text-accent2",
    slate: "text-slate-800 dark:text-slate-100",
    blue: "text-sky-500"
  }[accent] || "text-accent";

  return (
    <motion.div whileHover={{ y: -4 }} className="glass p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accentClass}`}>{value}</p>
    </motion.div>
  );
};

export default StatCard;
