import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitButton = loginForm.querySelector('button[type="submit"]');

const currentUrl = window.location.href;

const forgetPasswordLink = document.getElementById('forget-password-link');
const createAccountLink = document.getElementById('create-account-link');

const baseForgetPasswordUrl = "/password/reset";
const baseCreateAccountUrl = "/register";

forgetPasswordLink.href = `${baseForgetPasswordUrl}?redirect=${encodeURIComponent(currentUrl)}`;
createAccountLink.href = `${baseCreateAccountUrl}?redirect=${encodeURIComponent(currentUrl)}`;


// 初始化按钮状态（禁用）
submitButton.disabled = true;
submitButton.classList.add('opacity-50', 'cursor-not-allowed');

// 监听输入事件，动态启用/禁用按钮
function updateButtonState() {
    if (emailInput.value.trim() && passwordInput.value.trim()) {
        submitButton.disabled = false;
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

emailInput.addEventListener('input', updateButtonState);
passwordInput.addEventListener('input', updateButtonState);

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // 阻止默认提交行为

    const email = emailInput.value;
    const password = passwordInput.value;

    // 禁用按钮并添加加载动画
    submitButton.disabled = true;
    submitButton.classList.add('opacity-50', 'cursor-not-allowed', 'relative');
    submitButton.innerHTML = `
        <div class="flex justify-center items-center">
            <svg class="animate-spin h-5 w-5 mr-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Logging in...
        </div>
    `;

    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');

    let requestUrl = '/login';
    if (redirectUrl) {
        requestUrl += `?redirect=${encodeURIComponent(redirectUrl)}`;
    }

    apiRequest('POST', requestUrl, { email, password }).then(data => {
        if (data.code === 200) {
            location.href = data.redirect === '/profile' ? '/profile' : `${data.redirect}?token=${data.token}`;
        } else {
            showModal(data.msg);
            restoreButton();
        }
    }).catch(error => {
        console.error("Login error:", error);
        showModal("An error occurred. Please try again.");
        restoreButton();
    });
});

// 恢复按钮状态的函数
function restoreButton() {
    submitButton.disabled = false;
    submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    submitButton.innerHTML = "Login";
}
