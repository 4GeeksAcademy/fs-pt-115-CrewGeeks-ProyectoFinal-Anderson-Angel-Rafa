const urlApi = import.meta.env.VITE_BACKEND_URL;

export const login = async (employeeData) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/employees/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    alert(data.msg);
    return;
  }
  localStorage.setItem("token", data.token);
  return data;
};

