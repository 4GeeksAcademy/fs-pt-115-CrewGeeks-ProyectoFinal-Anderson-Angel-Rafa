import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import './AdminEmpProfile.css';

export const AdminEmpProfile = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [showAddModal, setShowAddModal] = useState(false);

  // estado del nuevo empleado (para el modal)
  const [newEmp, setNewEmp] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    status: 'Active',
    joinDate: '',
    avatar: '',
    role: '',
  });

  // Datos de ejemplo
  const mockEmployees = [
    { id: 1, name: 'Carlos Martínez', position: 'Senior Developer',    department: 'Engineering',      email: 'carlos.martinez@company.com', phone: '+1 234 567 8901', status: 'Active',   joinDate: 'Jan 2023', avatar: 'https://via.placeholder.com/60x60/4F46E5/FFFFFF?text=CM', role: 'Developer' },
    { id: 2, name: 'María Rodríguez',  position: 'Marketing Manager',   department: 'Marketing',        email: 'maria.rodriguez@company.com',  phone: '+1 234 567 8902', status: 'Active',   joinDate: 'Mar 2022', avatar: 'https://via.placeholder.com/60x60/EC4899/FFFFFF?text=MR', role: 'Manager' },
    { id: 3, name: 'David López',      position: 'Sales Representative',department: 'Sales',            email: 'david.lopez@company.com',      phone: '+1 234 567 8903', status: 'On Leave', joinDate: 'Jul 2021', avatar: 'https://via.placeholder.com/60x60/10B981/FFFFFF?text=DL', role: 'Representative' },
    { id: 4, name: 'Ana García',       position: 'HR Specialist',       department: 'Human Resources',  email: 'ana.garcia@company.com',       phone: '+1 234 567 8904', status: 'Active',   joinDate: 'Nov 2022', avatar: 'https://via.placeholder.com/60x60/F59E0B/FFFFFF?text=AG', role: 'Specialist' },
    { id: 5, name: 'Miguel Torres',    position: 'Junior Developer',    department: 'Engineering',      email: 'miguel.torres@company.com',    phone: '+1 234 567 8905', status: 'Active',   joinDate: 'Sep 2023', avatar: 'https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=MT', role: 'Developer' }
  ];

  // OJO: las opciones deben coincidir con los valores de los datos (inglés aquí)
  const departments = ['All Departments','Engineering','Marketing','Sales','Human Resources'];
  const roles       = ['All Roles','Developer','Manager','Representative','Specialist'];

  useEffect(() => {
    setEmployees(mockEmployees);
    setFilteredEmployees(mockEmployees);
  }, []);

  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    }

    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    if (selectedRole !== 'All Roles') {
      filtered = filtered.filter(emp => emp.role === selectedRole);
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, selectedDepartment, selectedRole, employees]);

  const getStatusBadge = (status) => {
    const map = { Active: 'status-active', 'On Leave': 'status-leave', Inactive: 'status-inactive' };
    return map[status] || 'status-inactive';
  };

  const handleViewProfile = (id) => console.log('Ver perfil', id);
  const handleEditProfile = (id) => console.log('Editar perfil', id);

  const handleDeleteProfile = (employeeId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) return;
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  // —— Modal: crear empleado ——
  const openAdd = () => {
    setNewEmp({
      name: '',
      position: '',
      department: departments[1] || 'Engineering',
      email: '',
      phone: '',
      status: 'Active',
      joinDate: '',  // ejemplo: "Apr 2025"
      avatar: '',
      role: roles[1] || 'Developer',
    });
    setShowAddModal(true);
  };

  const onChangeNew = (field, value) =>
    setNewEmp(prev => ({ ...prev, [field]: value }));

  const saveNewEmployee = () => {
    const { name, position, department, email, role } = newEmp;
    if (!name.trim() || !position.trim() || !department || !role) {
      alert('Nombre, Cargo, Departamento y Rol son obligatorios.');
      return;
    }
    const nextId = (employees.reduce((m, e) => Math.max(m, e.id), 0) || 0) + 1;
    const avatarInitials = (name.split(' ').map(p => p[0]).join('').slice(0,2) || 'NP').toUpperCase();
    const avatar = newEmp.avatar || `https://via.placeholder.com/60x60/4F46E5/FFFFFF?text=${avatarInitials}`;

    const joinDate = newEmp.joinDate || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const created = { id: nextId, ...newEmp, avatar, joinDate };
    setEmployees(prev => [created, ...prev]);
    setShowAddModal(false);
  };

  return (
    <section className="content-area">
      <div className="content-header">
        <div className="content-title">Perfil de empleados</div>
        <div className="content-subtitle">Administra los perfiles de tu equipo.</div>
        <div className="header-actions"></div>
      </div>

      <div className="content-body">
        {/* Barra de búsqueda y filtros */}
        <div className="search-filters-section">
          <div className="search-bar">
            <div className="search-input-container">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Busqueda de empleados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-controls">
            <button className="add-employee-btn" onClick={openAdd}>
              <i className="fa-solid fa-plus"></i>
              Nuevo
            </button>

            <select
              className="filter-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de empleados */}
        <div className="employees-grid">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="card-header">
                <div className="employee-avatar">
                  <img src={employee.avatar} alt={employee.name} />
                </div>
                <div className="employee-basic-info">
                  <h3 className="employee-name">{employee.name}</h3>
                  <p className="employee-position">{employee.position}</p>
                  <span className={`status-badge ${getStatusBadge(employee.status)}`}>
                    {employee.status}
                  </span>
                </div>
                <div className="card-actions"></div>
              </div>

              <div className="card-body">
                <div className="contact-info">
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
                    <span className="contact-text">{employee.department}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-calendar contact-icon"></i>
                    <span className="contact-text">Joined: {employee.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button className="btn-primary btn-view" onClick={() => handleViewProfile(employee.id)}>
                  Ver Perfil
                </button>
                <button className="btn-secondary btn-edit" onClick={() => handleEditProfile(employee.id)}>
                  Editar
                </button>
                <button className="btn-secondary btn-delete" onClick={() => handleDeleteProfile(employee.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa-solid fa-users-slash"></i>
            </div>
            <h3>No se encontraron empleados</h3>
            <p>Intenta ajustar los filtros de búsqueda o agregar nuevos empleados.</p>
          </div>
        )}
      </div>

      {/* Modal para crear empleado */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo empleado</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <label className="modal-field">
                  <span>Nombre</span>
                  <input value={newEmp.name} onChange={(e)=>onChangeNew('name', e.target.value)} />
                </label>
                <label className="modal-field">
                  <span>Cargo</span>
                  <input value={newEmp.position} onChange={(e)=>onChangeNew('position', e.target.value)} />
                </label>
                <label className="modal-field">
                  <span>Departamento</span>
                  <select value={newEmp.department} onChange={(e)=>onChangeNew('department', e.target.value)}>
                    {departments.filter(d=>d!=='All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="modal-field">
                  <span>Rol</span>
                  <select value={newEmp.role} onChange={(e)=>onChangeNew('role', e.target.value)}>
                    {roles.filter(r=>r!=='All Roles').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="modal-field">
                  <span>Email</span>
                  <input type="email" value={newEmp.email} onChange={(e)=>onChangeNew('email', e.target.value)} />
                </label>
                <label className="modal-field">
                  <span>Teléfono</span>
                  <input value={newEmp.phone} onChange={(e)=>onChangeNew('phone', e.target.value)} />
                </label>
                <label className="modal-field">
                  <span>Estado</span>
                  <select value={newEmp.status} onChange={(e)=>onChangeNew('status', e.target.value)}>
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </label>
                <label className="modal-field">
                  <span>Fecha de ingreso</span>
                  <input placeholder="Apr 2025" value={newEmp.joinDate} onChange={(e)=>onChangeNew('joinDate', e.target.value)} />
                </label>
                <label className="modal-field modal-col-2">
                  <span>Avatar (URL opcional)</span>
                  <input value={newEmp.avatar} onChange={(e)=>onChangeNew('avatar', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveNewEmployee}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
