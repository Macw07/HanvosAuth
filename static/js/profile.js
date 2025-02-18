import { apiRequest } from "../utils/apiRequest.js";
import { showModal } from "../utils/showModal.js";

document.addEventListener("DOMContentLoaded", async function () {
  // 获取用户信息
  const userInfo = await apiRequest('GET', '/profile/info/get');

  // 设置默认值
  document.getElementById("user_id").value = userInfo.id;
  document.getElementById("email").value = userInfo.email;
  document.getElementById("username").value = userInfo.username;
  document.getElementById("password").value = "";
  document.getElementById("avatar").src = userInfo?.avatar || `https://ui-avatars.com/api/?name=${userInfo.username}`;
  document.getElementById("avatarUrl").value = userInfo.avatar;

  // 点击头像触发文件上传
  const avatarContainer = document.querySelector(".group"); // 头像容器
  const avatarUploadInput = document.getElementById("avatarUpload");

  avatarContainer.addEventListener("click", () => {
    avatarUploadInput.click();
  });

  // 监听头像文件上传
  avatarUploadInput.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // 显示加载动画
    const spinner = document.getElementById("avatarSpinner");
    spinner.classList.remove("hidden");

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/avatar/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        // 更新头像预览和隐藏字段
        document.getElementById("avatar").src = data.avatarUrl;
        document.getElementById("avatarUrl").value = data.avatarUrl;
        showModal("Avatar upload successful!");
      } else {
        showModal(data.msg || "Avatar upload failed!");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      showModal("An error occurred during avatar upload.");
    } finally {
      // 隐藏加载动画
      spinner.classList.add("hidden");
    }
  });

  // 登出按钮
  document.getElementById("logoutButton").addEventListener("click", function () {
    location.href = "/logout";
  });

  const saveProfileBtn = document.getElementById("saveProfile");

  // 监听 "Save Changes" 按钮点击
  saveProfileBtn.addEventListener("click", async function () {
    const avatarUrlValue = document.getElementById("avatarUrl").value.trim();
    const usernameValue  = document.getElementById("username").value.trim();
    const passwordValue  = document.getElementById("password").value.trim();

    const payload = {
      avatar: avatarUrlValue || userInfo.avatar,
      username: usernameValue,
      password: passwordValue === "" ? "no change" : passwordValue
    };

    // 禁用按钮并显示加载动画
    saveProfileBtn.disabled = true;
    saveProfileBtn.classList.add("opacity-50", "cursor-not-allowed");
    saveProfileBtn.innerHTML = "Saving...";

    apiRequest('POST', '/update_profile', payload).then((data) => {
      showModal(data.msg || "Profile updated!", () => location.reload());
    }).catch(error => {
      console.error("Update error:", error);
      showModal("An error occurred. Please try again.");
      saveProfileBtn.disabled = false;
      saveProfileBtn.classList.remove("opacity-50", "cursor-not-allowed");
      saveProfileBtn.innerHTML = "Save Changes";
    });
  });
});
