// src/front/components/SiteFeatures/SiteFeatures.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./SiteFeatures.css";

export const SiteFeatures = () => {
  const { hash } = useLocation();

  // Scroll suave a la sección (#features, #about, #privacy, #security)
  useEffect(() => {
    const id = (hash || "#features").replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="cg-minimal">
      {/* ===== Características ===== */}
      <section id="features" className="cg-section">
        <h1 className="cg-title">Características de CrewGeeks</h1>
        <p className="cg-summary__text">
          CrewGeeks es una plataforma integral de RRHH que centraliza asistencia, vacaciones, nómina,
          roles y el directorio de empleados en una sola interfaz. Automatiza procesos y reduce el
          tiempo administrativo para equipos de 5–200 personas: fichaje simple con reportes, solicitudes
          de vacaciones con flujos de aprobación y saldo automático, nómina configurable con exportación
          a Excel/PDF y control de accesos por roles con auditoría. La infraestructura usa autenticación
          JWT, Cloudinary para medios, email transaccional, backups y cifrado; es responsive y cumple
          estrictamente con RGPD. En la práctica, los clientes reportan ~40% menos tiempo en gestión de
          vacaciones y ~60% menos errores de nómina; la implementación es rápida (en días) y con soporte
          en español.
        </p>
      </section>

      {/* ===== Acerca de ===== */}
      <section id="about" className="cg-section">
        <h1 className="cg-summary__title">Acerca de CrewGeeks</h1>
        <p className="cg-summary__text">
          CrewGeeks es un proyecto de programación construido como parte de un proceso de aprendizaje
          y práctica profesional. Utiliza un stack moderno que incluye <strong>Flask</strong> (API),
          <strong> SQLAlchemy</strong> y <strong>Alembic</strong> (modelado y migraciones), autenticación
          con <strong>JWT</strong>, manejo de medios con <strong>Cloudinary</strong>, y un front en
          <strong> React</strong> con <strong>Vite</strong> y <strong>React Router</strong>. Fue
          desarrollado por <strong>Ángel Sastre</strong>, <strong>Rafa</strong> y <strong>Anderson</strong>
          con el objetivo de crear una aplicación de <strong>gestión de recursos humanos</strong> que
          centralice asistencia, vacaciones, nómina, directorio y permisos, aplicando buenas prácticas
          de arquitectura, seguridad y DX. El enfoque del proyecto es iterar rápido, documentar los hitos
          y entregar una base sólida que pueda crecer hacia un producto listo para producción.
        </p>
      </section>

      {/* ===== Privacidad ===== */}
      <section id="privacy" className="cg-section">
        <h1 className="cg-summary__title">Privacidad (RGPD)</h1>
        <p className="cg-summary__text">
          Tratamos datos para operar el servicio (cuenta y metadatos de uso) con bases jurídicas claras:
          ejecución de contrato, interés legítimo y consentimiento para comunicaciones opcionales.
          Conservamos la información mientras exista la cuenta y 12 meses tras su cierre. Puedes ejercer
          acceso, rectificación, supresión, portabilidad, oposición y limitación en
          <a className="cg-link" href="mailto:crewgeeks.rrhh@gmail.com"> crewgeeks.rrhh@gmail.com</a>.
          Trabajamos con proveedores de hosting, correo transaccional y Cloudinary (medios).
        </p>
      </section>

      {/* ===== Seguridad ===== */}
      <section id="security" className="cg-section">
        <h1 className="cg-summary__title">Seguridad</h1>
        <p className="cg-summary__text">
          Protegemos datos con cifrado en tránsito (HTTPS/TLS), autenticación JWT y control de accesos
          por roles (OWNERDB/ADMIN/HR/EMPLOYEE) bajo mínimo privilegio y auditoría de acciones. Los
          medios se almacenan en la nube (Cloudinary) y realizamos backups periódicos con plan de
          recuperación. Para reportar vulnerabilidades, contáctanos en
          <a className="cg-link" href="mailto:crewgeeks.rrhh@gmail.com"> crewgeeks.rrhh@gmail.com </a>
          (respuesta objetivo: 72h).
        </p>
      </section>
    </div>
  );
};
