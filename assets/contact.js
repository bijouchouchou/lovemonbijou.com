// ------------------------------------------------------
// FORMULAIRE CONTACT — Envoi par EmailJS (fichier séparé)
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    // Vérification simple
    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!name || !email || !message) {
            alert("Merci de remplir tous les champs.");
            return;
        }

        const params = {
            user_name: name,
            user_email: email,
            user_message: message
        };

        // Envoi EmailJS
        emailjs.send("service_xafynxq", "template_t7w9uuf", params)
            .then(() => {
                alert("Votre message a bien été envoyé. Merci !");
                contactForm.reset();
            })
            .catch((err) => {
                console.error("Erreur EmailJS :", err);
                alert("Une erreur est survenue. Veuillez réessayer.");
            });
    });
});
