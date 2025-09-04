const urlApi = import.meta.env.VITE_BACKEND_URL;

export const login = async (employeeData) => {
  const response = await fetch(`${urlApi / api / login}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  	}
	);
	const data = await response.json();
	
};
