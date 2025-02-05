import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

document.addEventListener("DOMContentLoaded", async function () {
  // 模拟用户信息（可以从后端获取）
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

  document.getElementById("logoutButton").addEventListener("click", function (){
      location.href = "/logout";
  });

  // 监听保存按钮
  document.getElementById("saveProfile").addEventListener("click", async function () {
    const avatarUrlValue = document.getElementById("avatarUrl").value.trim();
    const usernameValue  = document.getElementById("username").value.trim();
    const passwordValue  = document.getElementById("password").value.trim();

    // 用 JSON 提交数据
    const payload = {
      avatar: avatarUrlValue,
      username: usernameValue,
      password: passwordValue === "" ? "no change" : passwordValue
    };

    apiRequest('POST', '/update_profile', payload).then((data) => {
       showModal(data.message || "Profile updated!", () => location.reload());
    });
  });
});