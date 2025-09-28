import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { createEmployee, getAllEmployees, editEmployee, deleteEmployee } from "../../services/employeesAPI";
import './AdminEmpProfile.css';

export const AdminEmpProfile = () => {
  // const { createEmployee, token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [empData, setEmpData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    birth: '',
    address: '',
    phone: '',
    email: '',
    company_id: '',
    role_id: '',
    seniority: '',
    image: ''
  });

  const normalizeText = (text) => {
    const s = (text ?? "").toString(); // fuerza string
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "");
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error('Error cargando empleados:', err);
      setError('Error al cargar empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      filtered = filtered.filter(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        return normalizeText(fullName).includes(normalizedSearch) ||
          normalizeText(emp.role_id || '').includes(normalizedSearch) ||
          normalizeText(emp.company_id || '').includes(normalizedSearch) ||
          normalizeText(emp.email || '').includes(normalizedSearch) ||
          (emp.dni && emp.dni.toLowerCase().includes(normalizedSearch)) ||
          (emp.id && emp.id.toString().includes(normalizedSearch));
      });
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const formatDateDisplay = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const resetEmpData = () => {
    setEmpData({
      first_name: '',
      last_name: '',
      dni: '',
      birth: '',
      address: '',
      phone: '',
      email: '',
      company_id: '',
      role_id: '',
      seniority: '',
      image: ''
    });
  };

  // Avatar local sin red (data URI SVG)
  const generateAvatar = (first = "", last = "", size = 60, bg = "8B5CF6", fg = "FFFFFF") => {
    const initials = `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}` || "CG";
    const fontSize = Math.round(size * 0.45);
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
      <rect width='100%' height='100%' fill='#${bg}'/>
      <text x='50%' y='50%' dy='.35em' text-anchor='middle'
            font-family='Inter, Arial, sans-serif' font-size='${fontSize}'
            fill='#${fg}'>${initials}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // Normaliza la imagen para no usar placeholder externo
  const safeImage = (img, first, last) => {
    if (!img) return generateAvatar(first, last);
    if (/placeholder\.com/i.test(img)) return generateAvatar(first, last);
    return img;
  };

  const openAdd = () => {
    resetEmpData();
    setEmpData(prev => ({
      ...prev,
      seniority: new Date().toISOString().split('T')[0]
    }));
    setIsEditing(false);
    setEditingId(null);
    setShowAddModal(true);
  };

  const handleEditProfile = (id) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      setEmpData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        dni: employee.dni || '',
        birth: employee.birth || '',
        address: employee.address || '',
        phone: employee.phone || '',
        email: employee.email || '',
        company_id: employee.company_id || '',
        role_id: employee.role_id || '',
        seniority: employee.seniority || '',
        image: employee.image || ''
      });
      setIsEditing(true);
      setEditingId(id);
      setShowAddModal(true);
    }
  };

  const handleDeleteProfile = async (employeeId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) return;

    try {
      setLoading(true);
      await deleteEmployee(employeeId);
      await loadEmployees();
      alert('Empleado eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando empleado:', err);
      alert('Error al eliminar empleado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmpData = (field, value) =>
    setEmpData(prev => ({ ...prev, [field]: value }));

  const saveEmployee = async () => {
    const { first_name, last_name, dni, email } = empData;

    // Validaciones extra (backend exige estos campos)
    if (!empData.birth?.trim()) {
      alert('La fecha de nacimiento es obligatoria.');
      return;
    }
    if (!empData.address?.trim()) {
      alert('La dirección es obligatoria.');
      return;
    }
    if (!empData.phone?.trim()) {
      alert('El teléfono es obligatorio.');
      return;
    }
    if (!empData.role_id?.toString().trim()) {
      alert('El rol (role_id) es obligatorio.');
      return;
    }
    if (!empData.seniority?.trim()) {
      alert('La fecha de ingreso es obligatoria.');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await editEmployee(editingId, empData);
        alert('Empleado actualizado correctamente');
      } else {
        const payload = { ...empData };

        // role_id numérico
        payload.role_id = Number(payload.role_id);

        // avatar local si no hay imagen o si vino placeholder
        if (!payload.image || /placeholder\.com/i.test(payload.image)) {
          payload.image = generateAvatar(payload.first_name, payload.last_name);
        }

        // si el backend exige password, envíalo
        if (!payload.password) {
          payload.password = payload.dni || payload.email;
        }

        const created = await createEmployee(payload);

        if (typeof setSearchTerm === "function") setSearchTerm("");

        if (created && created.id) {
          setEmployees(prev => [created, ...(Array.isArray(prev) ? prev : [])]);
          setFilteredEmployees(prev => {
            const base = Array.isArray(prev) ? prev : employees;
            return [created, ...base];
          });
        }

        alert('Empleado creado correctamente');
      }


      // 3) sincronizar desde servidor (ya sin cache)
      await loadEmployees();

      setShowAddModal(false);
      resetEmpData();
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error guardando empleado:', err);
      alert('Error al guardar empleado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-area">
      <div className="content-header">
        <div className="content-title">Perfil de empleados</div>
        <div className="content-subtitle">Administra los perfiles de tu equipo.</div>
      </div>

      <div className="content-body">
        <div className="search-filters-section">
          <div className="search-bar">
            <div className="search-input-container">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar empleados (nombre, cargo, email, DNI...)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-controls">
            <button
              className="add-employee-btn"
              onClick={openAdd}
              disabled={loading}
            >
              <i className="fa-solid fa-plus"></i>
              Nuevo
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadEmployees} disabled={loading}>
              Reintentar
            </button>
          </div>
        )}

        {loading && <div className="loading-message">Cargando...</div>}

        <div className="employees-grid">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="card-header">
                <div className="employee-avatar">
                  <img
                    src={safeImage(employee.image, employee.first_name, employee.last_name)}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    onError={(e) => {
                      // evita loop infinito
                      if (!e.currentTarget.src.startsWith("data:image/svg+xml")) {
                        e.currentTarget.src = generateAvatar(employee.first_name, employee.last_name);
                      }
                    }}
                  />
                </div>
                <div className="employee-basic-info">
                  <h3 className="employee-name">{employee.first_name} {employee.last_name}</h3>
                  <p className="employee-position">{employee.role_id}</p>
                </div>
              </div>

              <div className="card-body">
                <div className="contact-info">
                  <div className="contact-item">
                    <i className="fa-solid fa-id-card contact-icon"></i>
                    <span className="contact-text">DNI: {employee.dni}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-hashtag contact-icon"></i>
                    <span className="contact-text">ID: {employee.id}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-envelope contact-icon"></i>
                    <span className="contact-text">{employee.email}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-phone contact-icon"></i>
                    <span className="contact-text">{employee.phone}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-building contact-icon"></i>
                    <span className="contact-text">{employee.company_id}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-calendar contact-icon"></i>
                    <span className="contact-text">Ingreso: {formatDateDisplay(employee.seniority)}</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn-primary btn-edit"
                  onClick={() => handleEditProfile(employee.id)}
                  disabled={loading}
                >
                  Editar
                </button>
                <button
                  className="btn-secondary btn-delete"
                  onClick={() => handleDeleteProfile(employee.id)}
                  disabled={loading}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa-solid fa-users-slash"></i>
            </div>
            <h3>No se encontraron empleados</h3>
            <p>Intenta ajustar los filtros de búsqueda o agregar nuevos empleados.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Editar empleado' : 'Nuevo empleado'}</h3>
              <button
                className="modal-close"
                onClick={() => !loading && setShowAddModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <label className="modal-field">
                  <span>Nombre *</span>
                  <input
                    value={empData.first_name}
                    onChange={(e) => onChangeEmpData('first_name', e.target.value)}
                    placeholder="Nombre del empleado"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Apellidos *</span>
                  <input
                    value={empData.last_name}
                    onChange={(e) => onChangeEmpData('last_name', e.target.value)}
                    placeholder="Apellidos del empleado"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>DNI *</span>
                  <input
                    value={empData.dni}
                    onChange={(e) => onChangeEmpData('dni', e.target.value)}
                    placeholder="12345678A"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={empData.birth}
                    onChange={(e) => onChangeEmpData('birth', e.target.value)}
                    disabled={loading}
                  />
                </label>
                <label className="modal-field modal-col-2">
                  <span>Dirección</span>
                  <input
                    value={empData.address}
                    onChange={(e) => onChangeEmpData('address', e.target.value)}
                    placeholder="Calle, número, ciudad"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Teléfono</span>
                  <input
                    value={empData.phone}
                    onChange={(e) => onChangeEmpData('phone', e.target.value)}
                    placeholder="+34 600 000 000"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Email *</span>
                  <input
                    type="email"
                    value={empData.email}
                    onChange={(e) => onChangeEmpData('email', e.target.value)}
                    placeholder="empleado@empresa.com"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Empresa</span>
                  <input
                    value={empData.company_id}
                    type='number'
                    onChange={(e) => onChangeEmpData('company_id', e.target.value)}
                    placeholder="1"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Cargo/Rol (role_id numérico)</span>
                  <input
                    type="number"
                    value={empData.role_id}
                    onChange={(e) => onChangeEmpData('role_id', e.target.value)}
                    placeholder="1"
                    disabled={loading}
                  />
                </label>
                <label className="modal-field">
                  <span>Fecha de ingreso</span>
                  <input
                    type="date"
                    value={empData.seniority}
                    onChange={(e) => onChangeEmpData('seniority', e.target.value)}
                    disabled={loading}
                  />
                </label>
                <label className="modal-field modal-col-2">
                  <span>Avatar (URL opcional)</span>
                  <input
                    value={empData.image}
                    onChange={(e) => onChangeEmpData('image', e.target.value)}
                    placeholder="Si no se especifica, se generará automáticamente"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => !loading && setShowAddModal(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={saveEmployee}
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};