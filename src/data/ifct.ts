// IFCT 2017 — Indian Food Composition Tables (National Institute of Nutrition, Hyderabad)
// All values per 100g edible fresh-weight portion.

export type FoodCategory =
  | "Rice" | "Wheat" | "Dal" | "Leafy" | "Vegetable"
  | "Root" | "Condiment" | "Spice" | "Oil" | "NutSeed"
  | "Dairy" | "Sweet" | "Homemade" | "Other";

export interface FoodItem {
  id: string;           // use code
  code: string;
  name: string;
  regional: string;
  scientific: string;
  category: FoodCategory;
  moisture: number;
  protein: number;      // g (per 100g, or per servingSize units when servingUnit !== 'g')
  fat: number;          // g
  fibre: number;        // g
  carbs: number;        // g
  energyKj: number;
  calories: number;     // kcal — PRIMARY (per 100g, or per servingSize units when servingUnit !== 'g')
  isCustom?: boolean;
  /** Unit of measurement. Defaults to 'g'. When non-grams, nutrition values are per `servingSize` units. */
  servingUnit?: string;
  /** When servingUnit !== 'g', the number of units the stored macros correspond to. */
  servingSize?: number;
  /** For recipes: the list of constituent ingredients and their quantities. */
  ingredients?: { foodId: string; foodName: string; qty: number }[];
}

export const CATEGORY_META: Record<FoodCategory, { label: string; emoji: string; color: string }> = {
  Rice:       { label: "Rice",       emoji: "🌾", color: "hsl(40 80% 55%)" },
  Wheat:      { label: "Wheat",      emoji: "🫓", color: "hsl(30 70% 50%)" },
  Dal:        { label: "Dal",        emoji: "🫘", color: "hsl(25 85% 50%)" },
  Leafy:      { label: "Leafy",      emoji: "🥬", color: "hsl(110 50% 42%)" },
  Vegetable:  { label: "Veggies",    emoji: "🥦", color: "hsl(130 45% 45%)" },
  Root:       { label: "Roots",      emoji: "🥔", color: "hsl(35 60% 45%)" },
  Condiment:  { label: "Condiments", emoji: "🧅", color: "hsl(15 70% 55%)" },
  Spice:      { label: "Spices",     emoji: "🌶️", color: "hsl(5 80% 50%)" },
  Oil:        { label: "Oils",       emoji: "🫙", color: "hsl(48 90% 55%)" },
  NutSeed:    { label: "Nuts",       emoji: "🥜", color: "hsl(28 55% 45%)" },
  Dairy:      { label: "Dairy",      emoji: "🥛", color: "hsl(210 30% 70%)" },
  Sweet:      { label: "Sweet",      emoji: "🍯", color: "hsl(42 95% 55%)" },
  Homemade:   { label: "Custom",     emoji: "⭐", color: "hsl(20 75% 50%)" },
  Other:      { label: "Other",      emoji: "🍋", color: "hsl(200 40% 55%)" },
};

const f = (
  code: string, name: string, regional: string, scientific: string, category: FoodCategory,
  m: number, p: number, fat: number, fi: number, cb: number, kj: number, kc: number
): FoodItem => ({ id: code, code, name, regional, scientific, category, moisture: m, protein: p, fat, fibre: fi, carbs: cb, energyKj: kj, calories: kc });

export const IFCT_FOODS: FoodItem[] = [
  // Rice
  f("A011","Rice Flakes","Poha / Chira / Aval","Oryza sativa","Rice",10.4,7.44,1.14,3.5,76.8,1480,354),
  f("A012","Rice Puffed","Muri / Murmure / Mamra","Oryza sativa","Rice",9.4,7.47,1.62,2.6,77.7,1514,362),
  f("A013","Rice, Raw Brown","Brown Chawal","Oryza sativa","Rice",9.3,9.16,1.24,4.4,74.8,1480,354),
  f("A014","Rice, Parboiled Milled","Sela / Ukda Chawal","Oryza sativa","Rice",10.1,7.81,0.55,3.7,77.2,1471,352),
  f("A015","Rice, White Milled","Safed Chawal / White Rice","Oryza sativa","Rice",9.9,7.94,0.52,2.8,78.2,1491,356),
  // Wheat
  f("A018","Wheat Flour, Refined","Maida","Triticum aestivum","Wheat",11.3,10.36,0.76,2.8,74.3,1472,352),
  f("A019","Wheat Flour, Whole Wheat","Gehun ka Atta","Triticum aestivum","Wheat",11.1,10.57,1.53,11.4,64.2,1340,320),
  f("A020","Wheat, Whole Grain","Sabut Gehun","Triticum aestivum","Wheat",10.6,10.59,1.47,11.2,64.7,1347,322),
  f("A021","Wheat Bulgur","Daliya / Fada / Dalia","Triticum aestivum","Wheat",8.6,10.84,1.45,8.8,69.1,1430,342),
  f("A022","Wheat Semolina","Suji / Rava / Rawa","Triticum aestivum","Wheat",12.2,10.75,0.65,3.4,71.8,1437,344),
  // Dal
  f("B001","Bengal Gram Dal","Chana Dal","Cicer arietinum","Dal",9.2,21.55,5.31,15.2,46.7,1377,329),
  f("B002","Bengal Gram, Whole","Kabuli Chana / Chole","Cicer arietinum","Dal",8.6,18.77,5.11,25.2,39.6,1201,287),
  f("B003","Black Gram Dal","Urad Dal","Phaseolus mungo","Dal",9.2,23.06,1.69,11.9,51.0,1356,324),
  f("B004","Black Gram, Whole","Sabut Urad / Maa ki Dal","Phaseolus mungo","Dal",8.7,21.97,1.58,20.4,44.0,1219,291),
  f("B005","Cowpea","Lobia / Chawli / Rongi","Vigna catjang","Dal",9.4,20.36,1.15,11.5,54.6,1340,320),
  f("B010","Green Gram Dal","Moong Dal / Peeli Dal","Vigna radiata","Dal",9.8,23.88,1.35,9.4,52.6,1363,326),
  f("B011","Green Gram, Whole","Sabut Moong / Hara Moong","Vigna radiata","Dal",10.0,22.53,1.14,17.0,46.1,1229,294),
  f("B012","Horse Gram","Kulthi / Kulath / Hurali","Dolichos biflorus","Dal",9.3,21.73,0.62,7.9,57.2,1379,330),
  f("B013","Lentil Dal","Masoor Dal / Red Lentil","Lens culinaris","Dal",9.7,24.35,0.75,10.4,52.5,1349,322),
  f("B014","Lentil, Whole Brown","Sabut Masoor","Lens culinaris","Dal",9.2,22.49,0.64,16.8,48.5,1251,299),
  f("B016","Moth Bean","Matki / Moth Dal","Vigna aconitifolia","Dal",8.1,19.75,1.76,15.1,52.1,1291,309),
  f("B017","Peas, Dry","Sukha Matar / Vatana","Pisum sativum","Dal",9.3,20.43,1.89,17.0,48.9,1269,303),
  f("B019","Kidney Beans","Rajma / Rajmah","Phaseolus vulgaris","Dal",9.7,19.50,1.68,17.0,48.8,1245,298),
  f("B021","Red Gram Dal","Toor Dal / Arhar Dal","Cajanus cajan","Dal",9.2,21.70,1.56,9.1,55.2,1384,331),
  f("B022","Red Gram, Whole","Sabut Toor","Cajanus cajan","Dal",9.3,20.47,1.38,22.8,42.5,1146,274),
  // Leafy
  f("D001","Amaranth Leaves","Chaulai / Thotakura","Amaranthus tricolor","Leafy",84.0,4.0,0.56,4.5,6.0,189,45),
  f("D013","Drumstick Leaves","Sahjan ki Patti / Moringa","Moringa oleifera","Leafy",76.5,6.4,1.6,8.2,4.8,255,61),
  f("D015","Fenugreek Leaves","Methi Patta / Venthaya Keerai","Trigonella foenum-graecum","Leafy",85.3,4.36,0.88,4.8,3.4,170,41),
  f("D020","Mustard Leaves","Sarson ka Saag","Brassica juncea","Leafy",89.8,2.4,0.5,2.6,3.3,113,27),
  f("D025","Spinach","Palak / Keerai","Spinacia oleracea","Leafy",91.4,2.14,0.66,2.1,2.1,96,23),
  // Vegetables
  f("E002","Bitter Gourd","Karela / Pavakkai","Momordica charantia","Vegetable",93.9,1.29,0.23,2.6,2.3,68,16),
  f("E003","Bottle Gourd","Lauki / Dudhi / Sorakkai","Lagenaria siceraria","Vegetable",96.0,0.3,0.1,0.5,2.5,50,12),
  f("E007","Brinjal","Baingan / Kathirikai","Solanum melongena","Vegetable",92.0,1.4,0.38,3.4,2.2,77,18),
  f("E009","Capsicum, Green","Shimla Mirch / Kudai Milagai","Capsicum annuum","Vegetable",92.8,1.2,0.3,1.8,4.3,106,25),
  f("E013","Cauliflower","Phool Gobhi","Brassica oleracea","Vegetable",91.7,1.92,0.45,2.4,3.1,111,27),
  f("E016","Cluster Beans","Gawar / Kothavaranga","Cyamopsis tetragonoloba","Vegetable",83.2,3.2,1.4,7.8,4.6,170,41),
  f("E022","Cucumber","Kheera / Vellarikai","Cucumis sativus","Vegetable",95.8,0.5,0.1,0.7,2.4,57,13),
  f("E026","Ladies Finger / Okra","Bhindi / Vendakkai","Abelmoschus esculentus","Vegetable",89.6,1.93,0.28,4.3,3.1,117,28),
  f("E035","Pumpkin, Green","Kaddu / Parangikai","Cucurbita maxima","Vegetable",92.0,1.4,0.2,2.2,4.0,109,26),
  f("E047","Tomato, Ripe, Red","Pakka Tamatar","Solanum lycopersicum","Vegetable",94.5,0.88,0.51,1.4,3.0,91,22),
  f("E048","French Beans","Farasbeen / Green Beans","Phaseolus vulgaris","Vegetable",90.2,1.74,0.39,3.2,4.0,117,28),
  f("E049","Peas, Green","Hari Matar","Pisum sativum","Vegetable",72.9,7.2,0.1,5.1,13.4,360,86),
  // Roots
  f("F002","Carrot, Orange","Gajar","Daucus carota","Root",87.7,0.95,0.47,4.2,5.6,139,33),
  f("F003","Carrot, Red","Lal Gajar","Daucus carota","Root",86.1,1.04,0.47,4.5,6.7,160,38),
  f("F004","Colocasia / Taro","Arbi / Ghuiya","Colocasia esculenta","Root",73.5,3.31,0.17,3.2,17.9,372,89),
  f("F006","Potato, Brown Skin","Aloo / Batata","Solanum tuberosum","Root",80.7,1.54,0.23,1.7,14.9,292,70),
  f("F008","Potato, Red Skin","Lal Aloo","Solanum tuberosum","Root",79.7,1.83,0.22,1.7,15.4,306,73),
  f("F013","Sweet Potato","Shakarkandi / Ratalu","Ipomoea batatas","Root",69.2,1.33,0.26,4.0,24.3,456,109),
  f("F017","Elephant Yam","Suran / Jimikand","Amorphophallus campanulatus","Root",74.4,2.56,0.14,4.2,17.5,353,84),
  // Condiments
  f("G008","Green Chillies","Hari Mirch / Pachimilagai","Capsicum annuum","Condiment",85.4,2.36,0.72,4.8,5.9,177,42),
  f("G009","Coriander Leaves","Hara Dhaniya / Kothamalli","Coriandrum sativum","Condiment",87.0,3.52,0.70,4.7,1.9,130,31),
  f("G010","Curry Leaves","Kadi Patta / Karivepilai","Murraya koenigii","Condiment",65.3,7.41,1.06,16.8,4.5,266,64),
  f("G011","Garlic","Lahsun / Poondu","Allium sativum","Condiment",64.4,6.92,0.16,5.2,21.9,518,124),
  f("G014","Ginger, Fresh","Adrak / Inji / Allam","Zingiber officinale","Condiment",81.3,2.22,0.85,5.4,9.0,230,55),
  f("G016","Mint Leaves","Pudina / Pudhina","Mentha spicata","Condiment",84.2,4.66,0.65,5.9,2.4,155,37),
  f("G017","Onion, Big","Pyaaz / Kanda / Vengayam","Allium cepa","Condiment",85.8,1.50,0.24,2.5,9.6,201,48),
  f("G018","Onion, Small / Shallot","Chhota Pyaaz / Sambar Onion","Allium cepa","Condiment",84.7,1.82,0.16,1.2,11.6,237,57),
  // Spices
  f("G019","Asafoetida","Hing / Perungayam","Ferula assa-foetida","Spice",9.4,6.34,1.26,5.1,72.0,1387,331),
  f("G020","Cardamom, Green","Elaichi / Elakkai","Elettaria cardamomum","Spice",11.2,8.10,2.60,23.1,47.8,1067,255),
  f("G022","Red Chillies, Dry","Sukhi Lal Mirch / Molaga","Capsicum annuum","Spice",14.6,12.69,6.40,31.2,29.5,990,237),
  f("G024","Coriander Seeds","Sabut Dhaniya","Coriandrum sativum","Spice",8.7,10.66,17.47,44.8,13.0,1125,269),
  f("G025","Cumin Seeds","Jeera / Jeeragam","Cuminum cyminum","Spice",10.6,13.91,16.64,30.4,22.6,1274,305),
  f("G026","Fenugreek Seeds","Methi Dana / Vendhayam","Trigonella foenum-graecum","Spice",7.8,25.41,5.72,47.6,10.6,983,235),
  f("G031","Black Pepper","Kali Mirch / Milagu","Piper nigrum","Spice",13.2,10.12,2.74,33.2,36.2,910,218),
  f("G033","Turmeric Powder","Haldi / Manjal / Pasupu","Curcuma domestica","Spice",10.6,7.66,5.03,21.4,49.2,1174,281),
  f("H013","Mustard Seeds","Rai / Sarson / Kadugu","Brassica nigra","Spice",5.7,19.51,40.19,14.1,16.8,2132,510),
  // Oils
  f("T001","Coconut Oil","Nariyal Tel / Thengai Ennai","Cocos nucifera","Oil",0.0,0.0,100.0,0.0,0.0,3766,900),
  f("T004","Sesame / Gingelly Oil","Til Tel / Nalla Ennai","Sesamum indicum","Oil",0.0,0.0,100.0,0.0,0.0,3766,900),
  f("T005","Groundnut Oil","Moongphali Tel","Arachis hypogaea","Oil",0.0,0.0,100.0,0.0,0.0,3766,900),
  f("T006","Mustard Oil","Sarson Tel / Kadugu Ennai","Brassica nigra","Oil",0.0,0.0,100.0,0.0,0.0,3766,900),
  f("T012","Sunflower Oil","Surajmukhi Tel","Helianthus annuus","Oil",0.0,0.0,100.0,0.0,0.0,3766,900),
  f("T013","Ghee","Desi Ghee / Pure Clarified Butter","Bos taurus","Oil",0.5,0.0,99.5,0.0,0.0,3750,897),
  // Nuts
  f("H001","Almond","Badam","Prunus amygdalus","NutSeed",4.4,18.41,58.49,13.1,3.0,2549,609),
  f("H005","Cashew Nut","Kaju / Mundiri Paruppu","Anacardium occidentale","NutSeed",4.4,18.78,45.20,3.9,25.5,2438,583),
  f("H007","Coconut, Fresh Kernel","Nariyal / Thengai","Cocos nucifera","NutSeed",36.1,3.84,41.38,10.4,6.3,1711,409),
  f("H009","Sesame Seeds, Black","Kala Til / Karuppu Ellu","Sesamum indicum","NutSeed",4.5,19.17,43.10,17.2,10.3,2124,508),
  f("H012","Groundnut / Peanut","Moongphali / Kadala","Arachis hypogaea","NutSeed",7.0,23.65,39.63,10.4,17.3,2176,520),
  f("H021","Walnut","Akhrot","Juglans regia","NutSeed",3.6,14.92,64.27,5.4,10.1,2809,671),
  // Dairy
  f("L001","Milk, Buffalo Whole","Bhains ka Doodh","Bubalus bubalis","Dairy",80.7,3.68,6.58,0.0,8.4,449,107),
  f("L002","Milk, Cow Whole","Gaay ka Doodh","Bos taurus","Dairy",86.6,3.26,4.48,0.0,4.9,305,73),
  f("L003","Paneer","Indian Cottage Cheese","Bos / Bubalus sp.","Dairy",52.0,18.86,24.78,0.0,2.4,1278,305),
  f("L004","Khoa / Mawa","Concentrated Milk Solid","Bos / Bubalus sp.","Dairy",42.5,16.34,20.62,0.0,16.5,1322,316),
  f("L005","Curd / Yogurt","Dahi / Thayir","Bos taurus","Dairy",86.0,3.11,4.25,0.0,5.8,290,69),
  // Sweet
  f("I001","Jaggery, Cane","Gur / Bella / Vellam","Saccharum officinarum","Sweet",11.2,1.85,0.16,0.0,84.9,1480,354),
  f("SU01","White Sugar","Cheeni / Shakkar","Saccharum officinarum","Sweet",0.0,0.0,0.0,0.0,99.9,1674,400),
  f("SU02","Honey","Shahad / Madhu / Thaen","Apis mellifera","Sweet",17.1,0.30,0.0,0.2,82.4,1272,304),
  // Other
  f("E064","Tamarind Pulp","Imli / Puli","Tamarindus indica","Other",20.8,2.92,0.15,5.3,67.4,1207,288),
  f("E033","Lemon Juice","Nimbu ka Ras","Citrus limon","Other",91.6,0.41,0.75,0.0,7.0,153,37),
  f("K002","Coconut Water","Nariyal Pani / Thengai Neer","Cocos nucifera","Other",95.8,0.26,0.16,0.0,3.2,64,15),
  f("J001","Button Mushroom","Khumb / Dhingri","Agaricus sp.","Other",90.1,3.68,0.42,3.1,2.0,115,27),
  f("I002","Sugarcane Juice","Ganna ka Ras","Saccharum officinarum","Other",85.5,0.16,0.40,0.6,13.1,242,58),
];
