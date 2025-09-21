import React, { useState, useRef } from "react";
import "./EmployeeProfile.css";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../Loader/Loader";

export const EmployeeProfile = () => {

  const { user, token, loading, uploadProfileImage, deleteProfileImage } = useAuth(); // ← añadimos uploadProfileImage del hook

  console.log(user);

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null); // ← ref para el input oculto

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  // Handler para abrir el selector de archivos
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Handler para subir la imagen al seleccionar archivo
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadProfileImage(file); // ← sube y refresca el perfil
    } catch (err) {
      // opcional: manejar error (toast/alerta)
      console.error(err);
    } finally {
      // limpiar el input para poder volver a elegir el mismo archivo si se desea
      e.target.value = "";
    }
  };

  const handleDeleteImage = async () => {
    try {
      await deleteProfileImage();
    } catch (err) {
      console.error(err);
    }
  };


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
              <img src={user?.image || 'rigo-baby.jpg'} alt="Foto empleado" />
              {loading ? <Loader /> :
                <div className="ep-photo__buttons">
                  <button
                    className="ep-btn ep-btn--ghost"
                    type="button"
                    onClick={handleOpenFileDialog}
                    disabled={loading}
                  >
                    Subir
                  </button>
                  <button
                    className="ep-btn ep-btn--ghost"
                    type="button"
                    onClick={handleDeleteImage}
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                  {/* Input de archivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

              }
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
                    <input value={user.id} />
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
