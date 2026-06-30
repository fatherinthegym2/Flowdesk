import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const ruCommon = require('../public/locales/ru/common.json')
const enCommon = require('../public/locales/en/common.json')

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ru: { common: ruCommon },
      en: { common: enCommon },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
}

export default i18n
