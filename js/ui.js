// ui.js — все функции рендера и обновления интерфейса

import { filterServicesByWheels, sortServicesByPrefix } from './services.js';
import { saveStateToStorage } from './storage.js';  // ← добавили импорт

// Глобальные списки — берём из storage.js или window
let MECHANICS = window.MECHANICS || [];
let MATERIALS = window.MATERIALS || [];
let SERVICES = window.SERVICES || [];

// Вспомогательная функция форматирования цены
function fmtPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

// Обновление суммы в футере главной страницы
export function updateSaveBtn(state) {
  const sum = calcTotal(state);
  const el = document.getElementById('btnSaveSum');
  if (el) {
    el.textContent = sum > 0 ? fmtPrice(sum) : '';
  }
}

// Подсчёт общей суммы
export function calcTotal(state) {
  let sum = 0;
  sum += state.materials.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
  sum += state.services.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
  return sum;
}

// Обновление карточки "Механики"
export function updateMechanicsDisp(state) {
  const el = document.getElementById('dMechanics');
  if (!el) return console.warn('Элемент #dMechanics не найден');
  if (!state.mechanics.length) {
    el.className = 'card-subtitle';
    el.textContent = 'Выберите механиков';
  } else {
    el.className = 'card-subtitle has-tags';
    el.innerHTML = state.mechanics.map(n =>
      `<span class="mini-tag"><i class="fa-solid fa-user-gear"></i> ${n}</span>`
    ).join('');
  }
}

// ... остальные update-функции без изменений ...

// Построение модалки механиков — теперь используем глобальный MECHANICS
export function buildMechanicsModal(state) {
  const el = document.getElementById('mechList');
  if (!el) return console.warn('Элемент #mechList не найден');

  if (!MECHANICS.length) {
    el.innerHTML = '<div class="empty-state">Список механиков пуст</div>';
    return;
  }

  el.innerHTML = MECHANICS.map(name => {
    const sel = state.mechanics.includes(name);
    return `<div class="mech-item${sel ? ' selected' : ''}" data-name="${name}">
      <div class="mech-check"><i class="fa-solid fa-check"></i></div>
      <span class="mech-name">${name}</span>
    </div>`;
  }).join('');
}

// ... остальные build-функции без изменений ...

// Открытие модалки
export function openModal(name, state) {
  const modalMap = {
    mechanics: 'mMechanics',
    client: 'mClient',
    wheels: 'mWheels',
    materials: 'mMaterials',
    services: 'mServices',
    settings: 'mSettings',
    history: 'mHistory'
  };

  const id = modalMap[name];
  if (!id) return console.warn(`Неизвестная модалка: ${name}`);

  const overlay = document.getElementById(id);
  if (!overlay) return console.warn(`Модалка #${id} не найдена в DOM`);

  // Заполняем содержимое
  if (name === 'mechanics') buildMechanicsModal(state);
  if (name === 'client') fillClientModal(state);
  if (name === 'wheels') buildWheelsModal(state);
  if (name === 'materials') {
    buildItemsModal('matList', state.materials, state);
    updateModalFooterSum('matFooterSum', state.materials);
  }
  if (name === 'services') {
    const filtered = filterServicesByWheels(state.services, state.wheels);
    const sorted = sortServicesByPrefix(filtered);
    buildItemsModal('svcList', sorted, state);
    updateModalFooterSum('svcFooterSum', filtered);
  }

  // Показываем
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Закрытие
  const closeModalHandler = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    overlay.removeEventListener('click', bgCloseHandler);
    document.removeEventListener('keydown', escCloseHandler);
  };

  const bgCloseHandler = (e) => {
    if (e.target === overlay && name !== 'settings' && name !== 'history') {
      closeModalHandler();
    }
  };

  const escCloseHandler = (e) => {
    if (e.key === 'Escape') closeModalHandler();
  };

  overlay.querySelector('.modal-close-btn')?.addEventListener('click', closeModalHandler);
  overlay.addEventListener('click', bgCloseHandler);
  document.addEventListener('keydown', escCloseHandler);

  // Кнопка «Готово» — сохраняем и закрываем
  overlay.querySelector('.btn-done')?.addEventListener('click', () => {
    saveCurrentModal(overlay, state);
    closeModalHandler();
    showToast('Данные сохранены');
  });

  console.log(`Модалка ${name} открыта`);
}

// Сохранение данных из модалки
export function saveCurrentModal(overlay, state) {
  const id = overlay.id;

  if (id === 'mMechanics') {
    state.mechanics = [...overlay.querySelectorAll('#mechList .mech-item.selected')].map(el => el.dataset.name);
    updateMechanicsDisp(state);
  }

  if (id === 'mClient') {
    state.client.name = overlay.querySelector('#inName')?.value.trim() || '';
    state.client.phone = overlay.querySelector('#inPhone')?.value.trim() || '';
    state.client.car = overlay.querySelector('#inCar')?.value.trim() || '';
    updateClientDisp(state);
  }

  if (id === 'mWheels') {
    const activeR = overlay.querySelector('#radiusGrid .radius-btn.active');
    if (activeR) state.wheels.radius = parseInt(activeR.dataset.r);

    overlay.querySelectorAll('#typeGrid .type-btn').forEach(btn => {
      state.wheels.types[btn.dataset.type] = btn.classList.contains('active');
    });

    const qtyEl = overlay.querySelector('#wQtyVal');
    if (qtyEl) state.wheels.qty = parseInt(qtyEl.textContent) || 4;

    updateWheelsDisp(state);
  }

  if (id === 'mMaterials') {
    overlay.querySelectorAll('#matList .item-row').forEach(row => {
      const itemId = row.dataset.id;
      const select = row.querySelector('.item-select');
      if (itemId && select) {
        const qty = parseInt(select.value) || 0;
        const material = state.materials.find(m => String(m.id).trim() === String(itemId).trim());
        if (material) {
          material.qty = qty;
          material.selected = qty > 0;
        }
      }
    });
    updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
    updateModalFooterSum('matFooterSum', state.materials);
  }

  if (id === 'mServices') {
    overlay.querySelectorAll('#svcList .item-row').forEach(row => {
      const itemId = row.dataset.id;
      const select = row.querySelector('.item-select');
      if (itemId && select) {
        const qty = parseInt(select.value) || 0;
        const service = state.services.find(s => String(s.id).trim() === String(itemId).trim());
        if (service) {
          service.qty = qty;
          service.selected = qty > 0;
        }
      }
    });
    updateItemsDisp('dServices', state.services, 'Нет позиций');
    updateModalFooterSum('svcFooterSum', state.services);
  }

  updateSaveBtn(state);
  saveStateToStorage(state);  // ← теперь работает
}
