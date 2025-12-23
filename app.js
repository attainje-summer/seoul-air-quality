// App State
let apiKey = '';
let forecastData = null;

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('errorMessage'),
    mainContent: document.getElementById('mainContent'),
    lastUpdate: document.getElementById('lastUpdate'),
    refreshBtn: document.getElementById('refreshBtn'),
    retryBtn: document.getElementById('retryBtn'),
    pm10TodayDate: document.getElementById('pm10TodayDate'),
    pm10TodayGrade: document.getElementById('pm10TodayGrade'),
    pm10TodayText: document.getElementById('pm10TodayText'),
    pm10TomorrowDate: document.getElementById('pm10TomorrowDate'),
    pm10TomorrowGrade: document.getElementById('pm10TomorrowGrade'),
    pm10TomorrowText: document.getElementById('pm10TomorrowText'),
    pm25TodayDate: document.getElementById('pm25TodayDate'),
    pm25TodayGrade: document.getElementById('pm25TodayGrade'),
    pm25TodayText: document.getElementById('pm25TodayText'),
    pm25TomorrowDate: document.getElementById('pm25TomorrowDate'),
    pm25TomorrowGrade: document.getElementById('pm25TomorrowGrade'),
    pm25TomorrowText: document.getElementById('pm25TomorrowText')
};

function init() {
    loadApiKey();
    setupEventListeners();
    loadForecastData();
    setupAutoRefresh();
}

function loadApiKey() {
    apiKey = CONFIG.DEFAULT_API_KEY || '';
}

function setupEventListeners() {
    elements.refreshBtn.addEventListener('click', handleRefresh);
    elements.retryBtn.addEventListener('click', handleRefresh);
}

function handleRefresh() {
    elements.refreshBtn.classList.add('spinning');
    loadForecastData();
}

function showLoading() {
    elements.loading.style.display = 'block';
    elements.error.style.display = 'none';
    elements.mainContent.style.display = 'none';
}

function showError(message) {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'block';
    elements.mainContent.style.display = 'none';
    elements.errorMessage.innerHTML = message;
}

function showContent() {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'none';
    elements.mainContent.style.display = 'block';
    elements.refreshBtn.classList.remove('spinning');
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}월${parseInt(day)}일`;
}

function buildApiUrl(informCode) {
    const searchDate = getTodayDate();
    const url = new URL(CONFIG.API_BASE_URL + CONFIG.API_ENDPOINT);
    url.searchParams.append('serviceKey', apiKey);
    url.searchParams.append('returnType', CONFIG.RETURN_TYPE);
    url.searchParams.append('numOfRows', CONFIG.NUM_OF_ROWS);
    url.searchParams.append('pageNo', CONFIG.PAGE_NO);
    url.searchParams.append('searchDate', searchDate);
    url.searchParams.append('InformCode', informCode);
    return url.toString();
}

async function fetchForecastData(informCode) {
    try {
        const url = buildApiUrl(informCode);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`=== ${informCode} API Response ===`);
        console.log(JSON.stringify(data, null, 2));
        if (data.response.header.resultCode !== '00') {
            throw new Error(data.response.header.resultMsg || 'API error');
        }
        return data.response.body.items;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function parseForecastData(items, informCode) {
    if (!items || items.length === 0) return null;
    console.log(`Parsing ${informCode} data...`);
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();
    let todayData = null;
    let tomorrowData = null;
    for (const item of items) {
        if (item.informCode !== informCode) continue;
        if (item.informData === today) todayData = item;
        else if (item.informData === tomorrow) tomorrowData = item;
    }
    if (!todayData && !tomorrowData) return null;
    const todaySeoulGrade = todayData ? extractSeoulGrade(todayData.informGrade) : 'N/A';
    const tomorrowSeoulGrade = tomorrowData ? extractSeoulGrade(tomorrowData.informGrade) : 'N/A';
    return {
        informCode: informCode,
        dataTime: todayData?.dataTime || tomorrowData?.dataTime,
        todayInformCause: todayData?.informCause || 'No data',
        tomorrowInformCause: tomorrowData?.informCause || 'No data',
        today: { grade: todaySeoulGrade, gradeValue: CONFIG.GRADE_MAP[todaySeoulGrade] || 1 },
        tomorrow: { grade: tomorrowSeoulGrade, gradeValue: CONFIG.GRADE_MAP[tomorrowSeoulGrade] || 1 }
    };
}

function extractSeoulGrade(informGrade) {
    if (!informGrade) return 'N/A';
    const regions = informGrade.split(',').map(s => s.trim());
    for (const region of regions) {
        if (region.includes('서울')) {
            const parts = region.split(':');
            if (parts.length >= 2) return parts[1].trim();
        }
    }
    return 'N/A';
}

async function loadForecastData() {
    if (!apiKey) {
        showError('API key not configured');
        return;
    }
    showLoading();
    console.log('Starting API fetch...');
    try {
        const pm10Items = await fetchForecastData(CONFIG.INFORM_CODE.PM10);
        const pm25Items = await fetchForecastData(CONFIG.INFORM_CODE.PM25);
        const pm10Data = parseForecastData(pm10Items, CONFIG.INFORM_CODE.PM10);
        const pm25Data = parseForecastData(pm25Items, CONFIG.INFORM_CODE.PM25);
        if (!pm10Data && !pm25Data) {
            throw new Error('No forecast data found');
        }
        forecastData = {
            pm10: pm10Data,
            pm25: pm25Data,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.CACHED_DATA, JSON.stringify(forecastData));
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, forecastData.lastUpdate);
        updateUI();
        showContent();
        console.log('All done!');
    } catch (error) {
        console.error('Load error:', error);
        showError(`Error loading data.<br><small>${error.message}</small><br><br>Check API key.<br><small>Press F12 for console</small>`);
    }
}

function updateUI() {
    if (!forecastData) return;
    const todayDate = getTodayDate();
    const tomorrowDate = getTomorrowDate();
    const lastUpdateDate = new Date(forecastData.lastUpdate);
    elements.lastUpdate.textContent = formatDateTime(lastUpdateDate);
    if (forecastData.pm10) {
        updateForecastCard(elements.pm10TodayDate, elements.pm10TodayGrade, elements.pm10TodayText, todayDate, forecastData.pm10.today, forecastData.pm10.todayInformCause);
        updateForecastCard(elements.pm10TomorrowDate, elements.pm10TomorrowGrade, elements.pm10TomorrowText, tomorrowDate, forecastData.pm10.tomorrow, forecastData.pm10.tomorrowInformCause);
    }
    if (forecastData.pm25) {
        updateForecastCard(elements.pm25TodayDate, elements.pm25TodayGrade, elements.pm25TodayText, todayDate, forecastData.pm25.today, forecastData.pm25.todayInformCause);
        updateForecastCard(elements.pm25TomorrowDate, elements.pm25TomorrowGrade, elements.pm25TomorrowText, tomorrowDate, forecastData.pm25.tomorrow, forecastData.pm25.tomorrowInformCause);
    }
}

function updateForecastCard(dateEl, gradeEl, textEl, date, gradeData, causeText) {
    dateEl.textContent = formatDateForDisplay(date);
    gradeEl.setAttribute('data-grade', gradeData.gradeValue);
    gradeEl.querySelector('.grade-text').textContent = gradeData.grade;
    textEl.textContent = causeText || 'No forecast information';
}

function formatDateTime(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}월${day}일 ${hours}:${minutes}`;
}

function setupAutoRefresh() {
    setInterval(() => { if (apiKey) loadForecastData(); }, CONFIG.REFRESH_INTERVAL);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && apiKey) {
            const lastUpdate = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_UPDATE);
            if (lastUpdate) {
                const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
                if (timeSinceUpdate > 60 * 60 * 1000) loadForecastData();
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
