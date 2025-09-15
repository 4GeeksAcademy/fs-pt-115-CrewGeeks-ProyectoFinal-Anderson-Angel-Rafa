import React, { useState } from "react";
import "./EmployeeProfile.css";

export const EmployeeProfile = ({
  employee: initialEmployee = {
    id: 1,
    company_id: 101,
    first_name: "Ángel",
    last_name: "Sastre",
    dni: "12345678X",
    birth: "1992-03-15",
    address: "Calle Mayor 123, 28001 Madrid, Spain",
    email: "angel.sastre@company.com",
    seniority: "5 años",
    phone: "+34 612 345 678",
    role_id: "Frontend Developer",
    status: "Activo",
  },
  onUpdate,
  // NUEVOS PROPS PARA SEGURIDAD
  lastPasswordChangeText = "hace 3 meses",
  twoFAEnabled = false,
  onChangePassword = () => {},
  onToggle2FA = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [employee, setEmployee] = useState(initialEmployee);

  const toggleEdit = () => {
    if (isEditing && typeof onUpdate === "function") {
      onUpdate(employee);
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field) => (e) => {
    setEmployee((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="employee-profile__page">
      <h1 className="ep-title">Mi Perfil</h1>
      <p>Gestiona tu información personal y la configuración de tu cuenta.</p>

      <div className="employee-profile__wrapper">
        {/* Columna izquierda */}
        <div className="employee-profile__left">
          {/* Foto */}
          <div className="ep-box ep-photo">
            <img src="foto.jpg" alt="Foto empleado" />
            <div className="ep-photo__buttons">
              <button className="ep-btn ep-btn--ghost">Subir</button>
              <button className="ep-btn ep-btn--ghost">Eliminar</button>
            </div>
          </div>

          {/* Datos laborales */}
          <div className="ep-box ep-company">
            <h3>Datos Laborales</h3>
            {!isEditing ? (
              <div className="ep-company__list">
                <p>
                  <strong>Empresa (ID):</strong> {employee.company_id}
                </p>
                <p>
                  <strong>Cargo/Rol:</strong> {employee.role_id}
                </p>
                <p>
                  <strong>Antigüedad:</strong> {employee.seniority}
                </p>
                <p
                  className={`ep-status ${
                    employee.status === "Activo" ? "activo" : "inactivo"
                  }`}
                >
                  {employee.status}
                </p>
              </div>
            ) : (
              <div className="ep-company__grid">
                <label>
                  Empresa (ID)
                  <input
                    value={employee.company_id}
                    onChange={handleChange("company_id")}
                  />
                </label>
                <label>
                  Cargo/Rol
                  <input
                    value={employee.role_id}
                    onChange={handleChange("role_id")}
                  />
                </label>
                <label>
                  Antigüedad
                  <input
                    value={employee.seniority}
                    onChange={handleChange("seniority")}
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={employee.status}
                    onChange={handleChange("status")}
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="employee-profile__right">
          {/* Datos personales */}
          <div className="ep-box ep-personal">
            <h2>Datos Personales</h2>
            {!isEditing ? (
              <div className="ep-personal__grid">
                <p>
                  <strong>Nombre:</strong> {employee.first_name}
                </p>
                <p>
                  <strong>Apellidos:</strong> {employee.last_name}
                </p>
                <p>
                  <strong>DNI:</strong> {employee.dni}
                </p>
                <p>
                  <strong>Fecha Nac.:</strong> {employee.birth}
                </p>
                <p>
                  <strong>Dirección:</strong> {employee.address}
                </p>
                <p>
                  <strong>Email:</strong> {employee.email}
                </p>
                <p>
                  <strong>Teléfono:</strong> {employee.phone}
                </p>
                <p>
                  <strong>ID empleado:</strong> {employee.id}
                </p>
              </div>
            ) : (
              <form
                className="ep-personal__grid"
                onSubmit={(e) => e.preventDefault()}
              >
                <label>
                  Nombre
                  <input
                    value={employee.first_name}
                    onChange={handleChange("first_name")}
                  />
                </label>
                <label>
                  Apellidos
                  <input
                    value={employee.last_name}
                    onChange={handleChange("last_name")}
                  />
                </label>
                <label>
                  DNI
                  <input
                    value={employee.dni}
                    onChange={handleChange("dni")}
                  />
                </label>
                <label>
                  Fecha Nac.
                  <input
                    type="date"
                    value={employee.birth}
                    onChange={handleChange("birth")}
                  />
                </label>
                <label>
                  Dirección
                  <input
                    value={employee.address}
                    onChange={handleChange("address")}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={employee.email}
                    onChange={handleChange("email")}
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    value={employee.phone}
                    onChange={handleChange("phone")}
                  />
                </label>
                <label>
                  ID empleado
                  <input value={employee.id} onChange={handleChange("id")} />
                </label>
              </form>
            )}

            <div className="ep-actions">
              <button className="ep-btn ep-btn--primary" onClick={toggleEdit}>
                {isEditing ? "Actualizar" : "Editar"}
              </button>
            </div>
          </div>

          {/* AJUSTES DE SEGURIDAD (nuevo div) */}
          <div className="ep-box ep-security">
            <h2>Ajustes de seguridad</h2>

            <div className="ep-security__item">
              <div>
                <p className="ep-security__label">Contraseña</p>
                <p className="ep-security__sub">
                  Último cambio: {lastPasswordChangeText}
                </p>
              </div>
              <button
                type="button"
                className="ep-btn ep-btn--link"
                onClick={onChangePassword}
              >
                Cambiar contraseña
              </button>
            </div>

            <div className="ep-security__item">
              <div>
                <p className="ep-security__label">
                  Autenticación en dos pasos
                </p>
                <p className="ep-security__sub">
                  Añade una capa extra de seguridad
                </p>
              </div>
              <div className="ep-security__actions">
                <span className="ep-security__status">
                  {twoFAEnabled ? "Activado" : "Desactivado"}
                </span>
                <button
                  type="button"
                  className="ep-btn ep-btn--link"
                  onClick={onToggle2FA}
                >
                  {twoFAEnabled ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
          {/* fin ajustes seguridad */}
        </div>
      </div>
    </div>
  );
};
