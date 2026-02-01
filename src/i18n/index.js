import { createI18n } from 'vue-i18n';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('language') || 'zh-TW',
    fallbackLocale: 'zh-TW',
    messages: {
        'zh-TW': zhTW,
        'ja': ja
    }
});

export default i18n;
