// Configuration constants
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc',
    API_ENDPOINT: '/getMinuDustFrcstDspth',
    
    // Request Parameters
    RETURN_TYPE: 'json',
    NUM_OF_ROWS: 100,
    PAGE_NO: 1,
    
    // Information Codes
    INFORM_CODE: {
        PM10: 'PM10',
        PM25: 'PM25'
    },
    
    // Search Condition
    SEARCH_CONDITION: 'HOUR',
    
    // Grade Mapping
    GRADE_MAP: {
        '좋음': 1,
        '보통': 2,
        '나쁨': 3,
        '매우나쁨': 4
    },
    
    GRADE_TEXT: {
        1: '좋음',
        2: '보통',
        3: '나쁨',
        4: '매우나쁨'
    },
    
    // Update Schedule (hours in 24-hour format)
    UPDATE_HOURS: [5, 11, 17, 23],
    
    // Auto-refresh interval (4 hours in milliseconds)
    REFRESH_INTERVAL: 4 * 60 * 60 * 1000,
    
    // Local Storage Keys
    STORAGE_KEYS: {
        API_KEY: 'airkorea_api_key',
        LAST_UPDATE: 'last_update_time',
        CACHED_DATA: 'cached_forecast_data'
    },
    
    // Region
    REGION: '서울'
};
