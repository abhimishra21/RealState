import { Link } from "react-router-dom";
import { footerIcons, headerData } from "../data/data";

import Button from "./Button";
import Container from "./Container";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="bg-secondary text-white py-8 md:py-[50px] dark:bg-secondary-dark">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 md:py-[40px] border-t border-[#b9bbbd]">
            <ul className="space-y-3">
              <h2 className="text-xl uppercase font-bold mb-5">Menu</h2>
              {headerData.map((el) => (
                <li
                  key={el.id}
                  className="text-gray-300 text-sm hover:text-primary transition-all hover:translate-x-2"
                >
                  <Link to={el.to}>{el.title}</Link>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <h2 className="text-xl uppercase font-bold mb-5">
                Who we are?
              </h2>
              <p className="text-gray-300 text-sm">
                New Capital is a real estate consultancy company proudly serving
                thousands of satisfied clients and partnering with the top real
                estate developers in Egypt.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl uppercase font-bold mb-5">
                Follow Us
              </h2>
              <div className="flex items-center gap-4">
                {footerIcons.map((el) => {
                  const Icon = el.icon;
                  return (
                    <Link
                      key={el.id}
                      to={"/#"}
                      target="_blank"
                      className="hover:text-primary transition-colors"
                    >
                      <Icon className="text-2xl" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl uppercase font-bold mb-5">
                Contact Us
              </h2>
              <Button className="w-full md:w-auto">Request A Callback</Button>
            </div>
          </div>
        </Container>
      </div>

      <div className="bg-gray-100 text-gray-600 py-6 dark:bg-gray-900 dark:text-gray-400">
        <Container>
          <p className="text-sm md:text-base text-center">
            © {currentYear} New Capital. All Rights Reserved.
          </p>
        </Container>
      </div>
    </>
  );
}

export default Footer;
