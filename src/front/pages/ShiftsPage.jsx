import { EmployeeShifts } from "../components/EmployeeShifts/EmployeeShifts";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const ShiftsPage = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <EmployeeShifts/>
        </div>    
    );
};
