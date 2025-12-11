import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const StaggerContainer = ({ children, className = "", ...props }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="show"
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export default StaggerContainer;
