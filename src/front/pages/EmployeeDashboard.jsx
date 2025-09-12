import "./EmployeeDashboard.css"; 
import { EmployeeData } from "../components/EmployeeData/EmployeeData";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const EmployeeDashboard = () => {
  return (
    <div className="app-shell">
      
        <Sidebar />
      

      <main className="content">
        <EmployeeData />
      </main>
    </div>
  );
};