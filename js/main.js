// main.js — точка входа приложения

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

// Глобальное состояние (экспортируется для доступа из других модулей)
export let state = {
  mechanics: [],
  client: { name: '', phone: '', car: '' },
  wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
  materials: [],
  services: []
};

// Функция создания заказа
async function createOrder() {
  if (state.mechanics.length === 0) return showToast('Выберите хотя бы одного механика');
  if (!state.client.name || !state.client.phone || !state.client.car) {
    return showToast('Заполните ФИО, телефон и авто клиента');
  }
  if (!state.services.some(s => s.selected)) {
    return showToast('Отметьте хотя бы одну услугу');
  }

  const confirmed = await showConfirm('Создать заказ?', 'Данные будут отправлены в 1С.');
  if (!confirmed) return;

  showToast('Отправка заказа...');
  // Здесь будет твой fetch на сервер 1С
  // const response = await fetch(...);
  // if (response.ok) showToast('Заказ создан!');
}

// Главная функция инициализации
function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  // Загрузка данных
  loadListsFromStorage();
  loadStateFromStorage(state);
  reconcileStateWithLists(state);

  // Первый рендер
  updateAllDisplays(state);

  // Подключение всех обработчиков
  initHandlers(state);

  // Слушатели карточек
  document.querySelectorAll('.card[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
      openModal(card.dataset.modal, state);
    });
  });

  // Кнопки в хедере
  document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
  document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
  document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);

  // Кнопка сброса
  document.getElementById('btnReset')?.addEventListener('click', async () => {
    if (await showConfirm('Сбросить форму?', 'Все данные будут удалены.')) {
      state = {
        mechanics: [],
        client: { name: '', phone: '', car: '' },
        wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
        materials: MATERIALS.map(m => ({ ...m, qty: 0, selected: false })),
        services: SERVICES.map(s => ({ ...s, qty: 0, selected: false }))
      };
      updateAllDisplays(state);
      saveStateToStorage(state);
      showToast('Форма сброшена');
    }
  });
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен — стартуем');
  init();
});
