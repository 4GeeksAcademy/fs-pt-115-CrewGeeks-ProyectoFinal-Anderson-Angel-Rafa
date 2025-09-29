import { EmployeeHolidays } from "../components/EmployeeHolidays/EmployeeHolidays";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const HolidaysPage = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      
        <EmployeeHolidays />
      
    </div>
  );
};