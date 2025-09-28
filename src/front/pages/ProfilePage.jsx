
import { Sidebar } from "../components/Sidebar/Sidebar";
import { EmployeeProfile } from "../components/EmployeeProfile/EmployeeProfile";
import { TopbarLogged } from "../components/TopbarLogged/TopbarLogged";


export const ProfilePage = () => {
  return (
    <div className="app-shell">
            <Sidebar />
            <EmployeeProfile/>
    </div>
  );
};