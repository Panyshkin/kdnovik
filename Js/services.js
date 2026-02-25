// services.js — логика услуг и фильтров
import { MECHANICS, MATERIALS, SERVICES } from './storage.js'; // если нужны

export function isConstantService(svc) {
    return (svc.radius === null || svc.radius === undefined) &&
           (svc.carType === null || svc.carType === undefined || svc.carType === '') &&
           !svc.lowProfile && !svc.runflat;
}

export function ensureTechWash(services) {
    const hasTechWash = services.some(s => 
        s.name.includes('Технологическая мойка') && 
        s.radius === null && 
        (s.carType === null || s.carType === '') && 
        !s.lowProfile && !s.runflat
    );
    if (!hasTechWash) {
        const newId = 'tech_wash_' + Date.now();
        services.push({
            id: newId,
            name: '5 Технологическая мойка',
            price: 200,
            radius: null,
            carType: null,
            lowProfile: false,
            runflat: false
        });
        console.log('➕ Добавлена постоянная услуга: Технологическая мойка');
    }
    return services;
}

export function parseServices(services) {
    return services.map(svc => {
        const nameLower = svc.name.toLowerCase();
        
        if (svc.radius === null || svc.radius === undefined) {
            const matchExact = nameLower.match(/r(\d+)/);
            if (matchExact) {
                svc.radius = Number(matchExact[1]);
            } else {
                const matchRange = nameLower.match(/r(\d+)-(\d+)/);
                if (matchRange) {
                    svc.radius = `${matchRange[1]}-${matchRange[2]}`;
                } else if (nameLower.includes('и более')) {
                    const matchMin = nameLower.match(/r(\d+)/);
                    if (matchMin) {
                        svc.radius = `${matchMin[1]} и более`;
                    }
                }
            }
        }
        
        if (svc.carType === null || svc.carType === undefined) {
            if (nameLower.includes('легкового')) {
                svc.carType = 'light';
            } else if (['джип', 'минивэн', 'кроссовер', 'паркетник', 'внедорожник'].some(word => nameLower.includes(word))) {
                svc.carType = 'jeep';
            } else if (nameLower.includes('газель')) {
                svc.carType = 'jeep';
            }
        }
        
        if (!svc.lowProfile && nameLower.includes('низкий профиль')) {
            svc.lowProfile = true;
        }
        if (!svc.runflat && nameLower.includes('runflat')) {
            svc.runflat = true;
        }
        
        return svc;
    });
}

export function serviceMatchesWheels(svc, wheels) {
    const nameLower = String(svc.name).toLowerCase();
    const isMyka = nameLower.includes('технологическая мойка');

    if (isConstantService(svc)) return true;

    let matches = true;

    if (svc.radius !== null && svc.radius !== undefined && wheels.radius) {
        const svcRadius = String(svc.radius);
        const wheelRadius = Number(wheels.radius);

        if (svcRadius.includes('-')) {
            const [minR, maxR] = svcRadius.split('-').map(Number);
            if (wheelRadius < minR || wheelRadius > maxR) matches = false;
        } else if (svcRadius.includes('и более') || nameLower.includes('и более')) {
            const match = nameLower.match(/r(\d+)/);
            const minR = match ? Number(match[1]) : Number(svcRadius);
            if (wheelRadius < minR) matches = false;
        } else if (Number(svcRadius) !== wheelRadius) {
            matches = false;
        }
    }

    if (svc.carType || nameLower.includes('легкового') || nameLower.includes('джип') || nameLower.includes('газель')) {
        const isLightService = nameLower.includes('легкового') || svc.carType === 'light';
        const isJeepService = nameLower.includes('джип') || nameLower.includes('минивэн') ||
                              nameLower.includes('кроссовер') || nameLower.includes('паркетник') ||
                              nameLower.includes('внедорожник') || svc.carType === 'jeep';
        const isGazelle = nameLower.includes('газель');

        const isLightSelected = wheels.types.light;
        const isJeepSelected = wheels.types.jeep;

        if (isMyka) {
            if (isLightSelected && !isLightService) matches = false;
            if (isJeepSelected && !isJeepService) matches = false;
            if (!isLightSelected && !isJeepSelected) matches = false;
        } else {
            if (isLightSelected && isJeepService && !isLightService) matches = false;
            if (isJeepSelected && isLightService && !isJeepService) matches = false;
            if (!isLightSelected && !isJeepSelected && (isLightService || isJeepService || isGazelle)) {
                matches = false;
            }
            if (isGazelle && !isJeepSelected) matches = false;
        }
    }

    if (!isMyka) {
        if (wheels.types.lowProfile && !svc.lowProfile && !nameLower.includes('низкий профиль')) matches = false;
        if (wheels.types.runflat && !svc.runflat && !nameLower.includes('runflat')) matches = false;
    }

    return matches;
}

export function filterServicesByWheels(services, wheels) {
    return services.filter(svc => {
        if (isConstantService(svc)) return true;
        return serviceMatchesWheels(svc, wheels);
    });
}

export function sortServicesByPrefix(services) {
    return [...services].sort((a, b) => {
        const aName = a.name.trim();
        const bName = b.name.trim();

        const aMatch = aName.match(/^([1-5])\s/);
        const bMatch = bName.match(/^([1-5])\s/);

        const aPrefix = aMatch ? parseInt(aMatch[1]) : 999;
        const bPrefix = bMatch ? parseInt(bMatch[1]) : 999;

        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return aName.localeCompare(bName);
    });
}

export function resetInvalidServices(state) {
    let changed = false;
    state.services = state.services.map(svc => {
        if (!isConstantService(svc) && svc.qty > 0 && !serviceMatchesWheels(svc, state.wheels)) {
            svc.qty = 0;
            svc.selected = false;
            changed = true;
        }
        return svc;
    });
    if (changed) {
        // Тут нужно обновить отображение, но это будет делать вызывающий код
    }
    return changed;
}