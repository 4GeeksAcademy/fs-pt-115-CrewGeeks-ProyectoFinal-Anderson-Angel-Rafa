import React, { useState, useRef } from "react";
import "./EmployeeProfile.css";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../Loader/Loader";

export const EmployeeProfile = () => {

  const { user, token, loading, uploadProfileImage, deleteProfileImage } = useAuth();

  console.log(user);

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

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
      await uploadProfileImage(file);
    } catch (err) {

      console.error(err);
    } finally {

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

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resetPwdForm = () => {
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
  };

  const closePwdModal = () => {
    if (pwdLoading) return;
    setShowPwdModal(false);
    resetPwdForm();
  };

  const submitPwdChange = async (e) => {
    e?.preventDefault?.();
    setPwdError("");

    // Validaciones simples
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError("Por favor, completa todos los campos.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setPwdLoading(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL + "/api";
      const resp = await fetch(`${baseUrl}/employees/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPwd,
          new_password: newPwd,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setPwdError(data?.error || "No se pudo cambiar la contraseña.");
        return;
      }

      // Éxito
      closePwdModal();
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setPwdError("Error inesperado al cambiar la contraseña.");
    } finally {
      setPwdLoading(false);
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

          <div className="employee-profile__left">

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
              </div>
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


          <div className="employee-profile__right">

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
                >
                  <label>
                    Nombre
                    <input
                      value={user.first_name}
                    />
                  </label>
                  <label>
                    Apellidos
                    <input
                      value={user.last_name}
                    />
                  </label>
                  <label>
                    DNI
                    <input
                      value={user.dni}
                    />
                  </label>
                  <label>
                    Fecha Nac.
                    <input
                      type="date"
                      value={user.birth}
                    />
                  </label>
                  <label>
                    Dirección
                    <input
                      value={user.address}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={user.email}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      value={user.phone}
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
                    onClick={() => setShowPwdModal(true)}
                  >
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPwdModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Cambiar contraseña</h3>
              <button
                type="button"
                className="modal-close"
                onClick={closePwdModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form className="modal-body" onSubmit={submitPwdChange}>
              <label className="modal-field">
                <span>Contraseña actual</span>
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="modal-field">
                <span>Nueva contraseña</span>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                />
              </label>

              <label className="modal-field">
                <span>Confirmar nueva contraseña</span>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </label>

              {pwdError && <div className="modal-error">{pwdError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="ep-btn ep-btn--ghost"
                  onClick={closePwdModal}
                  disabled={pwdLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ep-btn ep-btn--primary"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Éxito</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>✅ La contraseña se actualizó correctamente.</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ep-btn ep-btn--primary"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
