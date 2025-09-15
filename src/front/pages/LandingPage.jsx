import { AboutPlatform } from "../components/AboutMe/AboutPlatform"
import { CallToAction } from "../components/CardsInfo/CallToAction";
import { ContactForm } from "../components/ContactForm/ContactForm";
import { Features } from "../components/Features/Features";
import { Footer } from "../components/Footer/Footer";
import { HeroSection } from "../components/HeroSection/HeroSection";






export const LandingPage = () => {

	return (
		<>
			<HeroSection />
			<Features />
			<AboutPlatform />
			<ContactForm />
			<CallToAction />
			<Footer />
		</>
		

	);
}; 