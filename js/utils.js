// utils.js — вспомогательные функции (уведомления, подтверждения, возможно другие утилиты в будущем)

let toastTimer;

// Показ тоста (уведомление внизу экрана)
export function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Элемент #toast не найден в DOM');
        return;
    }

    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Подтверждение действия (модальное окно с OK/Отмена)
export async function showConfirm(title, text) {
    return new Promise(resolve => {
        const titleEl = document.getElementById('confirmTitle');
        const textEl = document.getElementById('confirmText');
        const overlay = document.getElementById('confirmOverlay');

        if (!titleEl || !textEl || !overlay) {
            console.error('Элементы confirm не найдены');
            resolve(false);
            return;
        }

        titleEl.textContent = title;
        textEl.textContent = text;
        overlay.classList.add('active');

        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        const onBg = (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        };

        function cleanup() {
            overlay.classList.remove('active');
            document.getElementById('confirmOk')?.removeEventListener('click', onOk);
            document.getElementById('confirmCancel')?.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onBg);
        }

        document.getElementById('confirmOk')?.addEventListener('click', onOk);
        document.getElementById('confirmCancel')?.addEventListener('click', onCancel);
        overlay.addEventListener('click', onBg);
    });
}

// Опционально: можно добавить другие утилиты, например:
// export function fmtPrice(n) {
//     return n.toLocaleString('ru-RU') + ' ₽';
// }
