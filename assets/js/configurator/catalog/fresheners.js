window.CFG_CONFIG = {
  id: 'fresheners',
  title: 'Ароматизатори',
  defaultModel: 'freshener-walnut-silver',
  features: {
    doubleSided: false,
    engraveSim: true,
  },
  models: {
    'freshener-walnut-silver': {
      name: 'Ароматизатор орех / сребро',
      shortName: 'Орех сребро',
      src: 'assets/configurator/fresheners/freshener-walnut-silver-blank.png',
      mask: null,
      textCY: 0.50,
      textMaxW: 0.78,
      clipH: 0.42,
      price: 15,
      currency: '€',
    },
    'freshener-walnut-black': {
      name: 'Ароматизатор орех / черно',
      shortName: 'Орех черно',
      src: 'assets/configurator/fresheners/freshener-walnut-black-blank.png',
      mask: null,
      textCY: 0.50,
      textMaxW: 0.78,
      clipH: 0.42,
      price: 15,
      currency: '€',
    },
  },
  templates: [
    { name: 'Само Имена', line1: 'ИВАН ПЕТРОВ', line2: '', font: 'Montserrat', size: 20, color: '#2D1005', letterSpacing: 1 },
    { name: 'Имена + Дата', line1: 'ИВАН ПЕТРОВ', line2: '12.06.2024', font: 'Montserrat', size: 16, color: '#2D1005', letterSpacing: 0 },
    { name: 'Компания', line1: 'ФИРМА ООД', line2: 'firmata.com', font: 'Montserrat', size: 14, color: '#1a1a1a', letterSpacing: 2 },
    { name: 'Монограм', line1: 'И.П.', line2: '', font: 'Playfair Display', size: 32, color: '#1a1a1a', letterSpacing: 4 },
  ],
};
