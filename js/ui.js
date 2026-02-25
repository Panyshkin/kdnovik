// ui.js — все функции рендера и обновления интерфейса
import { filterServicesByWheels, sortServicesByPrefix, isConstantService } from './services.js';
import { MECHANICS } from './storage.js'; // может понадобиться

// Вспомогательные функции форматирования
function fmtPrice(n) { return n.toLocaleString('ru-RU') + ' ₽'; }

export function updateSaveBtn(state) {
    const sum = calcTotal(state);
    document.getElementById('btnSaveSum').textContent = sum > 0 ? fmtPrice(sum) : '';
}

export function calcTotal(state) {
    let sum = 0;
    sum += state.materials.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
    sum += state.services.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
    return sum;
}

export function updateMechanicsDisp(state) {
    const el = document.getElementById('dMechanics');
    if (!state.mechanics.length) { el.className = 'card-subtitle'; el.textContent = 'Выберите механиков'; }
    else {
        el.className = 'card-subtitle has-tags';
        el.innerHTML = state.mechanics.map(n => `<span class="mini-tag"><i class="fa-solid fa-user-gear"></i> ${n}</span>`).join('');
    }
}

export function updateClientDisp(state) {
    const el = document.getElementById('dClient');
    const c = state.client;
    el.className = 'card-subtitle';
    if (!c.name && !c.phone && !c.car) el.textContent = 'Добавить информацию';
    else el.textContent = [c.name, c.phone, c.car].filter(Boolean).join(' · ');
}

export function updateWheelsDisp(state) {
    const el = document.getElementById('dWheels');
    const w = state.wheels;
    el.className = 'card-subtitle has-tags';
    let tags = [`<span class="mini-tag" style="font-weight:700">R${w.radius}</span>`];
    const typeLabels = {light:'Легковая',jeep:'Джип/минивэн/кроссовер',lowProfile:'Низкий профиль',runflat:'RunFlat'};
    for (let k in w.types) if (w.types[k]) tags.push(`<span class="mini-tag">${typeLabels[k]}</span>`);
    tags.push(`<span class="mini-tag"><span class="cnt">${w.qty}</span> шт</span>`);
    el.innerHTML = tags.join('');
}

export function formatServiceName(service) {
    return service.name;
}

export function updateItemsDisp(elId, items, emptyText) {
    const el = document.getElementById(elId);
    const active = items.filter(i => i.selected && i.qty > 0);
    if (!active.length) { 
        el.className = 'card-subtitle'; 
        el.textContent = emptyText; 
    }
    else {
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

export function updateAllDisplays(state) {
    updateMechanicsDisp(state);
    updateClientDisp(state);
    updateWheelsDisp(state);
    updateItemsDisp('dMaterials', state.materials, 'Нет позиций');
    updateItemsDisp('dServices', state.services, 'Нет позиций');
    updateSaveBtn(state);
}

export function buildMechanicsModal(state) {
    const el = document.getElementById('mechList');
    el.innerHTML = MECHANICS.map(name => {
        const sel = state.mechanics.includes(name);
        return `<div class="mech-item${sel?' selected':''}" data-name="${name}"><div class="mech-check"><i class="fa-solid fa-check"></i></div><span class="mech-name">${name}</span></div>`;
    }).join('');
}

export function fillClientModal(state) {
    document.getElementById('inName').value = state.client.name;
    document.getElementById('inPhone').value = state.client.phone;
    document.getElementById('inCar').value = state.client.car;
}

export function buildWheelsModal(state) {
    const RADII = [13,14,15,16,17,18,19,20,21,22,23,24];
    const grid = document.getElementById('radiusGrid');
    grid.innerHTML = RADII.map(r => `<div class="radius-btn${r===state.wheels.radius?' active':''}" data-r="${r}">R${r}</div>`).join('');
    document.querySelectorAll('#typeGrid .type-btn').forEach(btn => {
        btn.classList.toggle('active', state.wheels.types[btn.dataset.type]);
    });
    document.getElementById('wQtyVal').textContent = state.wheels.qty;
}

export function buildItemsModal(listId, items, state) {
    const el = document.getElementById(listId);
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
                            ${Array.from({length:21}, (_,i) => `<option value="${i}" ${i === item.qty ? 'selected' : ''}>${i}</option>`).join('')}
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

    el.querySelectorAll('.item-row').forEach(row => {
        const checkbox = row.querySelector('.item-checkbox');
        if (checkbox) {
            row.classList.toggle('active', checkbox.checked);
            row.classList.toggle('zero', !checkbox.checked);
        }
    });
}

export function updateModalFooterSum(footerId, items) {
    const el = document.getElementById(footerId);
    if (!el) return;
    let sum = items.reduce((s, i) => s + (i.selected && i.qty > 0 ? i.price * i.qty : 0), 0);
    el.innerHTML = sum > 0 ? `<span class="modal-footer-sum-label">Сумма:</span><span class="modal-footer-sum-value">${fmtPrice(sum)}</span>` : '';
}

export function openModal(name, state) {
    const modalMap = {
        mechanics: 'mMechanics', client: 'mClient', wheels: 'mWheels',
        materials: 'mMaterials', services: 'mServices', settings: 'mSettings',
        history: 'mHistory'
    };
    const id = modalMap[name];
    if (!id) return;
    if (name === 'mechanics') buildMechanicsModal(state);
    if (name === 'client') fillClientModal(state);
    if (name === 'wheels') buildWheelsModal(state);
    if (name === 'materials') { buildItemsModal('matList', state.materials, state); updateModalFooterSum('matFooterSum', state.materials); }
    if (name === 'services') {
        const filtered = filterServicesByWheels(state.services, state.wheels);
        const sorted = sortServicesByPrefix(filtered);
        buildItemsModal('svcList', sorted, state);
        updateModalFooterSum('svcFooterSum', filtered);
    }
    if (name === 'settings') buildSettingsModal(state); // нужно добавить
    if (name === 'history') renderHistoryList('today'); // нужно добавить

    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}