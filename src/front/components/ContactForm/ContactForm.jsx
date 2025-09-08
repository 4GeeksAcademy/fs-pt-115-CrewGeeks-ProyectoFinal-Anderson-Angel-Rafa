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

  return (
    <>
      <section className="contact-section">
        {/* {error && <p>{error}</p>}
                {
                    data.map(e => (
                        <p key={e.id}>{e.first_name}</p>
                    ))
                } */}

        <form id="contacto" className="contact-card" noValidate>
          <h2 className="contact-title">CONTACTA CON NOSOTROS</h2>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstname">Nombre</label>
              <input id="firstname" type="text" placeholder="Tu nombre" />
            </div>

            <div className="field">
              <label htmlFor="lastname">Apellido</label>
              <input id="lastname" type="text" placeholder="Tus apellidos" />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="tu@email.com" />
            </div>

            <div className="field">
              <label htmlFor="mobile">Móvil</label>
              <input id="mobile" type="tel" placeholder="+34 600 000 000" />
            </div>

            <div className="field field--full">
              <label htmlFor="message">¡CUENTANOS!</label>
              <textarea id="message" rows="5" placeholder="Escribe tu mensaje..." />
            </div>
          </div>

          <button id="button-Form" type="submit">Enviar</button>
        </form>
      </section>




    </>

  );
};