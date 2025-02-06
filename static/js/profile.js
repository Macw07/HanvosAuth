import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

document.addEventListener("DOMContentLoaded", async function () {
  // 获取用户信息
  const userInfo = await apiRequest('GET', '/profile/info/get');

  // 设置默认值
  document.getElementById("user_id").value = userInfo.id;
  document.getElementById("email").value = userInfo.email;
  document.getElementById("avatarUrl").value = userInfo.avatar;
  document.getElementById("username").value = userInfo.username;
  document.getElementById("password").value = "";
  document.getElementById("avatar").src = userInfo.avatar;

  // 监听 Avatar URL 输入变化并实时更新头像
  document.getElementById("avatarUrl").addEventListener("input", function () {
    document.getElementById("avatar").src = this.value.trim();
  });

  document.getElementById("logoutButton").addEventListener("click", function () {
    location.href = "/logout";
  });

  const saveProfileBtn = document.getElementById("saveProfile");

  // 监听 "Save Changes" 按钮点击
  saveProfileBtn.addEventListener("click", async function () {
    const avatarUrlValue = document.getElementById("avatarUrl").value.trim();
    const usernameValue  = document.getElementById("username").value.trim();
    const passwordValue  = document.getElementById("password").value.trim();

    // 用 JSON 提交数据
    const payload = {
      avatar: avatarUrlValue,
      username: usernameValue,
      password: passwordValue === "" ? "no change" : passwordValue
    };

    // 禁用按钮并显示加载动画
    saveProfileBtn.disabled = true;
    saveProfileBtn.classList.add("opacity-50", "cursor-not-allowed");
    saveProfileBtn.innerHTML = `
        <div class="flex justify-center items-center">
            <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span class="ml-2">Saving...</span>
        </div>
    `;

    apiRequest('POST', '/update_profile', payload).then((data) => {
      showModal(data.msg || "Profile updated!", () => location.reload());
    }).catch(error => {
      console.error("Update error:", error);
      showModal("An error occurred. Please try again.");
      restoreButton();
    });
  });

  // 监听键盘回车键
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !document.activeElement.matches("input, textarea, select")) {
      saveProfileBtn.click();
    }
  });

  // 恢复按钮状态的函数
  function restoreButton() {
    saveProfileBtn.disabled = false;
    saveProfileBtn.classList.remove("opacity-50", "cursor-not-allowed");
    saveProfileBtn.innerHTML = "Save Changes";
  }
});
