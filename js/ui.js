// ui.js — все функции рендера и обновления интерфейса

import { filterServicesByWheels, sortServicesByPrefix } from './services.js';
import { saveStateToStorage } from './storage.js';
import { MECHANICS, MATERIALS, SERVICES } from './storage.js';  // ← правильный импорт списков

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
  } else {
    console.warn('Элемент #btnSaveSum не найден');
  }
}

// Подсчёт общей суммы (только по selected и qty > 0)
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

// Обновление карточки "Клиент"
export function updateClientDisp(state) {
  const el = document.getElementById('dClient');
  if (!el) return console.warn('Элемент #dClient не найден');
  const c = state.client;
  el.className = 'card-subtitle';
  if (!c.name && !c.phone && !c.car) {
    el.textContent = 'Добавить информацию';
  } else {
    el.textContent = [c.name, c.phone, c.car].filter(Boolean).join(' · ');
  }
}

// Обновление карточки "Параметры колёс"
export function updateWheelsDisp(state) {
  const el = document.getElementById('dWheels');
  if (!el) return console.warn('Элемент #dWheels не найден');
  const w = state.wheels;
  el.className = 'card-subtitle has-tags';
  let tags = [`<span class="mini-tag" style="font-weight:700">R${w.radius}</span>`];
  const typeLabels = {
    light: 'Легковая',
    jeep: 'Джип/минивэн/кроссовер',
    lowProfile: 'Низкий профиль',
    runflat: 'RunFlat'
  };
  for (let k in w.types) {
    if (w.types[k]) tags.push(`<span class="mini-tag">${typeLabels[k]}</span>`);
  }
  tags.push(`<span class="mini-tag"><span class="cnt">${w.qty}</span> шт</span>`);
  el.innerHTML = tags.join('');
}

// Форматирование имени услуги
export function formatServiceName(service) {
  return service.name;
}

// Обновление мини-тегов в карточках "Материалы" и "Услуги"
export function updateItemsDisp(elId, items, emptyText) {
  const el = document.getElementById(elId);
  if (!el) return console.warn(`Элемент #${elId} не найден`);
  const active = items.filter(i => i.selected && i.qty > 0);
  if (!active.length) {
    el.className = 'card-subtitle';
    el.textContent = emptyText;
  } else {
    el.className = 'card-subtitle has-tags';
    el.innerHTML = active.map(i => {
      let displayName = i.name;
      if (elId === 'dServices') {
        displayName = formatServiceName(i);
      }
      const shortName = displayName.length > 20 ? displayName.substring(0, 18) + '…' : displayName;
      return `<span class="mini-tag">${shortName}<span class="cnt">${i.qty}</span></span>`;
    }).join('');
  }
}

// Обновление всех карточек на главной странице
export function updateAllDisplays(state) {
  updateMechanicsDisp(state);
  updateClientDisp(state);
  updateWheelsDisp(state);
  updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
  updateItemsDisp('dServices', state.services, 'Нет позиций');
  updateSaveBtn(state);
}

// Построение модалки механиков
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

// Заполнение полей клиента в модалке
export function fillClientModal(state) {
  const nameEl = document.getElementById('inName');
  const phoneEl = document.getElementById('inPhone');
  const carEl = document.getElementById('inCar');
  if (nameEl) nameEl.value = state.client.name || '';
  if (phoneEl) phoneEl.value = state.client.phone || '';
  if (carEl) carEl.value = state.client.car || '';
}

// Построение модалки параметров колёс
export function buildWheelsModal(state) {
  const RADII = [13,14,15,16,17,18,19,20,21,22,23,24];
  const grid = document.getElementById('radiusGrid');
  if (grid) {
    grid.innerHTML = RADII.map(r => `
      <div class="radius-btn${r === state.wheels.radius ? ' active' : ''}" data-r="${r}">R${r}</div>
    `).join('');
  }

  document.querySelectorAll('#typeGrid .type-btn').forEach(btn => {
    btn.classList.toggle('active', state.wheels.types[btn.dataset.type]);
  });

  const qtyEl = document.getElementById('wQtyVal');
  if (qtyEl) qtyEl.textContent = state.wheels.qty;
}

// Построение модалок материалов и услуг
export function buildItemsModal(listId, items, state) {
  const el = document.getElementById(listId);
  if (!el) return console.warn(`Элемент #${listId} не найден`);

  const sortedItems = listId === 'svcList' ? sortServicesByPrefix(items) : items;

  el.innerHTML = sortedItems.map(item => {
    let priceLabel = fmtPrice(item.price);
    const id = item.id || item.name;
    let displayName = item.name;

    if (listId === 'svcList') {
      displayName = formatServiceName(item);
    }

    return `
      <div class="item-row${item.selected ? ' active' : ' zero'}" data-id="${id}">
        <div class="item-name-block">
          <div class="item-name">${displayName}</div>
          <div class="item-price-label">${priceLabel} / шт</div>
        </div>
        <div class="item-controls">
          <div class="item-select-wrap">
            <select class="item-select" data-id="${id}">
              ${Array.from({length:21}, (_,i) => `
                <option value="${i}" ${i === item.qty ? 'selected' : ''}>${i}</option>
              `).join('')}
            </select>
            <span class="item-select-arrow"><i class="fa-solid fa-chevron-down"></i></span>
          </div>
          <div class="item-checkbox-wrap">
            <input type="checkbox" class="item-checkbox" data-id="${id}" ${item.selected ? 'checked' : ''}>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Синхронизация классов строк
  el.querySelectorAll('.item-row').forEach(row => {
    const checkbox = row.querySelector('.item-checkbox');
    if (checkbox) {
      const isChecked = checkbox.checked;
      row.classList.toggle('active', isChecked);
      row.classList.toggle('zero', !isChecked);
    }
  });
}

// Обновление суммы в футере модалки
export function updateModalFooterSum(footerId, items) {
  const el = document.getElementById(footerId);
  if (!el) return;
  let sum = items.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
  el.innerHTML = sum > 0
    ? `<span class="modal-footer-sum-label">Сумма:</span><span class="modal-footer-sum-value">${fmtPrice(sum)}</span>`
    : '';
}

// Открытие модалки + привязка обработчиков
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

  // Заполняем содержимое модалки
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

  // Показываем модалку
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Закрытие модалки
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
    if (e.key === 'Escape') {
      closeModalHandler();
    }
  };

  // Кнопка крестик
  overlay.querySelector('.modal-close-btn')?.addEventListener('click', closeModalHandler);

  // Кнопка «Готово» — сохраняем и закрываем
  overlay.querySelector('.btn-done')?.addEventListener('click', () => {
    saveCurrentModal(overlay, state);
    closeModalHandler();
    showToast('Данные сохранены');
  });

  // Фон и Esc
  overlay.addEventListener('click', bgCloseHandler);
  document.addEventListener('keydown', escCloseHandler);

  console.log(`Модалка ${name} открыта`);
}

// Сохранение данных из модалки (вызывается при «Готово»)
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
  saveStateToStorage(state);
}
