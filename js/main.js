// main.js — точка входа

import { loadListsFromStorage, loadStateFromStorage, reconcileStateWithLists, saveStateToStorage } from './storage.js';
import { updateAllDisplays, openModal, updateItemsDisp, updateSaveBtn } from './ui.js';
import { initHandlers } from './handlers.js';
import { showToast, showConfirm } from './utils.js';

export let state = {
  mechanics: [],
  client: { name: '', phone: '', car: '' },
  wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
  materials: [],
  services: []
};

async function createOrder() {
  if (state.mechanics.length === 0) return showToast('Выберите механика');
  if (!state.client.name || !state.client.phone || !state.client.car) return showToast('Заполните клиента');
  if (!state.services.some(s => s.selected)) return showToast('Отметьте услугу');

  if (!(await showConfirm('Создать заказ?', 'Отправить в 1С?'))) return;

  showToast('Отправка...');
  // fetch(...) — твой код отправки
}

function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  loadListsFromStorage();
  loadStateFromStorage(state);
  reconcileStateWithLists(state);

  const tryRender = (attempt = 0) => {
    const required = ['dMechanics', 'dClient', 'dWheels', 'dMaterials', 'dServices'];
    const missing = required.filter(id => !document.getElementById(id));

    if (missing.length === 0) {
      console.log('Все карточки найдены — рендерим');
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
          state = { /* дефолт */ };
          updateAllDisplays(state);
          saveStateToStorage(state);
          showToast('Сброшено');
        }
      });

      console.log('Приложение полностью готово');
    } else if (attempt < 30) {
      console.log(`Попытка ${attempt + 1}: ждём карточки`);
      setTimeout(() => tryRender(attempt + 1), 100);
    } else {
      console.warn('Карточки не появились после 30 попыток');
    }
  };

  tryRender();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен — стартуем');
  init();
});
