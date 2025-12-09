import { forwardRef } from "react";
import Card from "../../../../components/ui/Card";
import { Mail, Phone } from "lucide-react";

const Contact = forwardRef((props, ref) => {
  return (
    <section
      id="contact"
      ref={ref}
      className="flex flex-col justify-center py-20"
    >
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Contact Us
          </h2>
        </div>
        <hr className="my-8 border-border" />

        <Card className="w-full max-w-4xl mx-auto px-6 md:px-8 py-8 md:py-12">
          <div className="flex flex-col items-center text-center md:grid md:grid-cols-2 md:gap-8 md:items-center md:text-left">
            {/* Left Column: Text */}
            <div className="max-w-md md:mx-0">
              <h2 className="text-3xl md:text-4xl font-bold text-accent mb-4">
                Get In Touch
              </h2>
              <p className="text-lg text-text-secondary">
                Have questions or need support? We're here to help you get
                started and make the most out of our platform.
              </p>
            </div>

            {/* Right Column: Contact Details */}
            <div className="flex flex-col space-y-8 text-lg text-left w-full max-w-md mt-8 md:mt-0 md:max-w-none">
              <a
                href="mailto:kumarmalla2003@gmail.com"
                className="group flex items-center gap-4"
              >
                <div className="p-3 bg-background-primary rounded-full group-hover:bg-accent transition-colors duration-300">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Email Us</p>
                  <span className="text-text-secondary group-hover:text-accent transition-colors duration-300">
                    kumarmalla2003@gmail.com
                  </span>
                </div>
              </a>
              <a
                href="tel:+919182728941"
                className="group flex items-center gap-4"
              >
                <div className="p-3 bg-background-primary rounded-full group-hover:bg-accent transition-colors duration-300">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Call Us</p>
                  <span className="text-text-secondary group-hover:text-accent transition-colors duration-300">
                    +91 91827 28941
                  </span>
                </div>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
});

export default Contact;
