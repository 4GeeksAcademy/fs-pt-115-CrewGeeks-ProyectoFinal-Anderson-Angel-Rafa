
import { EmployeeData } from "../components/EmployeeData/EmployeeData";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const DashboardPage = () => {
  return (
    <div className="app-shell">
        <Sidebar />
        <EmployeeData />
    </div>
  );
};