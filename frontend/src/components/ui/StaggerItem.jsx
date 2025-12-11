import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const StaggerItem = ({ children, className = "", ...props }) => (
  <motion.div variants={itemVariants} className={className} {...props}>
    {children}
  </motion.div>
);

export default StaggerItem;
