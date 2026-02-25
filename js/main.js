// main.js — точка входа (сам себя запускает)

import { loadListsFromStorage, loadStateFromStorage, reconcileStateWithLists, saveStateToStorage } from './storage.js';
import { updateAllDisplays, openModal, updateItemsDisp, updateSaveBtn } from './ui.js';
import { initHandlers } from './handlers.js';
import { showToast, showConfirm } from './utils.js';

// Глобальное состояние
export let state = {
  mechanics: [],
  client: { name: '', phone: '', car: '' },
  wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
  materials: [],
  services: []
};

// Создание заказа (заглушка)
async function createOrder() {
  // ... твой код ...
  showToast('Заказ отправлен (заглушка)');
}

// Инициализация
function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  loadListsFromStorage();
  loadStateFromStorage(state);
  reconcileStateWithLists(state);

  // Безопасный рендер после полной отрисовки
  setTimeout(() => {
    updateAllDisplays(state);
    initHandlers(state);

    document.querySelectorAll('.card[data-modal]').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.modal, state));
    });

    document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
    document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
    document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);

    document.getElementById('btnReset')?.addEventListener('click', async () => {
      if (await showConfirm('Сбросить?', 'Все данные удалятся')) {
        state = { /* дефолтное состояние */ };
        updateAllDisplays(state);
        saveStateToStorage(state);
        showToast('Сброшено');
      }
    });

    console.log('Приложение готово');
  }, 200);
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM готов');
  init();
});
