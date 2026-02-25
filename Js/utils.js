// utils.js — вспомогательные функции (toast, confirm)
let toastTimer;
export function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

export async function showConfirm(title, text) {
    return new Promise(resolve => {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmText').textContent = text;
        const overlay = document.getElementById('confirmOverlay');
        overlay.classList.add('active');
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        const onBg = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
        function cleanup() {
            overlay.classList.remove('active');
            document.getElementById('confirmOk').removeEventListener('click', onOk);
            document.getElementById('confirmCancel').removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onBg);
        }
        document.getElementById('confirmOk').addEventListener('click', onOk);
        document.getElementById('confirmCancel').addEventListener('click', onCancel);
        overlay.addEventListener('click', onBg);
    });
}