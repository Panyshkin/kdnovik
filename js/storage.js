// storage.js — загрузка/сохранение данных
export const STORAGE_KEYS = {
    mechanics: 'tireShop_mechanics',
    materials: 'tireShop_materials',
    services: 'tireShop_services_v2',
    state: 'tireShop_state',
    orders: 'tireShop_orders',
    selectedSubdivision: 'tireShop_selectedSubdivision'
};

// Глобальные эталонные списки (экспортируются)
export let MECHANICS = [];
export let MATERIALS = [];
export let SERVICES = [];

// Вспомогательные функции парсинга и проверки (импортируются из services)
import { parseServices, ensureTechWash } from './services.js';

export function loadListsFromStorage() {
    const storedMech = localStorage.getItem(STORAGE_KEYS.mechanics);
    if (storedMech) { try { MECHANICS = JSON.parse(storedMech); } catch(e){ MECHANICS = []; } }
    if (!MECHANICS || !MECHANICS.length) {
        MECHANICS = ['Андреев Андрей','Борисов Борис','Власов Владислав','Григорьев Григорий','Дмитриев Дмитрий','Егоров Егор','Жуков Жорж','Зайцев Захар'];
    }

    const storedMat = localStorage.getItem(STORAGE_KEYS.materials);
    if (storedMat) { try { MATERIALS = JSON.parse(storedMat); } catch(e){ MATERIALS = []; } }
    if (!MATERIALS || !MATERIALS.length) {
        MATERIALS = [
            {id:1, name:'Расходные материалы', price:150},{id:2, name:'Грузик набивной', price:50},{id:3, name:'Грузик самоклеющийся', price:80},
            {id:4, name:'Вентиль простой', price:100},{id:5, name:'Вентиль хром', price:250},{id:6, name:'Жгут', price:200}
        ];
    }

    const storedSvc = localStorage.getItem(STORAGE_KEYS.services);
    if (storedSvc) {
        try { SERVICES = JSON.parse(storedSvc); } catch(e){ SERVICES = []; }
        SERVICES = parseServices(SERVICES);
        ensureTechWash(SERVICES);
    }
    if (!SERVICES || !SERVICES.length) {
        SERVICES = [
            {id:1, name:'Съём и установка колеса R16 light', price:300, radius:16, carType:'light', lowProfile:false, runflat:false},
            {id:2, name:'Демонтаж шины R17 light', price:250, radius:17, carType:'light', lowProfile:false, runflat:false},
            {id:3, name:'Монтаж шины R17 light', price:250, radius:17, carType:'light', lowProfile:false, runflat:false},
            {id:4, name:'Балансировка R17 light', price:350, radius:17, carType:'light', lowProfile:false, runflat:false},
            {id:5, name:'Технологическая мойка', price:200, radius:null, carType:null, lowProfile:false, runflat:false},
            {id:6, name:'Сложность с датчиком', price:500, radius:null, carType:null, lowProfile:false, runflat:false},
            {id:7, name:'Обработка ступицы', price:150, radius:null, carType:null, lowProfile:false, runflat:false},
            {id:8, name:'Шиноремонт жгутом', price:400, radius:null, carType:null, lowProfile:false, runflat:false},
            {id:9, name:'Съём и установка камеры', price:350, radius:null, carType:null, lowProfile:false, runflat:false},
            {id:10, name:'Погрузка колеса в сборе', price:100, radius:null, carType:null, lowProfile:false, runflat:false}
        ];
        SERVICES = parseServices(SERVICES);
        ensureTechWash(SERVICES);
    }
}

export function saveListsToStorage() {
    localStorage.setItem(STORAGE_KEYS.mechanics, JSON.stringify(MECHANICS));
    localStorage.setItem(STORAGE_KEYS.materials, JSON.stringify(MATERIALS));
    localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(SERVICES));
}

export function loadStateFromStorage(state) {
    const stored = localStorage.getItem(STORAGE_KEYS.state);
    if (stored) {
        try { Object.assign(state, JSON.parse(stored)); } catch(e){}
    }
}

export function saveStateToStorage(state) {
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
}

export function reconcileStateWithLists(state) {
    state.mechanics = state.mechanics.filter(name => MECHANICS.includes(name));

    const materialMap = new Map(state.materials.map(m => [m.id, m]));
    state.materials = MATERIALS.map(src => ({
        ...src,
        qty: materialMap.has(src.id) ? materialMap.get(src.id).qty : 0,
        selected: materialMap.has(src.id) ? materialMap.get(src.id).selected : false
    }));

    const serviceMap = new Map(state.services.map(s => [s.id, s]));
    state.services = SERVICES.map(src => ({
        ...src,
        qty: serviceMap.has(src.id) ? serviceMap.get(src.id).qty : 0,
        selected: serviceMap.has(src.id) ? serviceMap.get(src.id).selected : false
    }));
}

window.MECHANICS = MECHANICS;
window.MATERIALS = MATERIALS;
window.SERVICES = SERVICES;
