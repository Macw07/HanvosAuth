import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || 'Unknown';
}

function extractDomain(url) {
    try {
        const hostname = new URL(url).hostname; // 提取域名
        return hostname.toUpperCase(); // 转换为大写
    } catch (e) {
        return "INVALID_URL"; // 处理无效 URL
    }
}

document.getElementById('redirect-name').textContent = extractDomain(getQueryParam('redirect'));

document.getElementById('authorize-btn').addEventListener('click', function() {
    let requestUrl = '/login';
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');
    if (redirectUrl) {
        requestUrl += `?redirect=${encodeURIComponent(redirectUrl)}`;
    }

    apiRequest('POST', requestUrl, {}).then(data => {
        if (data.code === 200) {
            showModal('Authorization Granted', () => {
                if (data.redirect === '/profile')
                    location.href = '/profile'
                else location.href = data.redirect;
            })
        }
    });
});

document.getElementById('deny-btn').addEventListener('click', function() {
    showModal('Authorization Denied', () => history.back());
});