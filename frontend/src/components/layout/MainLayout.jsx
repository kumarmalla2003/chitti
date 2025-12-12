import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import BottomNav from "./BottomNav";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <div
                className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
            >
                <Header
                    onMenuOpen={() => setIsMenuOpen(true)}
                // activeSection prop can be determined by location if needed, 
                // or left as default/managed by individual pages if they need specific highlighting
                // For now, we'll let specific pages highlight if needed or implement active logic here later
                />

                <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                    <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary w-full px-4 py-8">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
            <MobileNav
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
            <BottomNav />
        </>
    );
};

export default MainLayout;
