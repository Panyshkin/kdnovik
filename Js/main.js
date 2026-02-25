// main.js — инициализация и основные события
import { loadListsFromStorage, loadStateFromStorage, reconcileStateWithLists, saveStateToStorage } from './storage.js';
import { updateAllDisplays, buildItemsModal, updateModalFooterSum, openModal } from './ui.js';
import { initHandlers } from './handlers.js';
import { filterServicesByWheels, sortServicesByPrefix } from './services.js';
import { showToast, showConfirm } from './utils.js'; // (если будут вспомогательные функции, но пока они в main)

// Глобальное состояние приложения
let state = {
    mechanics: [],
    client: { name: '', phone: '', car: '' },
    wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
    materials: [],
    services: []
};

// Функция создания заказа (можно вынести позже)
async function createOrder() {
    // ... код createOrder (использует state, showToast, showConfirm) ...
}

export function init() {
    console.log('🚀 Инициализация приложения');

    loadListsFromStorage();           // загружает MECHANICS, MATERIALS, SERVICES (глобальные)
    loadStateFromStorage(state);       // восстанавливает state из localStorage
    reconcileStateWithLists(state);    // синхронизирует state с актуальными списками
    updateAllDisplays(state);

    // Подключаем все обработчики событий, передавая state
    initHandlers(state);

    // Дополнительные стартовые действия
    document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
    document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
    document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);
}