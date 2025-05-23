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

    // 获取 URL 参数
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');

    // 获取 "Back to Login" 和 "Forget Password?" 的链接
    const backToLoginLink = document.getElementById("back-to-login-link");
    const forgetPasswordLink = document.getElementById("forget-password-link");

    // 设置 "Back to Login" 链接：直接跳转到 redirect 指定的路径
    if (redirectUrl) {
        backToLoginLink.href = redirectUrl;
    }

    // 设置 "Forget Password?" 链接：把当前 redirect 作为新的 query string
    const baseForgetPasswordUrl = "/password/reset";
    forgetPasswordLink.href = `${baseForgetPasswordUrl}?redirect=${encodeURIComponent(redirectUrl)}`;


    getCodeButton.disabled = true;
    getCodeButton.classList.add("opacity-50", "cursor-not-allowed");
    registerButton.disabled = true;
    registerButton.classList.add("opacity-50", "cursor-not-allowed");

    emailInput.addEventListener("input", () => {
        if (emailInput.value.trim()) {
            getCodeButton.disabled = false;
            getCodeButton.classList.remove("opacity-50", "cursor-not-allowed");
        } else {
            getCodeButton.disabled = true;
            getCodeButton.classList.add("opacity-50", "cursor-not-allowed");
        }
    });

    getCodeButton.addEventListener("click", () => {
        if (!emailInput.value.trim()) return;
        if (!emailInput.value.endsWith('@hanvos-kent.com') && !emailInput.value.endsWith('@faculty.kleducation.org')) {
            showModal("You must register with an email address ending with @hanvos-kent.com or @faculty.kleducation.org!");
            return ;
        }
        getCodeButton.disabled = true;
        getCodeButton.classList.add("opacity-50", "cursor-not-allowed");

        apiRequest("POST", "get_verification_code", { email: emailInput.value }).then(() => {
            showModal("Your one-time password has been sent!");
            hasRequestedCode = true;
            validateForm();
            countdown = 60;
            getCodeButton.textContent = `${countdown}s`;
            interval = setInterval(() => {
                countdown--;
                getCodeButton.textContent = `${countdown}s`;
                if (countdown <= 0) {
                    clearInterval(interval);
                    getCodeButton.textContent = "Get";
                    getCodeButton.disabled = false;
                    getCodeButton.classList.remove("opacity-50", "cursor-not-allowed");
                }
            }, 1000);
        });
    });

    function validateForm() {
        const allFilled = Array.from(formInputs).every(input => input.value.trim() !== "");
        if (allFilled && hasRequestedCode) {
            registerButton.disabled = false;
            registerButton.classList.remove("opacity-50", "cursor-not-allowed");
        } else {
            registerButton.disabled = true;
            registerButton.classList.add("opacity-50", "cursor-not-allowed");
        }
    }

    formInputs.forEach(input => input.addEventListener("input", validateForm));

    registerButton.addEventListener('click', (e) => {
        e.preventDefault();

        if (confirmPasswordInput.value !== passwordInput.value) {
            showModal("Passwords do not match!");
            return;
        }

        if (!emailInput.value.endsWith('@hanvos-kent.com') && !emailInput.value.endsWith('@faculty.kleducation.org')) {
            showModal("You must register with an email address ending with @hanvos-kent.com or @faculty.kleducation.org!");
            return ;
        }

        // 禁用按钮并显示加载动画
        registerButton.disabled = true;
        registerButton.classList.add("opacity-50", "cursor-not-allowed");
        registerButton.innerHTML = `
            <div class="flex justify-center items-center">
                <svg class="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span class="ml-2">Registering...</span>
            </div>
        `;

        apiRequest('POST', '/register', {
            username: usernameInput.value,
            email: emailInput.value,
            user_code: codeInput.value,
            password: passwordInput.value,
        }).then(data => {
            if (data.code === 200) {
                showModal(data.msg, () => location.href = redirectUrl);
            } else {
                showModal(data.msg);
                codeInput.value = '';
                restoreButton();
            }
        }).catch(error => {
            console.error("Registration error:", error);
            showModal("An error occurred. Please try again.");
            restoreButton();
        });
    });

    // 监听键盘回车键
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !document.activeElement.matches("input, textarea, select")) {
            registerButton.click();
        }
    });

    // 恢复按钮状态的函数
    function restoreButton() {
        registerButton.disabled = false;
        registerButton.classList.remove("opacity-50", "cursor-not-allowed");
        registerButton.innerHTML = "Register";
    }
});
