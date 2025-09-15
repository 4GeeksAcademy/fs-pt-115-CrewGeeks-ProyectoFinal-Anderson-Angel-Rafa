import { EmployeePayroll } from "../components/EmployeePayroll/EmployeePayroll";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const PayrollPage = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <EmployeePayroll/>
        </div>    
    );
};





