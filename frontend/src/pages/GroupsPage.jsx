// frontend/src/pages/GroupsPage.jsx

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllChitGroups } from "../services/chitsService";
import { useSelector } from "react-redux";
import Message from "../components/ui/Message";
import { FiPlus, FiLoader } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const GroupsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getAllChitGroups(token);
        setGroups(data.groups);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const dummyNavLinkClick = () => {};
  const dummyActiveSection = "groups";
  const dummyLoginClick = () => {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection={dummyActiveSection}
          onNavLinkClick={dummyNavLinkClick}
          onLoginClick={dummyLoginClick}
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  My Chit Groups
                </h1>
                <Link to="/groups/create">
                  <Button variant="success" className="flex items-center">
                    <FiPlus className="mr-2" />
                    Add
                  </Button>
                </Link>
              </div>
              <hr className="my-4 border-border" />

              {loading && (
                <div className="flex justify-center items-center h-64">
                  <FiLoader className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}

              {error && (
                <Message type="error" title="Error">
                  {error}
                </Message>
              )}

              {!loading && !error && groups.length === 0 && (
                <div className="text-center p-8 border border-border rounded-md shadow-md">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    No Chit Groups Found
                  </h2>
                  <p className="text-text-secondary">
                    You don't have any chit groups yet. Click the button above
                    to create one!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading &&
                  groups.length > 0 &&
                  groups.map((group) => (
                    <Card key={group.id} className="hover:scale-105">
                      <h3 className="text-xl font-semibold text-accent mb-2">
                        {group.name}
                      </h3>
                      <p className="text-text-primary">
                        Value: ₹{group.chit_value}
                      </p>
                      <p className="text-text-secondary">
                        Installment: ₹{group.monthly_installment}
                      </p>
                      <p className="text-text-secondary">
                        Members: {group.group_size}
                      </p>
                      <p className="text-text-secondary">
                        Duration: {group.duration_months} months
                      </p>
                      <p className="text-text-secondary">
                        Start Date: {formatDate(group.start_date)}
                      </p>
                      <p className="text-text-secondary">
                        End Date: {formatDate(group.end_date)}
                      </p>
                    </Card>
                  ))}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={dummyActiveSection}
        onNavLinkClick={dummyNavLinkClick}
        onLoginClick={dummyLoginClick}
      />
      <BottomNav />
    </>
  );
};

export default GroupsPage;
