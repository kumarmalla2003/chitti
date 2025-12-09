import { forwardRef } from "react";
import Card from "../../../../components/ui/Card";
import { Calendar, Users, IndianRupee } from "lucide-react";

const Features = forwardRef((props, ref) => {
  return (
    <section
      id="features"
      ref={ref}
      className="flex flex-col justify-center py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Everything You Need to Manage
          </h2>
        </div>
        <hr className="my-8 border-border" />
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Fixed Payout Schedules
            </h3>
            <p className="text-text-secondary">
              Eliminate uncertainty. Create a complete, month-by-month payout
              calendar before the chit begins.
            </p>
          </Card>
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Effortless Group Setup
            </h3>
            <p className="text-text-secondary">
              Onboard members, define chit values, and set the entire schedule
              in a few simple steps.
            </p>
          </Card>
          <Card className="text-center hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Automated Collections
            </h3>
            <p className="text-text-secondary">
              Our system automatically tracks installments, sends reminders, and
              provides a clear ledger for all members.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
});

export default Features;
