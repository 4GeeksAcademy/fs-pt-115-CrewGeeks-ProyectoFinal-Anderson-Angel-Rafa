

export const Formulario = () => {
    return (
        <>
            <div className="container">
               <form>
                <h1>Contacta con nosotros</h1>
                <input type="text" id="firstName" placeholder="First Name" required/>
                <input type="text" id="lastName" placeholder="Last Name" required/>
                <input type="email" id="email" placeholder="Email" required/>
                <input type="text" id="mobile" placeholder="movil" required/>
                <h4>Type Your Message Here...</h4>
                <textarea required></textarea>
                <input type="submit" value={"send"} id="button"></input>
               </form>
            </div>










        </>

    );
};