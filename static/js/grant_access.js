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

const authorizeBtn = document.getElementById('authorize-btn');
const denyBtn = document.getElementById('deny-btn');

authorizeBtn.addEventListener('click', function () {
    let requestUrl = '/login';
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');
    if (redirectUrl) {
        requestUrl += `?redirect=${encodeURIComponent(redirectUrl)}`;
    }

    // 禁用按钮并添加加载动画
    authorizeBtn.disabled = true;
    authorizeBtn.classList.add('opacity-50', 'cursor-not-allowed', 'relative');
    authorizeBtn.innerHTML = `
        <div class="flex justify-center items-center">
            <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span class="ml-2">Authorizing...</span>
        </div>
    `;

    apiRequest('POST', requestUrl, {}).then(data => {
        if (data.code === 200) {
            showModal('Authorization Granted', () => {
                location.href = data.redirect === '/profile' ? '/profile' : data.redirect;
            });
        } else {
            restoreButton();
        }
    }).catch(error => {
        console.error("Authorization error:", error);
        showModal("An error occurred. Please try again.");
        restoreButton();
    });
});

denyBtn.addEventListener('click', function () {
    showModal('Authorization Denied', () => history.back());
});

// 监听键盘回车键
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !document.activeElement.matches('input, textarea, select')) {
        authorizeBtn.click();
    }
});

// 恢复按钮状态的函数
function restoreButton() {
    authorizeBtn.disabled = false;
    authorizeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    authorizeBtn.innerHTML = "Authorize";
}
