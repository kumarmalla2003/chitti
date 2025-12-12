import React, { forwardRef } from "react";
import { CircleCheck, Users, Wallet } from "lucide-react";
import StaggerContainer from "../../../../components/ui/StaggerContainer";
import StaggerItem from "../../../../components/ui/StaggerItem";
import Card from "../../../../components/ui/Card";

const Workflow = forwardRef((props, ref) => {
  const steps = [
    {
      icon: Users,
      title: "1. Create a Group",
      description: "Foreman starts a new chit group and invites members.",
      color: "accent",
    },
    {
      icon: Wallet,
      title: "2. Monthly Collection",
      description: "Members contribute their monthly installment securely.",
      color: "success",
    },
    {
      icon: CircleCheck,
      title: "3. Auction & Payout",
      description: "One member wins the pot via auction or lottery.",
      color: "warning",
    },
  ];

  return (
    <section
      id="workflow"
      ref={ref}
      className="flex flex-col justify-center py-20 bg-background-secondary/30"
    >
      <div className="w-full px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Our Simple, Transparent Process
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto mb-16">
             Manage your chit funds efficiently in three simple steps.
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StaggerItem key={index} className="h-full">
               <Card className="h-full flex flex-col items-center text-center p-8 hover:shadow-lg transition-all duration-300 border-t-4 border-t-transparent hover:border-t-accent">
                  <div className={`p-4 rounded-full bg-${step.color}-bg mb-6`}>
                    <step.icon className={`w-8 h-8 text-${step.color}-accent`} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{step.description}</p>
               </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
});

Workflow.displayName = "Workflow";

export default Workflow;
