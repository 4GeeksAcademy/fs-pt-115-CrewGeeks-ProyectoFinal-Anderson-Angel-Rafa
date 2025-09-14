import "./EmployeeDashboard.css"; 
import { Sidebar } from "../components/Sidebar/Sidebar";
import { EmployeeProfile } from "../components/EmployeeProfile/EmployeeProfile";


export const EmployeeProfilePage = () => {
  return (
    <div className="app-shell">
            <Sidebar />
            <EmployeeProfile/>
        </div>
  );
};