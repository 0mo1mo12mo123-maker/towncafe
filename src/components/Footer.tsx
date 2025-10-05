import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { CafeName } from "@/Utils/utils";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary">{CafeName}</h3>
            <p className="text-secondary-foreground/80">
              Serving delicious burgers and more since 2024. Quality ingredients, great taste, unforgettable experience.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>123 Food Street, City, State</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>+1 234 567 8900</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>info@Towncafe.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            <div className="mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9476519598093!2d-73.99185368459395!3d40.74117197932881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzI4LjIiTiA3M8KwNTknMjIuNyJX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="150"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-secondary-foreground/20 mt-8 pt-6 text-center text-secondary-foreground/60">
          <p>&copy; 2024  {CafeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
