import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const codeInput = document.getElementById("verification-code");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const getCodeButton = document.getElementById("get-code");
    const registerButton = document.querySelector("#register-form button[type='submit']");
    const formInputs = document.querySelectorAll("#register-form input");
    let hasRequestedCode = false;
    let countdown = 60;
    let interval;

    getCodeButton.disabled = true;
    getCodeButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");
    registerButton.disabled = true;
    registerButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");

    emailInput.addEventListener("input", () => {
        if (emailInput.value.trim()) {
            getCodeButton.disabled = false;
            getCodeButton.classList.remove("disabled", "opacity-50", "cursor-not-allowed");
        } else {
            getCodeButton.disabled = true;
            getCodeButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");
        }
    });

    getCodeButton.addEventListener("click", () => {
        if (!emailInput.value.trim()) return;
        getCodeButton.disabled = true;
        getCodeButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");
        apiRequest("POST", "get_verification_code", { email: emailInput.value }).then(() => {
            showModal("Your one-time password has been sent!");
            hasRequestedCode = true; validateForm();
            countdown = 60;
            getCodeButton.textContent = `${countdown}s`;
            interval = setInterval(() => {
                countdown--;
                getCodeButton.textContent = `${countdown}s`;
                if (countdown <= 0) {
                    clearInterval(interval);
                    getCodeButton.textContent = "Get";
                    getCodeButton.disabled = false;
                    getCodeButton.classList.remove("disabled", "opacity-50", "cursor-not-allowed");
                }
            }, 1000);
        });
    });

    function validateForm() {
        const allFilled = Array.from(formInputs).every(input => input.value.trim() !== "");
        if (allFilled && hasRequestedCode) {
            registerButton.disabled = false;
            registerButton.classList.remove("disabled", "opacity-50", "cursor-not-allowed");
        } else {
            registerButton.disabled = true;
            registerButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");
        }
    }

    formInputs.forEach(input => input.addEventListener("input", validateForm));

    registerButton.addEventListener('click', (e) => {
        e.preventDefault();

        if (confirmPasswordInput.value !== passwordInput.value){
            showModal("Passwords are not match!");
            return ;
        }

        registerButton.disabled = true;
        registerButton.classList.add("disabled", "opacity-50", "cursor-not-allowed");

        apiRequest('POST', '/register', {
            username: usernameInput.value,
            email: emailInput.value,
            user_code: codeInput.value,
            password: passwordInput.value,
        }).then(data => {
            registerButton.disabled = false;
            registerButton.classList.remove("disabled", "opacity-50", "cursor-not-allowed");
            if (data.code === 200) showModal(data.msg);
            else showModal(data.msg, () => location.href = '/login');
        });
    })
});
