// Import necessary components and functions from react-router-dom.
import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { HolidaysPage } from "./pages/HolidaysPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PayrollPage } from "./pages/PayrollPage";
import { ShiftsPage } from "./pages/ShiftsPage";
import { TimeLogPage } from "./pages/TimeLogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { InboxPage } from "./pages/Inboxpage";
import { SiteFeaturesPage } from "./pages/SiteFeaturesPage";
import { AdminPayrollPage } from "./pages/AdminPayrollPage";
import { AdminRequestsPage } from "./pages/AdminRequestsPage";
import { AdminShiftAssignment } from "./pages/AdminShiftAssignment";
import { AdminEmpProfile } from "./pages/AdminEmpProfile";

import { AuthLayout } from "./Layout/AuthLayout";

// Guards y roles
import { RequireRole, Unauthorized } from "./auth/RouteGuards";
import { ROLES } from "./auth/roles";

export const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			{/* Root con un único Layout */}
			<Route path="/" element={<Layout />}>
				{/* Públicas */}
				<Route index element={<LandingPage />} />
				<Route path="login" element={<LoginPage />} />
				<Route path="features" element={<SiteFeaturesPage />} />
				{/* <Route path="unauthorized" element={<Unauthorized />} /> */}

				{/* Privadas */}
				<Route element={<AuthLayout redirectTo="/login" />}>
					{/* Acceso de empleado (y cualquiera autenticado) */}
					<Route path="dashboard" element={<DashboardPage />} />
					<Route path="holidays" element={<HolidaysPage />} />
					<Route path="payroll" element={<PayrollPage />} />
					<Route path="shifts" element={<ShiftsPage />} />
					<Route path="TimeLog" element={<TimeLogPage />} /> {/* respeta tu path */}
					<Route path="profile" element={<ProfilePage />} />
					<Route path="inbox" element={<InboxPage />} />
					<Route path="suggestions" element={<SuggestionsPage />} />

					

					{/* HR + Admin + Owner (gestión de solicitudes y asignación de turnos) */}
					<Route element={<RequireRole roles={[ROLES.OWNERDB, ROLES.ADMIN, ROLES.HR]} />}>
						<Route path="adminPayroll" element={<AdminPayrollPage />} />
						<Route path="adminEmpProfile" element={<AdminEmpProfile />} />
						<Route path="adminRequests" element={<AdminRequestsPage />} />
						<Route path="adminShiftAssignment" element={<AdminShiftAssignment />} />
					</Route>
				</Route>
			</Route>

			{/* 404 */}
			<Route path="*" element={<h1>Not found!</h1>} />
		</>
	)
);
