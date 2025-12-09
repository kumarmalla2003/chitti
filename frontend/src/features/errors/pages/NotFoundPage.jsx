// frontend/src/features/errors/pages/NotFoundPage.jsx

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

/**
 * NotFoundPage - 404 error page displayed when a route doesn't exist
 */
const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-primary px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center max-w-md"
            >
                {/* Animated Icon */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex justify-center mb-6"
                >
                    <div className="p-6 bg-warning-bg rounded-full">
                        <FileQuestion className="w-20 h-20 text-warning-accent" />
                    </div>
                </motion.div>

                {/* 404 Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <h1 className="text-6xl md:text-7xl font-bold text-accent mb-2">
                        404
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <button
                        onClick={() => navigate("/")}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 font-medium"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-background-secondary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors duration-200 font-medium border border-border"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
