// main.js — точка входа приложения (kdnovik)

// Импорты
import { 
  loadListsFromStorage, 
  loadStateFromStorage, 
  reconcileStateWithLists, 
  saveStateToStorage 
} from './storage.js';

import { 
  updateAllDisplays, 
  openModal,
  updateItemsDisp,
  updateSaveBtn
} from './ui.js';

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

// Создание заказа (заглушка — потом подключишь fetch)
async function createOrder() {
  if (state.mechanics.length === 0) return showToast('Выберите механика');
  if (!state.client.name || !state.client.phone || !state.client.car) {
    return showToast('Заполните данные клиента');
  }
  if (!state.services.some(s => s.selected)) {
    return showToast('Отметьте хотя бы одну услугу');
  }

  const confirmed = await showConfirm('Создать заказ?', 'Отправить в 1С?');
  if (!confirmed) return;

  showToast('Отправка...');
  // Здесь будет fetch(...)
}

// Инициализация
function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  loadListsFromStorage();
  loadStateFromStorage(state);
  reconcileStateWithLists(state);

  // Ждём, пока браузер отрисует все карточки (самый надёжный способ)
  const tryRender = () => {
    const required = ['dMechanics', 'dClient', 'dWheels', 'dMaterials', 'dServices'];
    const missing = required.filter(id => !document.getElementById(id));

    if (missing.length === 0) {
      console.log('Все карточки найдены — рендерим');
      updateAllDisplays(state);
      initHandlers(state);

      // Слушатели
      document.querySelectorAll('.card[data-modal]').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.modal, state));
      });

      document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
      document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
      document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);

      document.getElementById('btnReset')?.addEventListener('click', async () => {
        if (await showConfirm('Сбросить?', 'Все данные удалятся')) {
          state = {
            mechanics: [],
            client: { name: '', phone: '', car: '' },
            wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
            materials: MATERIALS.map(m => ({ ...m, qty: 0, selected: false })),
            services: SERVICES.map(s => ({ ...s, qty: 0, selected: false }))
          };
          updateAllDisplays(state);
          saveStateToStorage(state);
          showToast('Сброшено');
        }
      });

      console.log('Приложение полностью готово');
    } else {
      console.log(`Ещё не все карточки: ${missing.join(', ')} — пробуем снова через 100 мс`);
      setTimeout(tryRender, 100);
    }
  };

  tryRender(); // Запускаем проверку
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен — стартуем');
  init();
});
