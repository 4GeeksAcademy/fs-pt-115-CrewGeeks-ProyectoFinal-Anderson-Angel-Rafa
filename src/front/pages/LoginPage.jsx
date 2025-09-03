// Import necessary components from react-router-dom and other parts of the application.
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";  // Custom hook for accessing the global state.
import { LoginForm } from "../components/LoginForm.jsx/LoginForm";


export const LoginPage = () => {
  

  return (
    <>
        <LoginForm/>

    </>
      

     
  );
};