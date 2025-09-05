import { InfoAbout } from "../components/AboutMe/InfoAbout.jsx";
import { ContactForm } from "../components/ContactForm/ContactForm.jsx";
import { Slider } from "../components/SliderLanding/Slider.jsx";
import { CardsInfo } from "../components/CardsInfo/CardsInfo.jsx";
export const Home = () => {

	return (
		<>
			<Slider/>
			<InfoAbout />
			<CardsInfo />
			<ContactForm />
		</>
		

	);
}; 