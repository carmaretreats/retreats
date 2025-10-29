import Alpine from 'alpinejs'
import pageData from '../../src/content/retreats-page.json'; 

const retreatData = pageData.retreats;
const accommodationMap = Object.fromEntries(
  retreatData.map(r => [r.id, r.accommodationOptions])
);

Alpine.data('retreatForm', () => ({
  selectedRetreat: localStorage.getItem('selectedRetreat') || '',
  accommodationOptions: accommodationMap,
}));

export default () => {}