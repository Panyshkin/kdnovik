// main.js — точка входа, инициализация приложения и основные события

// Импорты
import { 
  loadListsFromStorage, 
  loadStateFromStorage, 
  reconcileStateWithLists, 
  saveStateToStorage 
} from './storage.js';

import { 
  updateAllDisplays, 
  buildItemsModal, 
  updateModalFooterSum, 
  openModal,
  updateItemsDisp,
  updateSaveBtn,
  updateWheelsDisp,
  updateMechanicsDisp,
  updateClientDisp
} from './ui.js';

import { initHandlers } from './handlers.js';

import { 
  filterServicesByWheels, 
  sortServicesByPrefix,
  resetInvalidServices,
  isConstantService,
  serviceMatchesWheels
} from './services.js';

import { showToast, showConfirm } from './utils.js';

// Глобальное состояние (экспортируем, чтобы другие модули могли его читать/менять при необходимости)
export let state = {
  mechanics: [],
  client: { name: '', phone: '', car: '' },
  wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
  materials: [],
  services: []
};

// Функция создания заказа (можно позже вынести в handlers.js)
async function createOrder() {
  if (state.mechanics.length === 0) {
    showToast('Выберите хотя бы одного механика');
    return;
  }
  if (!state.client.name || !state.client.phone || !state.client.car) {
    showToast('Заполните ФИО, телефон и авто клиента');
    return;
  }
  if (!state.services.some(s => s.selected)) {
    showToast('Отметьте хотя бы одну услугу');
    return;
  }

  const confirmed = await showConfirm('Создать заказ?', 'Данные будут отправлены в 1С.');
  if (!confirmed) return;

  // Формируем данные для отправки (только selected = true)
  const orderData = {
    manager: state.mechanics.join(', '),
    client: { ...state.client },
    wheels: { ...state.wheels },
    materials: state.materials.filter(m => m.selected).map(m => ({
      id: m.id,
      name: m.name,
      price: m.price,
      qty: m.qty
    })),
    services: state.services.filter(s => s.selected).map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      qty: s.qty,
      radius: s.radius,
      carType: s.carType,
      lowProfile: s.lowProfile,
      runflat: s.runflat
    }))
  };

  showToast('Отправка заказа...');
  // Здесь будет твой fetch на прокси-сервер 1С
  // await fetch(ORDER_PROXY_URL, { method: 'POST', body: JSON.stringify(orderData), ... });
  // После успешной отправки можно очистить форму или сохранить в историю
}

// Главная функция инициализации
function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  // Загружаем списки из localStorage / дефолтные значения
  loadListsFromStorage();

  // Восстанавливаем состояние заказа
  loadStateFromStorage(state);

  // Синхронизируем state с актуальными списками (MECHANICS, MATERIALS, SERVICES)
  reconcileStateWithLists(state);

  // Первичный рендер всего интерфейса
  updateAllDisplays(state);

  // Подключаем все обработчики событий (передаём state)
  initHandlers(state);

  // Глобальные слушатели карточек и кнопок
  document.querySelectorAll('.card[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
      const modalName = card.dataset.modal;
      openModal(modalName, state);
    });
  });

  document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
  document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
  document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);

  // Кнопка сброса формы
  document.getElementById('btnReset')?.addEventListener('click', async () => {
    if (await showConfirm('Сбросить форму?', 'Все введённые данные будут удалены.')) {
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

// Запускаем только после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM полностью загружен — запускаем приложение');
  init();
});
