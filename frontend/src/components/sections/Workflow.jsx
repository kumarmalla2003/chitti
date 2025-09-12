import { forwardRef } from "react";
import { FiArrowRight } from "react-icons/fi";

const Workflow = forwardRef((props, ref) => {
  return (
    <section
      id="workflow"
      ref={ref}
      className="flex flex-col justify-center py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Our Simple, Transparent Process
          </h2>
        </div>
        <hr className="my-8 border-border" />
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-4">
          {/* Step 1 */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full font-bold text-xl">
              1
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Define & Invite
            </h3>
            <p className="text-text-secondary">
              Create your chit group, set the total value and duration, and
              invite members to join your secure, online group.
            </p>
          </div>

          {/* Arrow Separator */}
          <div className="hidden md:block text-accent opacity-80 pt-16">
            <FiArrowRight className="w-10 h-10" />
          </div>

          {/* Step 2 */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full font-bold text-xl">
              2
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Assign the Schedule
            </h3>
            <p className="text-text-secondary">
              Work with your members to assign a fixed payout month for each
              person. Lock in the schedule for the entire term.
            </p>
          </div>

          {/* Arrow Separator */}
          <div className="hidden md:block text-accent opacity-80 pt-16">
            <FiArrowRight className="w-10 h-10" />
          </div>

          {/* Step 3 */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-accent text-white rounded-full font-bold text-xl">
              3
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">
              Automate & Monitor
            </h3>
            <p className="text-text-secondary">
              Let the platform handle monthly collection reminders and payout
              tracking while you monitor everything from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Workflow;
