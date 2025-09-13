import "./ContactForm.css"
//import { useFetch } from "../../hooks/useFetch";

export const ContactForm = () => {

  // const options = {
  //     method: "POST",
  //     headers: {},
  //     body: {}

  // }
  // const {data, error, loading} = useFetch('/employees', options )

  // console.log(data);

  // if(loading || !data) {
  //     return <p>Cagando....</p>
  // }

  {/* {error && <p>{error}</p>}
          {
              data.map(e => (
                  <p key={e.id}>{e.first_name}</p>
              ))
          } */}
  return (
    <>
      <section className="cg-contact" id="contact">
        <div className="cg-container">
          <h2>Contacto</h2>
          <p className="cg-lead">Cuéntanos brevemente tu caso y te responderemos con los siguientes pasos. Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.</p>

          <div className="cg-contact-card">
            <form className="cg-form" action="#" method="post">
              <div className="cg-form-grid">
                
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-name">Nombre completo <span className="cg-required" aria-hidden="true">*</span></label>
                  <input className="cg-input" type="text" id="cg-name" name="name" autoComplete="name" required/>
                </div>

                
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-email">Email <span className="cg-required" aria-hidden="true">*</span></label>
                  <input className="cg-input" type="email" id="cg-email" name="email" autoComplete="email" required/>
                </div>

                
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-company">Empresa / centro</label>
                  <input className="cg-input" type="text" id="cg-company" name="company" autoComplete="organization"/>
                </div>

                
                <div className="cg-field">
                  <label className="cg-label" htmlFor="cg-phone">Teléfono <span className="cg-required" aria-hidden="true">*</span></label>
                  <input className="cg-input" type="tel" id="cg-phone" name="phone" autoComplete="tel"/>
                </div>

                
                <div className="cg-field cg-col-span-2">
                  <label className="cg-label" htmlFor="cg-subject">Asunto</label>
                  <input className="cg-input" type="text" id="cg-subject" name="subject" placeholder="Ej.: Duda sobre control horario"/>
                </div>

              
                <div className="cg-field cg-col-span-2">
                  <label className="cg-label" htmlFor="cg-message">Mensaje <span className="cg-required" aria-hidden="true">*</span></label>
                  <textarea className="cg-textarea" id="cg-message" name="message" required></textarea>
                </div>

                
                <div className="cg-col-span-2 cg-consent">
                  <input type="checkbox" id="cg-consent" name="consent" required/>
                    <label htmlFor="cg-consent">He leído y acepto la política de privacidad (RGPD). <span className="cg-required" aria-hidden="true">*</span></label>
                </div>

              
                <div className="cg-col-span-2 cg-actions">
                  <button className="cg-btn cg-btn--primary" type="submit">Enviar mensaje</button>
                  <a className="cg-btn cg-btn--secondary" href="mailto:contacto@tu-dominio.com">Escribir por correo</a>
                </div>

                <div className="cg-col-span-2 cg-small">
                  Al enviar aceptas que almacenemos tu consulta para poder responderte.
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>





    </>

  );
};