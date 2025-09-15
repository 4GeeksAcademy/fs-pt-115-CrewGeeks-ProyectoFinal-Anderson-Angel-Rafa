import { EmployeeInbox } from "../components/EmployeeInbox/EmployeeInbox";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const InboxPage = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <EmployeeInbox/>
        </div>    
    );
};









