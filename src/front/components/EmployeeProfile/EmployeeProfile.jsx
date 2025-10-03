import React, { useState, useRef, useEffect } from "react";
import "./EmployeeProfile.css";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../Loader/Loader";
import { editEmployee } from "../../services/employeesAPI";
import Swal from "sweetalert2";

export const EmployeeProfile = () => {
  const { user, token, uploadProfileImage, deleteProfileImage } = useAuth();

  
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#F8FAFC",
    color: "#121A2D",
  });

  // ====== Estado visible del perfil ======
  const [profile, setProfile] = useState(user || {});
  useEffect(() => {
    setProfile(user || {});
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // ====== Helper: YYYY-MM-DD -> DD/MM/YYYY ======
  const formatDateDisplay = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  // Evita caché de imágenes antiguas
  const bustCache = (url) => {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}t=${Date.now()}`;
  };

  // ====== Estado del formulario de edición ======
  const [form, setForm] = useState({
    id: user?.id || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    dni: user?.dni || "",
    birth: user?.birth || "", // YYYY-MM-DD
    address: user?.address || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (isEditing) {
      setForm({
        id: profile?.id || "",
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        dni: profile?.dni || "",
        birth: profile?.birth || "",
        address: profile?.address || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
      });
    }
  }, [isEditing, profile]);

  const handleChange = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const toggleEdit = () => setIsEditing((previous) => !previous);

  // ====== IMAGEN: preview + subida + refresco ======
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);

  const handleOpenFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setImgUploading(true);
      // Loading durante la subida
      Swal.fire({
        title: "Subiendo imagen...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#F8FAFC",
        color: "#121A2D",
      });

      await uploadProfileImage(file);
      Swal.close();
      setAvatarPreview(null);
      Toast.fire({ icon: "success", title: "Imagen actualizada" });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Error al subir la imagen",
        text: error?.message || "Inténtalo de nuevo.",
        icon: "error",
        background: "#F8FAFC",
        color: "#121A2D",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#121A2D",
      });
    } finally {
      setImgUploading(false);
      event.target.value = "";
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleDeleteImage = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Eliminar foto de perfil?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#F8FAFC",
      color: "#121A2D",
      confirmButtonColor: "#121A2D",
      cancelButtonColor: "#e11d48",
    });
    if (!isConfirmed) return;

    try {
      setImgUploading(true);
      Swal.fire({
        title: "Eliminando imagen...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#F8FAFC",
        color: "#121A2D",
      });
      await deleteProfileImage();
      Swal.close();
      setAvatarPreview(null);
      Toast.fire({ icon: "success", title: "Imagen eliminada" });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Error al eliminar la imagen",
        text: error?.message || "No se pudo eliminar.",
        icon: "error",
        background: "#F8FAFC",
        color: "#121A2D",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#121A2D",
      });
    } finally {
      setImgUploading(false);
    }
  };

  // ====== CAMBIAR CONTRASEÑA (Swal con formulario) ======
  const handleChangePasswordSwal = async () => {
    const { value, isConfirmed } = await Swal.fire({
      title: "Cambiar contraseña",
      html: `
        <div class="cg-swal-grid">
          <label style="display:block; text-align:left; margin-bottom:8px;">
            <span>Contraseña actual</span>
            <input type="password" id="swal-old" class="swal2-input" placeholder="Actual" style="margin:0; width:100%;" />
          </label>
          <label style="display:block; text-align:left; margin-bottom:8px;">
            <span>Nueva contraseña</span>
            <input type="password" id="swal-new" class="swal2-input" placeholder="Mín. 8 caracteres" style="margin:0; width:100%;" />
          </label>
          <label style="display:block; text-align:left; margin-bottom:8px;">
            <span>Confirmar nueva contraseña</span>
            <input type="password" id="swal-confirm" class="swal2-input" placeholder="Repetir" style="margin:0; width:100%;" />
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#F8FAFC",
      color: "#121A2D",
      confirmButtonColor: "#121A2D",
      cancelButtonColor: "#e11d48",
      preConfirm: () => {
        const oldPassword = document.getElementById("swal-old").value;
        const newPassword = document.getElementById("swal-new").value;
        const confirmPassword = document.getElementById("swal-confirm").value;

        if (!oldPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage("Por favor, completa todos los campos.");
          return;
        }
        if (newPassword.length < 8) {
          Swal.showValidationMessage("La nueva contraseña debe tener al menos 8 caracteres.");
          return;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage("Las contraseñas no coinciden.");
          return;
        }
        return { oldPassword, newPassword };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#F8FAFC",
        color: "#121A2D",
      });

      const baseUrl = import.meta.env.VITE_BACKEND_URL + "/api";
      const response = await fetch(`${baseUrl}/employees/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: value.oldPassword, new_password: value.newPassword }),
      });

      const data = await response.json().catch(() => ({}));
      Swal.close();

      if (!response.ok) {
        await Swal.fire({
          title: "No se pudo cambiar la contraseña",
          text: data?.error || "Inténtalo de nuevo.",
          icon: "error",
          background: "#F8FAFC",
          color: "#121A2D",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#121A2D",
        });
        return;
      }

      Toast.fire({ icon: "success", title: "Contraseña actualizada" });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Error inesperado",
        text: error?.message || "No se pudo cambiar la contraseña.",
        icon: "error",
        background: "#F8FAFC",
        color: "#121A2D",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#121A2D",
      });
    }
  };

  // ====== GUARDAR PERFIL ======
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSave = async () => {
    try {
      setSavingProfile(true);

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        dni: form.dni,
        birth: form.birth,
        address: form.address,
        email: form.email,
        phone: form.phone,
      };

      let updated = null;
      try {
        updated = await editEmployee(form.id, payload);
      } catch {
        const baseUrl = import.meta.env.VITE_BACKEND_URL + "/api";
        const response = await fetch(`${baseUrl}/employees/${form.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || "Error al actualizar el perfil.");
        }
        updated = await response.json().catch(() => ({}));
      }

      const nextProfile =
        updated && typeof updated === "object" && Object.keys(updated).length
          ? updated
          : { ...profile, ...payload };

      setProfile(nextProfile);
      setIsEditing(false);
      Toast.fire({ icon: "success", title: "Perfil actualizado" });
    } catch (error) {
      await Swal.fire({
        title: "Error al actualizar el perfil",
        text: error?.message || "Inténtalo de nuevo.",
        icon: "error",
        background: "#F8FAFC",
        color: "#121A2D",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#121A2D",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <section className="content-area">
      <div className="content-header">
        <div className="content-title">Mi perfil</div>
        <div className="content-subtitle">
          Gestiona tu información personal y la configuración de tu cuenta
        </div>
      </div>

      <div className="content-body">
        <div className="employee-profile__wrapper">
          {/* Columna izquierda */}
          <div className="employee-profile__left">
            {/* Foto */}
            <div className="ep-box ep-photo">
              {imgUploading ? (
                <Loader />
              ) : (
                <img
                  src={
                    avatarPreview
                      ? avatarPreview
                      : profile?.image
                      ? bustCache(profile.image)
                      : "rigo-baby.jpg"
                  }
                  alt="Foto empleado"
                />
              )}
              <div className="ep-photo__buttons">
                <button
                  className="ep-btn ep-btn--ghost"
                  type="button"
                  onClick={handleOpenFileDialog}
                  disabled={imgUploading}
                >
                  Subir
                </button>
                <button
                  className="ep-btn ep-btn--ghost"
                  type="button"
                  onClick={handleDeleteImage}
                  disabled={imgUploading}
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

            {/* Datos laborales */}
            <div className="ep-box ep-company">
              <h3>Datos Laborales</h3>
              <div className="ep-company__list">
                <p>
                  <strong>Empresa:</strong> {profile.company}
                </p>
                <p>
                  <strong>Cargo/Rol:</strong> {profile.role_id}
                </p>
                <p>
                  <strong>Antigüedad:</strong> {formatDateDisplay(profile.seniority)}
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
                    <strong>Nombre:</strong> {profile.first_name}
                  </p>
                  <p>
                    <strong>Apellidos:</strong> {profile.last_name}
                  </p>
                  <p>
                    <strong>DNI:</strong> {profile.dni}
                  </p>
                  <p>
                    <strong>Año de nacimiento:</strong> {formatDateDisplay(profile.birth)}
                  </p>
                  <p>
                    <strong>Dirección:</strong> {profile.address}
                  </p>
                  <p>
                    <strong>Email:</strong> {profile.email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {profile.phone}
                  </p>
                  <p>
                    <strong>ID empleado:</strong> {profile.id}
                  </p>
                </div>
              ) : (
                <form className="ep-personal__grid" onSubmit={(event) => event.preventDefault()}>
                  <label>
                    Nombre
                    <input value={form.first_name} onChange={handleChange("first_name")} />
                  </label>
                  <label>
                    Apellidos
                    <input value={form.last_name} onChange={handleChange("last_name")} />
                  </label>
                  <label>
                    DNI
                    <input value={form.dni} onChange={handleChange("dni")} />
                  </label>
                  <label>
                    Fecha Nac.
                    <input type="date" value={form.birth} onChange={handleChange("birth")} />
                  </label>
                  <label>
                    Dirección
                    <input value={form.address} onChange={handleChange("address")} />
                  </label>
                  <label>
                    Email
                    <input type="email" value={form.email} onChange={handleChange("email")} />
                  </label>
                  <label>
                    Teléfono
                    <input value={form.phone} onChange={handleChange("phone")} />
                  </label>
                  <label>
                    ID empleado
                    <input value={form.id} readOnly />
                  </label>
                </form>
              )}

              <div className="ep-actions">
                <button
                  className="ep-btn ep-btn--primary"
                  type="button"
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={savingProfile}
                >
                  {isEditing ? (savingProfile ? "Guardando..." : "Actualizar") : "Editar"}
                </button>
                {isEditing && (
                  <button
                    className="ep-btn ep-btn--ghost"
                    type="button"
                    onClick={toggleEdit}
                    disabled={savingProfile}
                    style={{ marginLeft: 8 }}
                  >
                    Cancelar
                  </button>
                )}
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
                    onClick={handleChangePasswordSwal}
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

