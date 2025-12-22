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

    // Buttons
    settingsBtn: document.getElementById('settingsBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    retryBtn: document.getElementById('retryBtn'),

    // Modal
    settingsModal: document.getElementById('settingsModal'),
    modalClose: document.getElementById('modalClose'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),

    // PM10 Elements
    pm10TodayDate: document.getElementById('pm10TodayDate'),
    pm10TodayGrade: document.getElementById('pm10TodayGrade'),
    pm10TodayText: document.getElementById('pm10TodayText'),
    pm10TomorrowDate: document.getElementById('pm10TomorrowDate'),
    pm10TomorrowGrade: document.getElementById('pm10TomorrowGrade'),
    pm10TomorrowText: document.getElementById('pm10TomorrowText'),

    // PM2.5 Elements
    pm25TodayDate: document.getElementById('pm25TodayDate'),
    pm25TodayGrade: document.getElementById('pm25TodayGrade'),
    pm25TodayText: document.getElementById('pm25TodayText'),
    pm25TomorrowDate: document.getElementById('pm25TomorrowDate'),
    pm25TomorrowGrade: document.getElementById('pm25TomorrowGrade'),
    pm25TomorrowText: document.getElementById('pm25TomorrowText')
};

// Initialize App
function init() {
    loadApiKey();
    setupEventListeners();

    if (apiKey) {
        loadForecastData();
    } else {
        showError('API 키가 설정되지 않았습니다.<br>설정 버튼을 눌러 API 키를 입력해주세요.');
    }

    // Setup auto-refresh
    setupAutoRefresh();
}

// Load API Key from localStorage
function loadApiKey() {
    apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || '';
}

// Save API Key to localStorage
function saveApiKey(key) {
    apiKey = key;
    localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, key);
}

// Setup Event Listeners
function setupEventListeners() {
    // Settings Modal
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.modalClose.addEventListener('click', closeSettingsModal);
    elements.cancelBtn.addEventListener('click', closeSettingsModal);
    elements.saveBtn.addEventListener('click', saveSettings);

    // Refresh
    elements.refreshBtn.addEventListener('click', handleRefresh);
    elements.retryBtn.addEventListener('click', handleRefresh);

    // Close modal on backdrop click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettingsModal();
        }
    });

    // Enter key in API key input
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });
}

// Open Settings Modal
function openSettingsModal() {
    elements.apiKeyInput.value = apiKey;
    elements.settingsModal.classList.add('active');
}

// Close Settings Modal
function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
}

// Save Settings
function saveSettings() {
    const newApiKey = elements.apiKeyInput.value.trim();

    if (!newApiKey) {
        alert('API 키를 입력해주세요.');
        return;
    }

    saveApiKey(newApiKey);
    closeSettingsModal();
    loadForecastData();
}

// Handle Refresh
function handleRefresh() {
    elements.refreshBtn.classList.add('spinning');
    loadForecastData();
}

// Show Loading State
function showLoading() {
    elements.loading.style.display = 'block';
    elements.error.style.display = 'none';
    elements.mainContent.style.display = 'none';
}

// Show Error State
function showError(message) {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'block';
    elements.mainContent.style.display = 'none';
    elements.errorMessage.innerHTML = message;
}

// Show Main Content
function showContent() {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'none';
    elements.mainContent.style.display = 'block';
    elements.refreshBtn.classList.remove('spinning');
}

// Get Today's Date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get Tomorrow's Date in YYYY-MM-DD format
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format Date for Display (MM월 DD일)
function formatDateForDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}월 ${parseInt(day)}일`;
}

// Build API URL
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

// Fetch Forecast Data
async function fetchForecastData(informCode) {
    try {
        const url = buildApiUrl(informCode);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check API response
        if (data.response.header.resultCode !== '00') {
            throw new Error(data.response.header.resultMsg || 'API 오류가 발생했습니다.');
        }

        return data.response.body.items;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Parse Forecast Data for Seoul
function parseForecastData(items, informCode) {
    if (!items || items.length === 0) {
        return null;
    }

    // Get the most recent forecast
    const latestItem = items[0];

    // Extract Seoul data from informGrade
    const seoulData = extractSeoulData(latestItem.informGrade);

    if (!seoulData) {
        return null;
    }

    return {
        informCode: informCode,
        dataTime: latestItem.dataTime,
        informOverall: latestItem.informOverall,
        informCause: latestItem.informCause,
        today: {
            grade: seoulData.today,
            gradeValue: CONFIG.GRADE_MAP[seoulData.today] || 1
        },
        tomorrow: {
            grade: seoulData.tomorrow,
            gradeValue: CONFIG.GRADE_MAP[seoulData.tomorrow] || 1
        }
    };
}

// Extract Seoul Data from informGrade string
function extractSeoulData(informGrade) {
    if (!informGrade) return null;

    // informGrade format: "서울 : 좋음,제주 : 좋음,전남 : 좋음,..."
    // or with tomorrow: "오늘 전국 : 좋음, 내일 전국 : 보통"

    const lines = informGrade.split(',').map(s => s.trim());
    let todayGrade = null;
    let tomorrowGrade = null;

    for (const line of lines) {
        // Check for Seoul specifically
        if (line.includes('서울')) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const grade = parts[1].trim();
                if (line.includes('내일')) {
                    tomorrowGrade = grade;
                } else {
                    todayGrade = grade;
                }
            }
        }

        // Fallback to national forecast if Seoul not found
        if (line.includes('전국')) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const grade = parts[1].trim();
                if (line.includes('내일')) {
                    if (!tomorrowGrade) tomorrowGrade = grade;
                } else if (line.includes('오늘')) {
                    if (!todayGrade) todayGrade = grade;
                }
            }
        }
    }

    // If still no data, try to parse differently
    if (!todayGrade && !tomorrowGrade) {
        // Simple format: just "서울 : 좋음"
        for (const line of lines) {
            if (line.includes('서울')) {
                const match = line.match(/:\s*(.+)/);
                if (match) {
                    todayGrade = match[1].trim();
                    tomorrowGrade = todayGrade; // Use same for tomorrow if not specified
                    break;
                }
            }
        }
    }

    return {
        today: todayGrade || '정보없음',
        tomorrow: tomorrowGrade || '정보없음'
    };
}

// Load All Forecast Data
async function loadForecastData() {
    if (!apiKey) {
        showError('API 키가 설정되지 않았습니다.<br>설정 버튼을 눌러 API 키를 입력해주세요.');
        return;
    }

    showLoading();

    try {
        // Fetch both PM10 and PM2.5 data
        const [pm10Items, pm25Items] = await Promise.all([
            fetchForecastData(CONFIG.INFORM_CODE.PM10),
            fetchForecastData(CONFIG.INFORM_CODE.PM25)
        ]);

        // Parse data
        const pm10Data = parseForecastData(pm10Items, CONFIG.INFORM_CODE.PM10);
        const pm25Data = parseForecastData(pm25Items, CONFIG.INFORM_CODE.PM25);

        if (!pm10Data && !pm25Data) {
            throw new Error('서울 지역의 예보 데이터를 찾을 수 없습니다.');
        }

        // Store data
        forecastData = {
            pm10: pm10Data,
            pm25: pm25Data,
            lastUpdate: new Date().toISOString()
        };

        // Cache data
        localStorage.setItem(CONFIG.STORAGE_KEYS.CACHED_DATA, JSON.stringify(forecastData));
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, forecastData.lastUpdate);

        // Update UI
        updateUI();
        showContent();

    } catch (error) {
        console.error('Load forecast error:', error);
        showError(
            `데이터를 불러오는 중 오류가 발생했습니다.<br>` +
            `<small>${error.message}</small><br><br>` +
            `API 키가 올바른지 확인해주세요.`
        );
    }
}

// Update UI with Forecast Data
function updateUI() {
    if (!forecastData) return;

    const todayDate = getTodayDate();
    const tomorrowDate = getTomorrowDate();

    // Update last update time
    const lastUpdateDate = new Date(forecastData.lastUpdate);
    elements.lastUpdate.textContent = formatDateTime(lastUpdateDate);

    // Update PM10 data
    if (forecastData.pm10) {
        updateForecastCard(
            elements.pm10TodayDate,
            elements.pm10TodayGrade,
            elements.pm10TodayText,
            todayDate,
            forecastData.pm10.today,
            forecastData.pm10.informOverall
        );

        updateForecastCard(
            elements.pm10TomorrowDate,
            elements.pm10TomorrowGrade,
            elements.pm10TomorrowText,
            tomorrowDate,
            forecastData.pm10.tomorrow,
            forecastData.pm10.informOverall
        );
    }

    // Update PM2.5 data
    if (forecastData.pm25) {
        updateForecastCard(
            elements.pm25TodayDate,
            elements.pm25TodayGrade,
            elements.pm25TodayText,
            todayDate,
            forecastData.pm25.today,
            forecastData.pm25.informOverall
        );

        updateForecastCard(
            elements.pm25TomorrowDate,
            elements.pm25TomorrowGrade,
            elements.pm25TomorrowText,
            tomorrowDate,
            forecastData.pm25.tomorrow,
            forecastData.pm25.informOverall
        );
    }
}

// Update Individual Forecast Card
function updateForecastCard(dateEl, gradeEl, textEl, date, gradeData, overallText) {
    dateEl.textContent = formatDateForDisplay(date);
    gradeEl.setAttribute('data-grade', gradeData.gradeValue);
    gradeEl.querySelector('.grade-text').textContent = gradeData.grade;
    textEl.textContent = overallText || '예보 정보가 없습니다.';
}

// Format DateTime for Display
function formatDateTime(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}월 ${day}일 ${hours}:${minutes}`;
}

// Setup Auto Refresh
function setupAutoRefresh() {
    // Refresh every 4 hours
    setInterval(() => {
        if (apiKey) {
            loadForecastData();
        }
    }, CONFIG.REFRESH_INTERVAL);

    // Also refresh when page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && apiKey) {
            const lastUpdate = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_UPDATE);
            if (lastUpdate) {
                const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
                // Refresh if more than 1 hour has passed
                if (timeSinceUpdate > 60 * 60 * 1000) {
                    loadForecastData();
                }
            }
        }
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
