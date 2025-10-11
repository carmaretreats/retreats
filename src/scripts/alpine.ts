import Alpine from 'alpinejs'

Alpine.data('retreatForm', () => ({
  selectedRetreat: '',
  accommodationOptions: {
    january: [
      'Einzelzimmer – 500€',
      'Doppelbett im Dreibettzimmer – 350€',
      'Stockbetten im Dreibettzimmer – 200€',
      'Retreatgebühr pro Teilnahme – 900€'
    ],
    february: [
      'Einzelzimmer alleine – 520€',
      'Doppelbett geteilt – 340€',
      'Dreierzimmer großes Bett alleine – 440€',
      'Dreierzimmer großes Bett geteilt – 290€',
      'Dreierzimmer kleines Bett – 380€',
      'Retreatgebühr pro Teilnahme – 900€'
    ]
  }
}))

export default () => {}