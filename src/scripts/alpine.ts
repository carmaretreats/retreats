import Alpine from 'alpinejs'

Alpine.data('retreatForm', () => ({
  selectedRetreat: localStorage.getItem('selectedRetreat') || '',
  accommodationOptions: {
    january: [
      'Einzelzimmer – 500 €',
      'Doppelbett im Dreibettzimmer – 350 €',
      'Stockbetten im Dreibettzimmer – 200 €'
    ],
    february: [
      'Einzelzimmer allein/Doppelbett geteilt – 520 / 340 €',
      'Dreier Zimmer: großes Bett alleine/geteilt – 440 / 290 €',
      'Dreierzimmer kleines Bett – 380 €'
    ]
  }
}))

export default () => {}