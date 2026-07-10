/** Базови цени → assets/js/pricing-config.js → engrave.categories.keychains */
window.CFG_CONFIG = {
  id: 'keychains',
  title: 'Ключодържатели',
  defaultModel: 'keychain-round-light',
  features: {
    doubleSided: true,
    engraveSim: true,
  },
  models: {
    'keychain-round-light': {
      name: 'Кръгъл светъл бук',
      shortName: 'Кръгъл бук',
      src: 'assets/configurator/keychains/round-light/blank.png',
      mask: 'assets/configurator/keychains/round-light/mask.png',
      textCY: 0.67,
      textMaxW: 0.72,
    },
    'keychain-rect-walnut-leather': {
      name: 'Правоъгълен орех с кожа',
      shortName: 'Орех кожа',
      src: 'assets/configurator/keychains/rect-walnut-leather/blank.png',
      mask: 'assets/configurator/keychains/rect-walnut-leather/mask.png',
      textCY: 0.62,
      textMaxW: 0.68,
      clipH: 0.36,
    },
    'keychain-rect-walnut-chain': {
      name: 'Правоъгълен орех с верижка',
      shortName: 'Орех верижка',
      src: 'assets/configurator/keychains/rect-walnut-chain/blank.png',
      mask: 'assets/configurator/keychains/rect-walnut-chain/mask.png',
      textCY: 0.55,
      textMaxW: 0.62,
      clipH: 0.32,
    },
  },
  templates: [
    { name: 'Само Имена', line1: 'ИВАН ПЕТРОВ', line2: '', font: 'Montserrat', size: 22, color: '#2D1005', letterSpacing: 1 },
    { name: 'Имена + Дата', line1: 'ИВАН ПЕТРОВ', line2: '12.06.2024', font: 'Montserrat', size: 18, color: '#2D1005', letterSpacing: 0 },
    { name: 'Калиграфски', line1: 'Иван', line2: 'Петров', font: 'Dancing Script', size: 28, color: '#2D1005', letterSpacing: 0 },
    { name: 'Монограм', line1: 'И.П.', line2: '', font: 'Playfair Display', size: 36, color: '#1a1a1a', letterSpacing: 5 },
    { name: 'Компания', line1: 'ФИРМА ООД', line2: 'firmata.com', font: 'Montserrat', size: 16, color: '#1a1a1a', letterSpacing: 2 },
  ],
};
