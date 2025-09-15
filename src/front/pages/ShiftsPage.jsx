/*importacion  employee*/
import { Sidebar } from "../components/Sidebar/Sidebar";



export const ShiftsPage = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <EmployeeShifts/>
        </div>    
    );
};
