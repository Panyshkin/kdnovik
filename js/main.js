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

// Глобальное состояние приложения (экспортируется)
export let state = {
  mechanics: [],
  client: { name: '', phone: '', car: '' },
  wheels: { radius: 17, types: { light: false, jeep: false, lowProfile: false, runflat: false }, qty: 4 },
  materials: [],
  services: []
};

// Функция создания заказа
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

  showToast('Отправка заказа...');

  // Формируем payload (только selected позиции)
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

  // Здесь будет твой реальный fetch на 1С-прокси
  // try {
  //   const response = await fetch(ORDER_PROXY_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ action: 'create_order_tyre', data: orderData })
  //   });
  //   const result = await response.json();
  //   if (result.success) {
  //     showToast(`Заказ №${result.orderNumber} создан`);
  //   } else {
  //     showToast('Ошибка создания заказа');
  //   }
  // } catch (err) {
  //   console.error('Ошибка отправки:', err);
  //   showToast('Ошибка соединения с сервером');
  // }
}

// Главная функция инициализации
function init() {
  console.log('🚀 Инициализация приложения — kdnovik v2');

  // 1. Загрузка списков и состояния
  loadListsFromStorage();
  loadStateFromStorage(state);
  reconcileStateWithLists(state);

  // 2. Даём браузеру время на отрисовку всех элементов карточек
  setTimeout(() => {
    // 3. Первичный рендер главной страницы
    updateAllDisplays(state);

    // 4. Подключение обработчиков
    initHandlers(state);

    // 5. Слушатели карточек и кнопок
    document.querySelectorAll('.card[data-modal]').forEach(card => {
      card.addEventListener('click', () => {
        const modalName = card.dataset.modal;
        openModal(modalName, state);
      });
    });

    document.getElementById('btnSettings')?.addEventListener('click', () => openModal('settings', state));
    document.getElementById('btnHistory')?.addEventListener('click', () => openModal('history', state));
    document.getElementById('btnCreateOrder')?.addEventListener('click', createOrder);

    // 6. Кнопка полного сброса формы
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

    console.log('Приложение полностью инициализировано');
  }, 150); // 150 мс — достаточно, чтобы все id карточек появились
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен — стартуем');
  init();
});
