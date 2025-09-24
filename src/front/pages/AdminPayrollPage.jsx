import { AdminPayroll } from "../components/AdminPayroll/AdminPayroll";
import { Sidebar } from "../components/Sidebar/Sidebar";


export const AdminPayrollPage = () => {
  return (
    <div className="app-shell">
        <Sidebar />
        <AdminPayroll />
    </div>
  );
};