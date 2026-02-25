// handlers.js — все обработчики событий приложения

import { saveStateToStorage } from './storage.js';
import { 
  updateAllDisplays, 
  updateItemsDisp, 
  updateSaveBtn,
  buildItemsModal,          // ← теперь экспортируется из ui.js
  updateModalFooterSum 
} from './ui.js';
import { filterServicesByWheels, sortServicesByPrefix, isConstantService, serviceMatchesWheels } from './services.js';
import { showToast, showConfirm } from './utils.js';

// Основная функция привязки всех обработчиков
export function initHandlers(state) {
  // Кнопка "Применить ко всем" (количество колёс → материалы + услуги)
  document.getElementById('applyAll')?.addEventListener('click', async () => {
    const qty = parseInt(document.getElementById('wQtyVal')?.textContent) || 4;
    if (!(await showConfirm('Применить количество?', `Установить ${qty} шт для всех материалов + всех постоянных услуг + подходящих переменных услуг?`))) {
      return;
    }

    // Материалы
    state.materials.forEach(m => {
      m.qty = qty;
      m.selected = false;
    });

    // Постоянные услуги
    let constantCount = 0;
    state.services.forEach(svc => {
      if (isConstantService(svc)) {
        svc.qty = qty;
        svc.selected = false;
        constantCount++;
      }
    });

    // Переменные услуги
    let variableCount = 0;
    const filteredVariables = state.services.filter(svc => 
      !isConstantService(svc) && serviceMatchesWheels(svc, state.wheels)
    );
    filteredVariables.forEach(svc => {
      svc.qty = qty;
      svc.selected = false;
      variableCount++;
    });

    // Обновляем модалки, если они открыты
    if (document.getElementById('mMaterials')?.classList.contains('active')) {
      buildItemsModal('matList', state.materials, state);
      updateModalFooterSum('matFooterSum', state.materials);
    }
    if (document.getElementById('mServices')?.classList.contains('active')) {
      const currentFiltered = filterServicesByWheels(state.services, state.wheels);
      const sorted = sortServicesByPrefix(currentFiltered);
      buildItemsModal('svcList', sorted, state);
      updateModalFooterSum('svcFooterSum', currentFiltered);
    }

    // Обновляем главную страницу
    updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
    updateItemsDisp('dServices', state.services, 'Нет позиций');
    updateSaveBtn(state);
    saveStateToStorage(state);

    showToast(`Подготовлено ${qty} шт для выбора:\nматериалы + ${constantCount} постоянных + ${variableCount} переменных услуг`);
  });

  // Кнопка «Комплекс услуг» (1–5)
  document.getElementById('btnComplexServices')?.addEventListener('click', () => {
    const wheelsQty = state.wheels.qty || 4;

    const filtered = filterServicesByWheels(state.services, state.wheels);
    const complexInFiltered = filtered.filter(svc => /^[1-5]\s/.test(svc.name.trim()));

    if (complexInFiltered.length === 0) {
      showToast('В текущем списке нет услуг комплекса (1–5)');
      return;
    }

    // Отмечаем комплексные, остальные обнуляем
    state.services.forEach(svc => {
      const isInComplex = complexInFiltered.some(c => c.id === svc.id);
      svc.qty = isInComplex ? wheelsQty : 0;
      svc.selected = isInComplex;
    });

    // Обновляем модалку услуг
    const newFiltered = filterServicesByWheels(state.services, state.wheels);
    const sorted = sortServicesByPrefix(newFiltered);
    buildItemsModal('svcList', sorted, state);
    updateModalFooterSum('svcFooterSum', newFiltered);

    // Обновляем главную страницу
    updateItemsDisp('dServices', state.services, 'Нет позиций');
    updateSaveBtn(state);
    saveStateToStorage(state);

    showToast(`Комплекс (1–5) отмечен: ${complexInFiltered.length} услуг`);
  });

  // Обработчик изменения чекбоксов и селектов (в модалках материалов и услуг)
  document.addEventListener('change', function(e) {
    const target = e.target;

    if (target.classList.contains('item-checkbox')) {
      const row = target.closest('.item-row');
      if (!row) return;
      const id = row.dataset.id;
      const listId = row.closest('.items-list')?.id;
      if (!listId) return;
      const checked = target.checked;

      if (listId === 'matList') {
        const material = state.materials.find(m => String(m.id).trim() === String(id).trim());
        if (material) {
          material.selected = checked;
          if (checked && material.qty === 0) material.qty = state.wheels.qty;
          if (!checked) material.qty = 0;
          updateModalFooterSum('matFooterSum', state.materials);
        }
      } else if (listId === 'svcList') {
        const service = state.services.find(s => String(s.id).trim() === String(id).trim());
        if (service) {
          service.selected = checked;
          if (checked && service.qty === 0) service.qty = state.wheels.qty;
          if (!checked) service.qty = 0;
          const filtered = filterServicesByWheels(state.services, state.wheels);
          updateModalFooterSum('svcFooterSum', filtered);
        }
      }

      row.classList.toggle('active', checked);
      row.classList.toggle('zero', !checked);
      const select = row.querySelector('.item-select');
      if (select) select.value = checked ? state.wheels.qty : 0;

      updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
      updateItemsDisp('dServices', state.services, 'Нет позиций');
      updateSaveBtn(state);
      saveStateToStorage(state);
    }

    if (target.classList.contains('item-select')) {
      const row = target.closest('.item-row');
      if (!row) return;
      const id = row.dataset.id;
      const listId = row.closest('.items-list')?.id;
      if (!listId) return;
      const qty = parseInt(target.value) || 0;

      if (listId === 'matList') {
        const material = state.materials.find(m => String(m.id).trim() === String(id).trim());
        if (material) {
          material.qty = qty;
          material.selected = qty > 0;
          updateModalFooterSum('matFooterSum', state.materials);
        }
      } else if (listId === 'svcList') {
        const service = state.services.find(s => String(s.id).trim() === String(id).trim());
        if (service) {
          service.qty = qty;
          service.selected = qty > 0;
          const filtered = filterServicesByWheels(state.services, state.wheels);
          updateModalFooterSum('svcFooterSum', filtered);
        }
      }

      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox) checkbox.checked = qty > 0;
      row.classList.toggle('active', qty > 0);
      row.classList.toggle('zero', qty === 0);

      updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
      updateItemsDisp('dServices', state.services, 'Нет позиций');
      updateSaveBtn(state);
      saveStateToStorage(state);
    }
  });

  // Обработчики для радиуса и типа (обновляют список услуг, если модалка открыта)
  document.getElementById('radiusGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.radius-btn');
    if (!btn) return;
    document.querySelectorAll('#radiusGrid .radius-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const servicesModal = document.getElementById('mServices');
    if (servicesModal?.classList.contains('active')) {
      const newRadius = parseInt(btn.dataset.r);
      const filtered = filterServicesByWheels(state.services, { ...state.wheels, radius: newRadius });
      const sorted = sortServicesByPrefix(filtered);
      buildItemsModal('svcList', sorted, state);
      updateModalFooterSum('svcFooterSum', filtered);
    }
  });

  document.getElementById('typeGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    const type = btn.dataset.type;

    if (type === 'light' || type === 'jeep') {
      const otherType = type === 'light' ? 'jeep' : 'light';
      const otherBtn = document.querySelector(`#typeGrid .type-btn[data-type="${otherType}"]`);
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
      } else {
        btn.classList.add('active');
        if (otherBtn) otherBtn.classList.remove('active');
      }
    } else {
      btn.classList.toggle('active');
    }

    const servicesModal = document.getElementById('mServices');
    if (servicesModal?.classList.contains('active')) {
      const newTypes = { ...state.wheels.types };
      document.querySelectorAll('#typeGrid .type-btn').forEach(b => {
        newTypes[b.dataset.type] = b.classList.contains('active');
      });
      const filtered = filterServicesByWheels(state.services, { ...state.wheels, types: newTypes });
      const sorted = sortServicesByPrefix(filtered);
      buildItemsModal('svcList', sorted, state);
      updateModalFooterSum('svcFooterSum', filtered);
    }
  });

  // Минус/плюс количества колёс
  document.getElementById('wQtyMinus')?.addEventListener('click', () => {
    const el = document.getElementById('wQtyVal');
    let v = parseInt(el.textContent);
    if (v > 1) el.textContent = --v;
    updateSaveBtn(state);
  });

  document.getElementById('wQtyPlus')?.addEventListener('click', () => {
    const el = document.getElementById('wQtyVal');
    let v = parseInt(el.textContent);
    if (v < 20) el.textContent = ++v;
    updateSaveBtn(state);
  });

  // Кнопка "Сбросить"
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
