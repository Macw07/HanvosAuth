export function showModal(message, callback) {
    // 检查是否已有模态框
    if (document.getElementById('confirmModal')) return;

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = `fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50`;

    const modalContent = document.createElement('div');
    modalContent.className = `bg-gray-800 text-white p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-700`;

    modalContent.innerHTML = `
        <p class="text-lg font-semibold text-center">${message}</p>
        <div class="mt-6 flex justify-center">
            <button id="confirmButton" class="px-5 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Confirm
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';

    const confirmButton = document.getElementById('confirmButton');

    function closeModal() {
        modal.remove();
        document.body.style.overflow = ''; // 恢复滚动

        // 执行用户提供的回调函数（如果存在）
        if (typeof callback === 'function') {
            callback();
        }

        // 移除键盘事件监听（捕获阶段）
        document.removeEventListener('keydown', handleKeyDown, true);
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // 阻止默认行为（例如表单提交）
            closeModal();
        }
    }

    // 监听点击 "Confirm" 按钮
    confirmButton.addEventListener('click', closeModal);

    // 监听键盘回车键，使用捕获阶段优先拦截事件
    document.addEventListener('keydown', handleKeyDown, true);
}
