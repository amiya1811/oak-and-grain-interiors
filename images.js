/* =====================================================
   OAK & GRAIN – IMAGES CONFIG  (Photos configuration)
   -----------------------------------------------------
   Photos ko "images/" folder mein is naam se rakho:

     wardrobe-pic1.jpg ... wardrobe-pic4.jpg
     bedroom-pic1.jpg ... bedroom-pic4.jpg
     kitchen-pic1.jpg ... kitchen-pic4.jpg
     tvunit-pic1.jpg ... tvunit-pic4.jpg
     kids-pic1.jpg ... kids-pic4.jpg
     living-pic1.jpg ... living-pic4.jpg

   Starting ke slots (hero, about, 4 services):
     Alag photo na ho to ye apne aap category ki photo (pic4) use karte hain:
       hero = living-pic4 | about = kitchen-pic4
       service 1 = wardrobe-pic4 | service 2 = tvunit-pic4
       service 3 = kids-pic4 | service 4 = bedroom-pic4
     Alag photo chahiye to ye naam rakho (ye pehle use hote hain):
       hero.jpg  about.jpg  service-custom.jpg  service-repair.jpg
       service-assembly.jpg  service-consult.jpg

   Jitni photos chaho utni daalo. Jo nahi hongi wo
   apne aap hide ho jayengi (gradient dikhega / gallery mein nahi aayengi).
   Extension jpg / jpeg / png / webp chalega.
   Kisi category mein 4 se zyada photos hon to neeche uska 'count' badha do.
   ===================================================== */
const IMG_DIR = 'images/';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const CATEGORIES = {
  wardrobe: { label: 'Wardrobes', count: 4 },
  bedroom: { label: 'Bedrooms', count: 4 },
  kitchen: { label: 'Kitchens', count: 4 },
  tvunit: { label: 'TV Units', count: 4 },
  kids: { label: 'Kids Rooms', count: 4 },
  living: { label: 'Living Areas', count: 4 }
};

const SPECIAL = {
  /* pehli file mili to wahi lagegi, nahi to agli (category wali) photo */
  hero:  ['hero.jpg', 'living-pic4.jpg'],
  about: ['about.jpg', 'kitchen-pic4.jpg'],
  svc: [
    ['service-custom.jpg',   'wardrobe-pic4.jpg'],
    ['service-repair.jpg',   'tvunit-pic4.jpg'],
    ['service-assembly.jpg', 'kids-pic4.jpg'],
    ['service-consult.jpg',  'bedroom-pic4.jpg']
  ]
};

/* Portfolio ke 6 projects (har category ka 1): pics = pehli 3 photos */
const FEATURED = [
  { t: 'Arch Study Wardrobe', l: 'Whitefield', d: '45 days', g: 'g1', x: 'Blue wardrobe with arch cut-outs and a built-in study desk.', p: ['wardrobe-pic1.jpg', 'wardrobe-pic2.jpg', 'wardrobe-pic3.jpg'] },
  { t: 'Bedroom Suite', l: 'Jayanagar', d: '30 days', g: 'g4', x: 'Bed, side tables and a full-height wardrobe in one design.', p: ['bedroom-pic1.jpg', 'bedroom-pic2.jpg', 'bedroom-pic3.jpg'] },
  { t: 'L-Shape Kitchen', l: 'Koramangala', d: '40 days', g: 'g2', x: 'Modular kitchen with a clean finish and a black chimney.', p: ['kitchen-pic1.jpg', 'kitchen-pic2.jpg', 'kitchen-pic3.jpg'] },
  { t: 'Wood Slat TV Unit', l: 'Indiranagar', d: '25 days', g: 'g3', x: 'Wooden slats, display niches and warm concealed lighting.', p: ['tvunit-pic1.jpg', 'tvunit-pic2.jpg', 'tvunit-pic3.jpg'] },
  { t: 'Kids Arch Bed', l: 'Marathahalli', d: '25 days', g: 'g3', x: 'Storage bed with an arch headboard for a kids’ room.', p: ['kids-pic1.jpg', 'kids-pic2.jpg', 'kids-pic3.jpg'] },
  { t: 'Living Area Partition', l: 'Whitefield', d: '35 days', g: 'g1', x: 'Marble-look partition with strip lighting and display shelves.', p: ['living-pic1.jpg', 'living-pic2.jpg', 'living-pic3.jpg'] }
];

/* helper: photo ke peeche gradient fallback rehta hai */
const bg = f => f ? 'background:' + [].concat(f).map(x => `url(${IMG_DIR}${x}) center/cover no-repeat`).join(',') + ',var(--gr)' : '';
