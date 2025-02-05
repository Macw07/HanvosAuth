import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";


document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // 阻止默认提交行为

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');

    let requestUrl = '/login';
    if (redirectUrl) {
        requestUrl += `?redirect=${encodeURIComponent(redirectUrl)}`;
    }

    apiRequest('POST', requestUrl, { email, password }).then(data => {
        if (data.code === 200) {
            if (data.redirect === '/profile')
                location.href = '/profile'
            else location.href = `${data.redirect}?token=${data.token}`;
        }
        showModal(data.msg);
    });
});