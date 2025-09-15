// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { LandingPage } from "./pages/LandingPage";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { LoginPage } from "./pages/LoginPage";
import { HolidaysPage } from "./pages/HolidaysPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PayrollPage } from "./pages/PayrollPage";
import { ShiftsPage } from "./pages/ShiftsPage";
import { TimeLogPage } from "./pages/TimeLogPage";
import { DashboardPage } from "./pages/DashboardPage";



export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      // Root Route: All navigation will start from here.
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
        <Route path= "/" element={<LandingPage />} />
        <Route path="/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}
        <Route path="/demo" element={<Demo />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/holidays" element={<HolidaysPage/>}/>
        <Route path="/payroll" element={<PayrollPage/>}/>
        <Route path="/shifts" element={<ShiftsPage/>}/>
        <Route path="/TimeLog" element={<TimeLogPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>

        
        
      </Route>
    )
);