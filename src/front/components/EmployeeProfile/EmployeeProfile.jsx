import React, { useState } from "react";
import "./EmployeeProfile.css";
import { useAuth } from "../../hooks/useAuth";

export const EmployeeProfile = () => {

  const { user, token, loading } = useAuth()

  console.log(user);
  

  const [isEditing, setIsEditing] = useState(false);


  const toggleEdit = () => {

    setIsEditing((prev) => !prev);
  };

  // const handleChange = (field) => (e) => {
  //   setEmployee((prev) => ({ ...prev, [field]: e.target.value }));
  // };

  return (
    <section className='content-area'>
      <div className='content-header'>
        <div className='content-title'>Mi perfil</div>
        <div className='content-subtitle'>
          Gestiona tu información personal y la configuración de tu cuenta
        </div>
      </div>

      <div className='content-body'>
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

              <div className="ep-company__list">
                <p>
                  <strong>Empresa:</strong> {user.company}
                </p>
                <p>
                  <strong>Cargo/Rol:</strong> {user.role_id}
                </p>
                <p>
                  <strong>Antigüedad:</strong> {user.seniority}
                </p>
              </div>

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
                    <strong>Nombre:</strong> {user.first_name}
                  </p>
                  <p>
                    <strong>Apellidos:</strong> {user.last_name}
                  </p>
                  <p>
                    <strong>DNI:</strong> {user.dni}
                  </p>
                  <p>
                    <strong>Año de nacimiento:</strong> {user.birth}
                  </p>
                  <p>
                    <strong>Dirección:</strong> {user.address}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {user.phone}
                  </p>
                  <p>
                    <strong>ID empleado:</strong> {user.id}
                  </p>
                </div>
              ) : (
                <form
                  className="ep-personal__grid"
                  // onSubmit={(e) => e.preventDefault()}
                >
                  <label>
                    Nombre
                    <input
                      value={user.first_name}
                      // onChange={handleChange("first_name")}
                    />
                  </label>
                  <label>
                    Apellidos
                    <input
                      value={user.last_name}
                      // onChange={handleChange("last_name")}
                    />
                  </label>
                  <label>
                    DNI
                    <input
                      value={user.dni}
                      // onChange={handleChange("dni")}
                    />
                  </label>
                  <label>
                    Fecha Nac.
                    <input
                      type="date"
                      value={user.birth}
                      // onChange={handleChange("birth")}
                    />
                  </label>
                  <label>
                    Dirección
                    <input
                      value={user.address}
                      // onChange={handleChange("address")}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={user.email}
                      // onChange={handleChange("email")}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      value={user.phone}
                      // onChange={handleChange("phone")}
                    />
                  </label>
                  <label>
                    ID empleado
                    <input value={user.id}/>
                  </label>
                </form>
              )}

              <div className="ep-actions">
                <button className="ep-btn ep-btn--primary" onClick={toggleEdit}>
                  {isEditing ? "Actualizar" : "Editar"}
                </button>
              </div>
            </div>

            <div className="ep-box ep-security">
              <h2>Ajustes de seguridad</h2>

              <div className="ep-security__item">
                <div>
                  <p className="ep-security__label">Contraseña</p>
                </div>
                <div>
                  <button
                    type="button"
                    className="ep-btn ep-btn--link"
                    // onClick={onChangePassword}
                  >
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* fin ajustes seguridad */}
        </div>
      </div>
    </section>
  );
};
