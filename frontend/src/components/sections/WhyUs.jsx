import { forwardRef } from "react";
import Card from "../ui/Card";
import { FiSlash, FiCheckCircle, FiUsers } from "react-icons/fi";

const WhyUs = forwardRef((props, ref) => {
  return (
    <section
      id="why-us"
      ref={ref}
      className="flex flex-col justify-center py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Why Foremen Choose Chitti
          </h2>
        </div>
        <hr className="my-8 border-border" />
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <FiSlash size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              No More Auctions
            </h3>
            <p className="text-text-secondary">
              Remove the complexity and disputes of auctions. Our model is
              simple, fair, and easy for everyone to understand.
            </p>
          </Card>
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <FiCheckCircle size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Increased Trust
            </h3>
            <p className="text-text-secondary">
              Members love the predictability. A transparent, fixed schedule
              builds immense trust and encourages repeat participation.
            </p>
          </Card>
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <FiUsers size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Reduced Workload
            </h3>
            <p className="text-text-secondary">
              Dramatically cut down on administrative tasks. With schedules and
              payments automated, you can manage more groups in less time.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
});

export default WhyUs;
