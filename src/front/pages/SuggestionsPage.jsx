import { EmployeeSuggestions } from "../components/EmployeeSuggestions/EmployeeSuggestions";
import { Sidebar } from "../components/Sidebar/Sidebar";



export const SuggestionsPage = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <EmployeeSuggestions />
      </main>
    </div>
  );
};