// handlers.js — все обработчики событий
import { saveStateToStorage } from './storage.js';
import { updateAllDisplays, buildItemsModal, updateModalFooterSum, openModal, closeModal } from './ui.js';
import { filterServicesByWheels, sortServicesByPrefix, isConstantService, serviceMatchesWheels, resetInvalidServices } from './services.js';
import { showConfirm, showToast } from './utils.js'; // если вынесете

export function initHandlers(state) {
    // applyAll
    document.getElementById('applyAll')?.addEventListener('click', async () => {
        const qty = parseInt(document.getElementById('wQtyVal').textContent);

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

        // Переменные услуги (отфильтрованные)
        let variableCount = 0;
        const filteredVariables = state.services.filter(svc => 
            !isConstantService(svc) && serviceMatchesWheels(svc, state.wheels)
        );
        filteredVariables.forEach(svc => {
            svc.qty = qty;
            svc.selected = false;
            variableCount++;
        });

        // Обновляем UI
        if (document.getElementById('mMaterials').classList.contains('active')) {
            buildItemsModal('matList', state.materials, state);
            updateModalFooterSum('matFooterSum', state.materials);
        }

        if (document.getElementById('mServices').classList.contains('active')) {
            const currentFiltered = filterServicesByWheels(state.services, state.wheels);
            const sorted = sortServicesByPrefix(currentFiltered);
            buildItemsModal('svcList', sorted, state);
            updateModalFooterSum('svcFooterSum', currentFiltered);
        }

        updateAllDisplays(state);
        saveStateToStorage(state);

        showToast(`Подготовлено ${qty} шт для выбора:\nматериалы + ${constantCount} постоянных + ${variableCount} переменных услуг`);
    });

    // btnComplexServices
    document.getElementById('btnComplexServices')?.addEventListener('click', () => {
        const wheelsQty = state.wheels.qty || 4;
        
        const filtered = filterServicesByWheels(state.services, state.wheels);
        
        const complexInFiltered = filtered.filter(svc => {
            const name = svc.name.trim();
            return /^[1-5]\s/.test(name);
        });

        if (complexInFiltered.length === 0) {
            showToast('В текущем списке нет услуг комплекса (1–5)');
            return;
        }

        state.services.forEach(svc => {
            const isInComplex = complexInFiltered.some(c => c.id === svc.id);
            if (isInComplex) {
                svc.qty = wheelsQty;
                svc.selected = true;
            } else {
                svc.qty = 0;
                svc.selected = false;
            }
        });

        const newFiltered = filterServicesByWheels(state.services, state.wheels);
        const sorted = sortServicesByPrefix(newFiltered);
        buildItemsModal('svcList', sorted, state);
        updateModalFooterSum('svcFooterSum', newFiltered);

        updateAllDisplays(state);
        saveStateToStorage(state);

        showToast(`Комплекс (1–5) отмечен: ${complexInFiltered.length} услуг`);
    });

    // Обработчик change на чекбоксах и селектах
    document.addEventListener('change', (e) => {
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
            updateAllDisplays(state);
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
            updateAllDisplays(state);
            saveStateToStorage(state);
        }
    });

    // Обработчики для радиуса
    document.getElementById('radiusGrid')?.addEventListener('click', e => {
        const btn = e.target.closest('.radius-btn');
        if (!btn) return;
        document.querySelectorAll('#radiusGrid .radius-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        
        const servicesModal = document.getElementById('mServices');
        if (servicesModal && servicesModal.classList.contains('active')) {
            const newRadius = parseInt(btn.dataset.r);
            const filtered = filterServicesByWheels(state.services, {
                ...state.wheels,
                radius: newRadius
            });
            const sorted = sortServicesByPrefix(filtered);
            buildItemsModal('svcList', sorted, state);
            updateModalFooterSum('svcFooterSum', filtered);
        }
    });

    // Обработчики для типа
    document.getElementById('typeGrid')?.addEventListener('click', e => {
        const btn = e.target.closest('.type-btn');
        if (!btn) return;
        const type = btn.dataset.type;
        if (type==='light' || type==='jeep') {
            const other = document.querySelector(`#typeGrid .type-btn[data-type="${type==='light'?'jeep':'light'}"]`);
            if (btn.classList.contains('active')) btn.classList.remove('active');
            else { 
                btn.classList.add('active'); 
                other?.classList.remove('active'); 
            }
        } else btn.classList.toggle('active');
        
        const servicesModal = document.getElementById('mServices');
        if (servicesModal && servicesModal.classList.contains('active')) {
            const newTypes = {...state.wheels.types};
            document.querySelectorAll('#typeGrid .type-btn').forEach(btn => {
                newTypes[btn.dataset.type] = btn.classList.contains('active');
            });
            const filtered = filterServicesByWheels(state.services, {
                ...state.wheels,
                types: newTypes
            });
            const sorted = sortServicesByPrefix(filtered);
            buildItemsModal('svcList', sorted, state);
            updateModalFooterSum('svcFooterSum', filtered);
        }
    });

    // Обработчики для кнопок количества колёс
    document.getElementById('wQtyMinus')?.addEventListener('click', ()=>{
        const el = document.getElementById('wQtyVal');
        let v = parseInt(el.textContent);
        if (v>1) el.textContent = --v;
        updateAllDisplays(state);
    });
    document.getElementById('wQtyPlus')?.addEventListener('click', ()=>{
        const el = document.getElementById('wQtyVal');
        let v = parseInt(el.textContent);
        if (v<20) el.textContent = ++v;
        updateAllDisplays(state);
    });

    // btnReset
    document.getElementById('btnReset')?.addEventListener('click', async () => {
        if (await showConfirm('Сбросить форму?', 'Все введённые данные будут удалены.')) {
            // Импортируем MATERIALS, SERVICES из storage
            const { MATERIALS, SERVICES } = await import('./storage.js');
            state = {
                mechanics: [],
                client: {name:'',phone:'',car:''},
                wheels: {radius:17, types:{light:false,jeep:false,lowProfile:false,runflat:false}, qty:4},
                materials: MATERIALS.map(m=>({...m, qty:0, selected:false})),
                services: SERVICES.map(s=>({...s, qty:0, selected:false}))
            };
            updateAllDisplays(state);
            saveStateToStorage(state);
            showToast('Форма сброшена');
        }
    });

    // ... остальные обработчики (модальные окна, закрытие и т.д.)
}