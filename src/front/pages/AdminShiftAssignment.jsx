import { AdminShiftAssignment as AdminShiftAssignmentView } from "../components/AdminShiftAssignment/AdminShiftAssignment";
import { Sidebar } from "../components/Sidebar/Sidebar";

export const AdminShiftAssignment = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <AdminShiftAssignmentView />
    </div>
  );
};
