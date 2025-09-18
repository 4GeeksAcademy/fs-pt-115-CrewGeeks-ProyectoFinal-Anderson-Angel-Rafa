// Layout.jsx
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar/Navbar";
import { useAuth } from "../hooks/useAuth";
// import { Footer } from "../components/Footer/Footer";


export const Layout = () => {
	const { loading } = useAuth(false)
	return (
		<ScrollToTop>
			<Navbar />


			{
				loading ? <div class="loading-wave" >
					<div class="loading-bar"></div>
					<div class="loading-bar"></div>
					<div class="loading-bar"></div>
					<div class="loading-bar"></div>
				</div > : <Outlet />}

		</ScrollToTop>
	);
};
