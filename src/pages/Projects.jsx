import HeroSection from "../components/heroSection/HeroSection";
import MarketplaceProperties from "../components/MarketplaceProperties";
import ClientTestimonials from "../components/ClientTestimonials";

function Projects() {
  return (
    <div>
      <HeroSection page={"Marketplace"} />
      <MarketplaceProperties />
      <ClientTestimonials />
    </div>
  );
}

export default Projects;
