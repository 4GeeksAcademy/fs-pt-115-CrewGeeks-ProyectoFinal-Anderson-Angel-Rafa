import { EmployeeTimeLog } from "../components/EmployeeTimeLog/EmployeeTimeLog";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const TimeLogPage = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <EmployeeTimeLog/>
        </div>    
    );
};
