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
    refreshBtn: document.getElementById('refreshBtn'),
    retryBtn: document.getElementById('retryBtn'),

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
    loadForecastData();

    // Setup auto-refresh
    setupAutoRefresh();
}

// Load API Key from config
function loadApiKey() {
    apiKey = CONFIG.DEFAULT_API_KEY || '';
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh
    elements.refreshBtn.addEventListener('click', handleRefresh);
    elements.retryBtn.addEventListener('click', handleRefresh);
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

// Format Date for Display (MM??DD??
function formatDateForDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}??${parseInt(day)}??;
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

        // ?” DEBUG: Log raw API response
        console.log(`=== ${informCode} API Response ===`);
        console.log(JSON.stringify(data, null, 2));


        // Check API response
        if (data.response.header.resultCode !== '00') {
            throw new Error(data.response.header.resultMsg || 'API ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
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

    console.log(`?“‹ Parsing ${informCode} data...`);
    console.log('Total items:', items.length);

    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    console.log('Today:', today);
    console.log('Tomorrow:', tomorrow);

    let todayData = null;
    let tomorrowData = null;

    // Find data by date
    for (const item of items) {
        console.log(`Checking item - informData: ${item.informData}, informCode: ${item.informCode}`);

        if (item.informCode !== informCode) {
            continue;
        }

        if (item.informData === today) {
            console.log('??Found TODAY data');
            todayData = item;
        } else if (item.informData === tomorrow) {
            console.log('??Found TOMORROW data');
            tomorrowData = item;
        }
    }

    if (!todayData && !tomorrowData) {
        console.warn('? ï¸ No data found for today or tomorrow');
        return null;
    }

    // Extract Seoul grade from informGrade
    const todaySeoulGrade = todayData ? extractSeoulGrade(todayData.informGrade) : '?•ë³´?†ìŒ';
    const tomorrowSeoulGrade = tomorrowData ? extractSeoulGrade(tomorrowData.informGrade) : '?•ë³´?†ìŒ';

    console.log('Today Seoul grade:', todaySeoulGrade);
    console.log('Tomorrow Seoul grade:', tomorrowSeoulGrade);

    return {
        informCode: informCode,
        dataTime: todayData?.dataTime || tomorrowData?.dataTime,
        todayInformCause: todayData?.informCause || '?•ë³´ ?†ìŒ',
        tomorrowInformCause: tomorrowData?.informCause || '?•ë³´ ?†ìŒ',
        today: {
            grade: todaySeoulGrade,
            gradeValue: CONFIG.GRADE_MAP[todaySeoulGrade] || 1
        },
        tomorrow: {
            grade: tomorrowSeoulGrade,
            gradeValue: CONFIG.GRADE_MAP[tomorrowSeoulGrade] || 1
        }
    };
}

// Extract Seoul Grade from informGrade string
function extractSeoulGrade(informGrade) {
    if (!informGrade) return '?•ë³´?†ìŒ';

    console.log('Extracting Seoul grade from:', informGrade);

    // informGrade format: "?œìš¸ : ë³´í†µ,?œì£¼ : ì¢‹ìŒ,?„ë‚¨ : ì¢‹ìŒ,..."
    const regions = informGrade.split(',').map(s => s.trim());

    for (const region of regions) {
        if (region.includes('?œìš¸')) {
            const parts = region.split(':');
            if (parts.length >= 2) {
                const grade = parts[1].trim();
                console.log('Found Seoul grade:', grade);
                return grade;
            }
        }
    }

    console.warn('? ï¸ Seoul grade not found, using default');
    return '?•ë³´?†ìŒ';
}

// Load All Forecast Data
async function loadForecastData() {
    if (!apiKey) {
        showError('API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??<br>?¤ì • ë²„íŠ¼???ŒëŸ¬ API ?¤ë? ?…ë ¥?´ì£¼?¸ìš”.');
        return;
    }

    showLoading();

    console.log('?? Starting API fetch...');
    console.log('API Key:', apiKey.substring(0, 10) + '...');

    try {
        // Fetch both PM10 and PM2.5 data
        console.log('?“¡ Fetching PM10 data...');
        const pm10Items = await fetchForecastData(CONFIG.INFORM_CODE.PM10);
        console.log('??PM10 data received');

        console.log('?“¡ Fetching PM2.5 data...');
        const pm25Items = await fetchForecastData(CONFIG.INFORM_CODE.PM25);
        console.log('??PM2.5 data received');

        // Parse data
        console.log('?”„ Parsing PM10 data...');
        const pm10Data = parseForecastData(pm10Items, CONFIG.INFORM_CODE.PM10);
        console.log('PM10 parsed:', pm10Data);

        console.log('?”„ Parsing PM2.5 data...');
        const pm25Data = parseForecastData(pm25Items, CONFIG.INFORM_CODE.PM25);
        console.log('PM2.5 parsed:', pm25Data);

        if (!pm10Data && !pm25Data) {
            throw new Error('?œìš¸ ì§€??˜ ?ˆë³´ ?°ì´?°ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
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
        console.log('?¨ Updating UI...');
        updateUI();
        showContent();
        console.log('??All done!');

    } catch (error) {
        console.error('??Load forecast error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showError(
            `?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.<br>` +
            `<small>${error.message}</small><br><br>` +
            `API ?¤ê? ?¬ë°”ë¥¸ì? ?•ì¸?´ì£¼?¸ìš”.<br><br>` +
            `<small>F12ë¥??ŒëŸ¬ ì½˜ì†”???•ì¸?˜ì„¸??</small>`
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
            forecastData.pm10.todayInformCause
        );

        updateForecastCard(
            elements.pm10TomorrowDate,
            elements.pm10TomorrowGrade,
            elements.pm10TomorrowText,
            tomorrowDate,
            forecastData.pm10.tomorrow,
            forecastData.pm10.tomorrowInformCause
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
            forecastData.pm25.todayInformCause
        );

        updateForecastCard(
            elements.pm25TomorrowDate,
            elements.pm25TomorrowGrade,
            elements.pm25TomorrowText,
            tomorrowDate,
            forecastData.pm25.tomorrow,
            forecastData.pm25.tomorrowInformCause
        );
    }
}

// Update Individual Forecast Card
function updateForecastCard(dateEl, gradeEl, textEl, date, gradeData, causeText) {
    dateEl.textContent = formatDateForDisplay(date);
    gradeEl.setAttribute('data-grade', gradeData.gradeValue);
    gradeEl.querySelector('.grade-text').textContent = gradeData.grade;
    textEl.textContent = causeText || '?ˆë³´ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.';
}

// Format DateTime for Display
function formatDateTime(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}??${day}??${hours}:${minutes}`;
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
