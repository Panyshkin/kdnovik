export async function loadSettingsFrom1C(subdivision) {
  try {
    const response = await fetch('https://1c-proxy-vercel.vercel.app/api/get-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdivision })
    });

    const data = await response.json();

    if (data.success) {
      MECHANICS = data.mechanics || [];
      MATERIALS = data.materials || [];
      SERVICES = data.services || [];
      SERVICES = parseServices(SERVICES);
      ensureTechWash();

      saveListsToStorage();
      localStorage.setItem(STORAGE_KEYS.selectedSubdivision, subdivision);
      reconcileStateWithLists(state);
      updateAllDisplays(state);
      showToast('✅ Настройки загружены');
    } else {
      showToast('❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (error) {
    console.error(error);
    showToast('❌ Ошибка соединения');
  }
}
