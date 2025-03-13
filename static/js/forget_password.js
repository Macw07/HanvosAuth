import { apiRequest } from "../utils/apiRequest.js";

const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect');

const backToLoginLink = document.getElementById("back-to-login-link");

backToLoginLink.href = redirectUrl;


document.getElementById("forgot-password-form").addEventListener("submit", function (event) {
    event.preventDefault(); // 阻止表单默认提交行为

    const emailInput = document.getElementById("email");
    const message = document.getElementById("message");
    const submitButton = event.target.querySelector("button[type='submit']");

    // 禁用按钮，防止重复点击
    submitButton.disabled = true;
    submitButton.classList.add("opacity-50", "cursor-not-allowed");

    // **立即** 显示用户提示信息
    message.textContent = "If your email exists, a new password has been sent to your inbox.";
    message.classList.remove("hidden");
    message.classList.add("text-green-400");

    // **异步** 发送请求，不阻塞 UI
    apiRequest("POST", "/password/reset", { email: emailInput.value.trim() }).then();
});
