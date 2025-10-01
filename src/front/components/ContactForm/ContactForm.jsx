import "./ContactForm.css";
import { useState } from "react";

export const ContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(null); 
  const [errorMsg, setErrorMsg] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };
  
  const urlApi = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOk(null);
    setErrorMsg("");

    if (!form.consent) return;

    setLoading(true);
    try {
      const res = await fetch(`${urlApi}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim(),
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      setOk("success");
      setForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: "",
        consent: false,
      });
    } catch (err) {
      setOk("error");
      setErrorMsg(err.message || "No se pudo enviar el formulario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="cg-contact" id="contact">
        <div className="cg-container">
          <h2>Contacto</h2>
          <p className="cg-lead">
            Cuéntanos brevemente tu caso y te responderemos con los siguientes pasos. Los campos marcados con{" "}
            <span aria-hidden="true">*</span> son obligatorios.
          </p>

          <div className="cg-contact-card">
            <form className="cg-form" onSubmit={handleSubmit} noValidate>
              <div className="cg-form-grid">
                {/* Nombre */}
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-name">
                    Nombre completo <span className="cg-required" aria-hidden="true">*</span>
                  </label>
                  <input
                    className="cg-input"
                    type="text"
                    id="cg-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={onChange}
                  />
                </div>

                {/* Email */}
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-email">
                    Email <span className="cg-required" aria-hidden="true">*</span>
                  </label>
                  <input
                    className="cg-input"
                    type="email"
                    id="cg-email"
                    name="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={onChange}
                  />
                </div>

                {/* Empresa */}
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-company">Empresa / centro</label>
                  <input
                    className="cg-input"
                    type="text"
                    id="cg-company"
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={onChange}
                  />
                </div>

                {/* Teléfono */}
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-phone">
                    Teléfono <span className="cg-required" aria-hidden="true">*</span>
                  </label>
                  <input
                    className="cg-input"
                    type="tel"
                    id="cg-phone"
                    name="phone"
                    autoComplete="tel"
                    required
                    value={form.phone}
                    onChange={onChange}
                  />
                </div>

                {/* Asunto */}
                <div className="cg-field cg-col-span-2">
                  <label className="cg-label" htmlFor="cg-subject">Asunto</label>
                  <input
                    className="cg-input"
                    type="text"
                    id="cg-subject"
                    name="subject"
                    placeholder="Ej.: Duda sobre control horario"
                    value={form.subject}
                    onChange={onChange}
                  />
                </div>

                {/* Mensaje */}
                <div className="cg-field cg-col-span-2">
                  <label className="cg-label" htmlFor="cg-message">
                    Mensaje <span className="cg-required" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    className="cg-textarea"
                    id="cg-message"
                    name="message"
                    required
                    value={form.message}
                    onChange={onChange}
                  />
                </div>

                {/* Consentimiento */}
                <div className="cg-col-span-2 cg-consent">
                  <input
                    type="checkbox"
                    id="cg-consent"
                    name="consent"
                    required
                    checked={form.consent}
                    onChange={onChange}
                  />
                  <label htmlFor="cg-consent">
                    He leído y acepto la política de privacidad (RGPD).{" "}
                    <span className="cg-required" aria-hidden="true">*</span>
                  </label>
                </div>

                {/* Acciones */}
                <div className="cg-col-span-2 cg-actions">
                  <button
                    className="cg-btn cg-btn--primary"
                    type="submit"
                    disabled={loading || !form.consent}
                    aria-busy={loading ? "true" : "false"}
                  >
                    {loading ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </div>

                {/* Nota legal */}
                <div className="cg-col-span-2 cg-small">
                  Al enviar aceptas que almacenemos tu consulta para poder responderte.
                </div>

                {/* Estados */}
                <div className="cg-col-span-2" aria-live="polite">
                  {ok === "success" && (
                    <p className="cg-success">¡Gracias! Hemos recibido tu consulta y te contactaremos pronto.</p>
                  )}
                  {ok === "error" && (
                    <p className="cg-error">Hubo un problema: {errorMsg}</p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};
