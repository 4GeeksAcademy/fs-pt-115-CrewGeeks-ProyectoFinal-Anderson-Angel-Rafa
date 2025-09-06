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
            <div className="container">
                {/* {error && <p>{error}</p>}
                {
                    data.map(e => (
                        <p key={e.id}>{e.first_name}</p>
                    ))
                } */}
               <form>
                <h1>Contacta con nosotros</h1>
                <input type="text" id="firstName" placeholder="First Name" required/>
                <input type="text" id="lastName" placeholder="Last Name" required/>
                <input type="email" id="email" placeholder="Email" required/>
                <input type="text" id="mobile" placeholder="movil" required/>
                <h4>Type Your Message Here...</h4>
                <textarea required></textarea>
                <input type="submit" value={"send"} id="button-Form"></input>
               </form>
            </div>

        </>

    );
};