/** Endless drink catalog + search spawn. */

const HEX = {
  lager: 0xe8c547,
  pils: 0xf0d56a,
  amber: 0xc47a22,
  stout: 0x2a1408,
  wheat: 0xf3e3a1,
  ipa: 0xd4a017,
  redWine: 0x5c1220,
  whiteWine: 0xf4e8b0,
  rose: 0xe8a0b0,
  champagne: 0xf7e7a8,
  vodka: 0xe8f4ff,
  gin: 0xd5f0e8,
  rum: 0xb87333,
  darkRum: 0x5c3317,
  whiskey: 0xc47b20,
  bourbon: 0xb85c10,
  scotch: 0xc9a227,
  tequila: 0xf2e6c0,
  mezcal: 0xd9c7a0,
  brandy: 0xa3471a,
  cognac: 0x8b3a12,
  fireball: 0xd35400,
  jager: 0x1a1208,
  malibu: 0xf5f0e6,
  campari: 0xc41e3a,
  aperol: 0xff6b35,
  vermouth: 0x6b1c23,
  soda: 0xf0f7ff,
  cola: 0x3b2218,
  tonic: 0xeef6f2,
  ginger: 0xd9a441,
  cran: 0xa81c2a,
  oj: 0xf5a31a,
  lime: 0x8fd16a,
  pineapple: 0xf5d76e,
  coffee: 0x3c2415,
  tea: 0xc47a22,
  seltzer: 0xdceeff,
  hardTea: 0xc6862a,
  canSilver: 0xc0c8d0,
};

export const TYPES = {
  beer: { bottle: "beer", glass: "pint", label: 0x8b5a2b },
  cider: { bottle: "beer", glass: "pint", label: 0xc47a22 },
  wine: { bottle: "wine", glass: "wine", label: 0x5c1220 },
  spirit: { bottle: "spirit", glass: "rocks", label: 0xd4af37 },
  liqueur: { bottle: "spirit", glass: "shot", label: 0xc41e3a },
  rtd: { bottle: "can", glass: "can", label: 0x39c5bb },
  seltzer: { bottle: "can", glass: "can", label: 0x7ec8e3 },
  cocktail: { bottle: "spirit", glass: "highball", label: 0xff6b9d },
};

let _id = 1;
function d(name, type, abv, color, extra = {}) {
  const t = TYPES[type] || TYPES.spirit;
  return {
    id: `d${_id++}`,
    name,
    type,
    abv,
    color,
    bottle: extra.bottle || t.bottle,
    glass: extra.glass || t.glass,
    label: extra.label ?? t.label,
    brand: extra.brand || name,
    tags: extra.tags || [type, ...name.toLowerCase().split(/\s+/)],
  };
}

const BEERS = [
  ["Pilsner", 4.5, HEX.pils],
  ["Lager", 4.6, HEX.lager],
  ["Amber Ale", 5.2, HEX.amber],
  ["IPA", 6.8, HEX.ipa],
  ["Hazy IPA", 6.5, HEX.wheat],
  ["Stout", 5.8, HEX.stout],
  ["Irish Stout", 4.2, HEX.stout],
  ["Porter", 5.4, 0x3a1e0a],
  ["Wheat Beer", 5.0, HEX.wheat],
  ["Hefeweizen", 5.1, HEX.wheat],
  ["Pale Ale", 5.3, HEX.ipa],
  ["Brown Ale", 5.0, 0x6b3a18],
  ["Kolsch", 4.8, HEX.pils],
  ["Saison", 6.0, HEX.wheat],
  ["Pilsner Urquell", 4.4, HEX.pils],
  ["Heineken", 5.0, HEX.lager, { label: 0x1a7a3a }],
  ["Stella Artois", 5.0, HEX.pils, { label: 0xe8e8e8 }],
  ["Corona Extra", 4.6, HEX.lager, { label: 0xf2d44a }],
  ["Modelo Especial", 4.4, HEX.lager, { label: 0xc9a227 }],
  ["Pacifico", 4.5, HEX.lager, { label: 0x1c5c9a }],
  ["Dos Equis", 4.2, HEX.amber, { label: 0x8b1a1a }],
  ["Guinness", 4.2, HEX.stout, { label: 0xc9a227, glass: "pint" }],
  ["Blue Moon", 5.4, HEX.wheat, { label: 0x1a3a6b }],
  ["Bud Light", 4.2, HEX.lager, { label: 0x1c4e9a }],
  ["Budweiser", 5.0, HEX.lager, { label: 0xb01030 }],
  ["Coors Light", 4.2, HEX.pils, { label: 0xc0d8f0 }],
  ["Miller Lite", 4.2, HEX.pils, { label: 0xc41e3a }],
  ["Miller High Life", 4.6, HEX.lager, { label: 0xc9a227 }],
  ["Pabst Blue Ribbon", 4.7, HEX.lager, { label: 0x1a4a9a }],
  ["Yuengling", 4.5, HEX.amber, { label: 0x6b1c23 }],
  ["Sam Adams Boston Lager", 5.0, HEX.amber, { label: 0xb01030 }],
  ["Sierra Nevada Pale Ale", 5.6, HEX.ipa, { label: 0x2d5a27 }],
  ["Lagunitas IPA", 6.2, HEX.ipa, { label: 0xc47a22 }],
  ["Stone IPA", 6.9, HEX.ipa, { label: 0x222222 }],
  ["Newcastle Brown Ale", 4.7, 0x6b3a18],
  ["Bass Pale Ale", 5.0, HEX.amber],
  ["Hoegaarden", 4.9, HEX.wheat],
  ["Leffe Blonde", 6.6, HEX.wheat],
  ["Chimay Blue", 9.0, 0x4a2208],
  ["Rochefort 10", 11.3, 0x3a1808],
  ["Duvel", 8.5, HEX.pils],
  ["Peroni", 5.1, HEX.pils],
  ["Sapporo", 5.0, HEX.lager],
  ["Asahi Super Dry", 5.0, HEX.lager],
  ["Tsingtao", 4.7, HEX.lager],
  ["Singha", 5.0, HEX.lager],
  ["Red Stripe", 4.7, HEX.lager, { label: 0xc41e3a }],
  ["Landshark", 4.6, HEX.lager],
  ["Shiner Bock", 4.4, HEX.amber],
  ["Fat Tire", 5.2, HEX.amber],
  ["Shock Top", 5.2, HEX.wheat],
  ["Michelob Ultra", 4.2, HEX.pils],
  ["Natural Light", 4.2, HEX.lager],
  ["Keystone Light", 4.1, HEX.lager],
  ["Busch Light", 4.1, HEX.lager],
  ["Hamm's", 4.7, HEX.lager],
  ["Tecate", 4.5, HEX.lager],
  ["Victoria", 4.0, HEX.amber],
  ["Negra Modelo", 5.4, 0x3a1e0a],
  ["Bohemia", 5.0, HEX.pils],
];

const CIDERS = [
  ["Angry Orchard Crisp Apple", 5.0, HEX.wheat],
  ["Strongbow", 5.0, HEX.wheat],
  ["Woodchuck", 5.0, HEX.amber],
  ["Magners", 4.5, HEX.wheat],
  ["Rekorderlig Strawberry-Lime", 4.5, HEX.rose],
  ["Austin Eastciders", 5.0, HEX.wheat],
];

const WINES = [
  ["Cabernet Sauvignon", 13.5, HEX.redWine, { glass: "wine" }],
  ["Merlot", 13.0, HEX.redWine],
  ["Pinot Noir", 13.0, 0x7a1a32],
  ["Malbec", 13.5, 0x4a0e1c],
  ["Syrah", 14.0, 0x5c1220],
  ["Zinfandel", 14.5, 0x8b1a3a],
  ["Chianti", 13.0, HEX.redWine],
  ["Bordeaux", 13.5, HEX.redWine],
  ["Rioja", 13.5, 0x6b1224],
  ["Barolo", 14.0, 0x5a1020],
  ["Shiraz", 14.0, HEX.redWine],
  ["Chardonnay", 13.0, HEX.whiteWine, { label: 0xf4e8b0 }],
  ["Sauvignon Blanc", 12.5, 0xf7f0c8],
  ["Pinot Grigio", 12.5, 0xf3eec0],
  ["Riesling", 11.0, 0xf6e7a8],
  ["Moscato", 7.5, 0xf8e6c0],
  ["Albariño", 12.5, HEX.whiteWine],
  ["Viognier", 13.0, HEX.whiteWine],
  ["Rosé", 12.0, HEX.rose, { label: 0xe8a0b0 }],
  ["White Zinfandel", 9.5, HEX.rose],
  ["Prosecco", 11.0, HEX.champagne, { label: 0xc9a227 }],
  ["Champagne", 12.0, HEX.champagne, { label: 0xc9a227, glass: "coupe" }],
  ["Cava", 11.5, HEX.champagne],
  ["Lambrusco", 8.0, 0x8b1a3a],
  ["Port", 20.0, 0x4a0a14, { glass: "rocks" }],
  ["Sherry", 17.0, 0xc9a66b, { glass: "rocks" }],
  ["Sauternes", 14.0, 0xe8c547],
];

const SPIRITS = [
  ["Tito's Handmade Vodka", 40, HEX.vodka, { label: 0xc41e3a }],
  ["Grey Goose", 40, HEX.vodka, { label: 0xc0d0e0 }],
  ["Absolut", 40, HEX.vodka, { label: 0x1a1a1a }],
  ["Ketel One", 40, HEX.vodka],
  ["Smirnoff Vodka", 40, HEX.vodka, { label: 0xc41e3a }],
  ["Belvedere", 40, HEX.vodka],
  ["Ciroc", 40, HEX.vodka],
  ["New Amsterdam Vodka", 40, HEX.vodka],
  ["Svedka", 40, HEX.vodka],
  ["Skyy", 40, HEX.vodka, { label: 0x1c4e9a }],
  ["Stolichnaya", 40, HEX.vodka],
  ["Chopped Vodka", 40, HEX.vodka],
  ["Wheatley Vodka", 41, HEX.vodka],
  ["Tanqueray", 47.3, HEX.gin, { label: 0xc9a227 }],
  ["Bombay Sapphire", 47, HEX.gin, { label: 0x3a6ea5 }],
  ["Hendrick's Gin", 44, HEX.gin, { label: 0x5c1a3a }],
  ["Beefeater", 40, HEX.gin, { label: 0xc41e3a }],
  ["The Botanist", 46, HEX.gin],
  ["Roku Gin", 43, HEX.gin],
  ["Empress 1908", 42.5, 0x6b3fa0, { label: 0x6b3fa0 }],
  ["Aviation Gin", 42, HEX.gin],
  ["Monkey 47", 47, HEX.gin],
  ["Bacardi Superior", 40, HEX.vodka, { label: 0xc41e3a, tags: ["rum"] }],
  ["Captain Morgan Spiced Rum", 35, HEX.rum, { label: 0xc41e3a }],
  ["Malibu Coconut Rum", 21, HEX.malibu, { label: 0xf5f0e6, type: "liqueur" }],
  ["Kraken Black Rum", 40, HEX.darkRum, { label: 0x1a1a1a }],
  ["Mount Gay Eclipse", 40, HEX.rum],
  ["Appleton Estate", 40, HEX.rum],
  ["Havana Club", 40, HEX.rum],
  ["Diplomatico Reserva", 40, HEX.darkRum],
  ["Sailor Jerry", 40, HEX.rum],
  ["Myers's Dark Rum", 40, HEX.darkRum],
  ["Jack Daniel's", 40, HEX.whiskey, { label: 0x1a1a1a }],
  ["Jim Beam", 40, HEX.bourbon, { label: 0xc9a227 }],
  ["Maker's Mark", 45, HEX.bourbon, { label: 0xc41e3a }],
  ["Buffalo Trace", 45, HEX.bourbon, { label: 0xc9a227 }],
  ["Woodford Reserve", 45.2, HEX.bourbon],
  ["Knob Creek", 50, HEX.bourbon],
  ["Wild Turkey 101", 50.5, HEX.bourbon, { label: 0xc41e3a }],
  ["Evan Williams", 43, HEX.bourbon],
  ["Bulleit Bourbon", 45, HEX.bourbon, { label: 0xc9a227 }],
  ["Basil Hayden's", 40, HEX.bourbon],
  ["Angel's Envy", 43.3, HEX.bourbon],
  ["Blanton's", 46.5, HEX.bourbon],
  ["Pappy Van Winkle 15", 53.5, HEX.bourbon],
  ["Jameson", 40, HEX.whiskey, { label: 0x1a5c2a }],
  ["Bushmills", 40, HEX.whiskey],
  ["Redbreast 12", 40, HEX.whiskey],
  ["Tullamore D.E.W.", 40, HEX.whiskey],
  ["Johnnie Walker Red", 40, HEX.scotch, { label: 0xc41e3a }],
  ["Johnnie Walker Black", 40, HEX.scotch, { label: 0x1a1a1a }],
  ["Johnnie Walker Blue", 40, HEX.scotch, { label: 0x1a3a6b }],
  ["Glenfiddich 12", 40, HEX.scotch],
  ["Glenlivet 12", 40, HEX.scotch],
  ["Macallan 12", 40, HEX.scotch],
  ["Lagavulin 16", 43, HEX.scotch],
  ["Laphroaig 10", 40, HEX.scotch],
  ["Ardbeg 10", 46, HEX.scotch],
  ["Oban 14", 43, HEX.scotch],
  ["Talisker 10", 45.8, HEX.scotch],
  ["Crown Royal", 40, HEX.whiskey, { label: 0x5c1a6b }],
  ["Canadian Club", 40, HEX.whiskey],
  ["Fireball Cinnamon Whisky", 33, HEX.fireball, { label: 0xc41e3a }],
  ["Skrewball Peanut Butter Whiskey", 35, HEX.bourbon],
  ["Jack Daniel's Tennessee Honey", 35, 0xd4a017],
  ["Jack Daniel's Tennessee Fire", 35, HEX.fireball],
  ["Patrón Silver", 40, HEX.tequila, { label: 0x1a1a1a }],
  ["Patrón Reposado", 40, HEX.tequila],
  ["Casamigos Blanco", 40, HEX.tequila],
  ["Casamigos Reposado", 40, HEX.tequila],
  ["Don Julio Blanco", 40, HEX.tequila],
  ["Don Julio 1942", 38, HEX.tequila, { label: 0xc9a227 }],
  ["Clase Azul Reposado", 40, HEX.tequila, { label: 0x1c4e9a }],
  ["Espolòn Blanco", 40, HEX.tequila],
  ["Olmeca Altos", 40, HEX.tequila],
  ["Jose Cuervo Tradicional", 38, HEX.tequila, { label: 0xc41e3a }],
  ["1800 Silver", 40, HEX.tequila],
  ["Fortaleza Blanco", 40, HEX.tequila],
  ["Fortaleza Reposado", 40, HEX.tequila],
  ["Del Maguey Vida Mezcal", 42, HEX.mezcal],
  ["Montelobos Mezcal", 43, HEX.mezcal],
  ["Ilegal Mezcal Joven", 40, HEX.mezcal],
  ["Hennessy VS", 40, HEX.cognac, { label: 0xc9a227 }],
  ["Hennessy VSOP", 40, HEX.cognac],
  ["Rémy Martin VSOP", 40, HEX.cognac],
  ["Courvoisier VS", 40, HEX.cognac],
  ["Martell VS", 40, HEX.cognac],
  ["E&J Brandy", 40, HEX.brandy],
  ["Korbel Brandy", 40, HEX.brandy],
];

const LIQUEURS = [
  ["Jägermeister", 35, HEX.jager, { label: 0xc9a227, glass: "shot" }],
  ["Campari", 24, HEX.campari],
  ["Aperol", 11, HEX.aperol],
  ["Cointreau", 40, 0xf2d44a],
  ["Grand Marnier", 40, 0xc47a22],
  ["Triple Sec", 30, 0xf7e7a8],
  ["Kahlúa", 20, HEX.coffee],
  ["Baileys Irish Cream", 17, 0xf0d9b5],
  ["Amarula", 17, 0xe8d0a8],
  ["Sambuca", 38, HEX.vodka],
  ["RumChata", 13.8, 0xf5e6c8],
  ["Midori", 20, 0x6bd16a],
  ["Blue Curaçao", 24, 0x1e90ff],
  ["Chambord", 16.5, 0x5c1220],
  ["St-Germain", 20, HEX.champagne],
  ["Chartreuse Green", 55, 0x3a7a2a],
  ["Fernet-Branca", 39, 0x1a1208],
  ["Averna", 29, 0x3a1e0a],
  ["Cynar", 16.5, 0x4a3018],
  ["Aperol Spritz Bottle", 11, HEX.aperol, { bottle: "wine" }],
  ["Limoncello", 28, 0xf5d76e],
  ["Amaretto Disaronno", 28, 0xc47a22],
  ["Frangelico", 20, 0xd4a017],
  ["Southern Comfort", 35, HEX.whiskey],
  ["Drambuie", 40, HEX.scotch],
  ["Benedictine", 40, 0xd4a017],
  ["Galliano", 30, 0xf0d56a],
  ["Goldschläger", 40, 0xc9a227],
  ["Rumple Minze", 50, HEX.vodka],
  ["Peach Schnapps", 20, HEX.rose],
  ["Apple Pucker", 15, 0x8fd16a],
  ["Hypnotiq", 17, 0x3aa0c8],
];

const RTD = [
  ["Twisted Tea Original", 5.0, HEX.hardTea, { label: 0xf2d44a, bottle: "can" }],
  ["Twisted Tea Half & Half", 5.0, HEX.hardTea, { label: 0xf2d44a }],
  ["Twisted Tea Peach", 5.0, 0xe8a04a],
  ["Twisted Tea Light", 4.0, HEX.hardTea],
  ["Twisted Tea Blueberry", 5.0, 0x4a5a9a],
  ["Twisted Tea Cranberry", 5.0, HEX.cran],
  ["Twisted Tea Mango", 5.0, 0xf5a31a],
  ["Cutwater Vodka Soda Lime", 4.5, HEX.seltzer, { label: 0x1c8a7a }],
  ["Cutwater Vodka Soda Grapefruit", 4.5, HEX.rose, { label: 0xe07a6a }],
  ["Cutwater Tequila Paloma", 7.0, HEX.rose, { label: 0xc47a22 }],
  ["Cutwater Rum & Cola", 7.2, HEX.cola, { label: 0x3b2218 }],
  ["Cutwater Gin & Tonic", 7.2, HEX.tonic, { label: 0x3a7a5c }],
  ["Cutwater Fuku Tea + Vodka", 7.0, HEX.hardTea],
  ["Cutwater Horchata", 13.5, 0xf5e6c8],
  ["Cutwater Bloody Mary", 10, HEX.cran],
  ["Cutwater Lime Margarita", 10, 0x8fd16a],
  ["Cutwater Mai Tai", 10, 0xe07a3a],
  ["Cutwater Old Fashioned", 20, HEX.whiskey, { bottle: "can" }],
  ["Cutwater Whiskey Mule", 7.2, HEX.ginger],
  ["White Claw Black Cherry", 5.0, 0x8b1a3a, { label: 0x1a3a6b }],
  ["White Claw Mango", 5.0, 0xf5a31a],
  ["White Claw Lime", 5.0, 0x8fd16a],
  ["White Claw Raspberry", 5.0, HEX.rose],
  ["White Claw Watermelon", 5.0, 0xe07a7a],
  ["White Claw Pineapple", 5.0, HEX.pineapple],
  ["White Claw Natural Lime", 5.0, HEX.lime],
  ["Truly Strawberry Lemonade", 5.0, HEX.rose, { label: 0xe8a0b0 }],
  ["Truly Wild Berry", 5.0, 0x6b3fa0],
  ["Truly Lemonade", 5.0, 0xf5d76e],
  ["Truly Pineapple", 5.0, HEX.pineapple],
  ["High Noon Pineapple", 4.5, HEX.pineapple, { label: 0xf2d44a }],
  ["High Noon Watermelon", 4.5, 0xe07a7a],
  ["High Noon Black Cherry", 4.5, 0x5c1220],
  ["High Noon Grapefruit", 4.5, HEX.rose],
  ["High Noon Lime", 4.5, HEX.lime],
  ["High Noon Peach", 4.5, 0xf0a060],
  ["High Noon Passionfruit", 4.5, 0xe8c547],
  ["Vizzy Mixed Berry", 5.0, 0x6b3fa0],
  ["Vizzy Strawberry Lemon", 5.0, HEX.rose],
  ["Bud Light Seltzer", 4.5, HEX.seltzer],
  ["Topo Chico Hard Seltzer", 4.7, HEX.seltzer],
  ["Mike's Hard Lemonade", 5.0, 0xf5d76e, { label: 0x1c4e9a }],
  ["Mike's Hard Black Cherry", 5.0, 0x5c1220],
  ["Smirnoff Ice", 4.5, HEX.seltzer, { label: 0x1c4e9a, bottle: "beer" }],
  ["Smirnoff Ice Peach Bellini", 4.5, HEX.rose],
  ["Four Loko Fruit Punch", 14, HEX.cran, { label: 0xc41e3a }],
  ["Four Loko Gold", 14, HEX.champagne],
  ["Four Loko Sour Apple", 14, HEX.lime],
  ["Sun Cruiser Peach", 5, 0xf0a060],
  ["Sun Cruiser Watermelon", 5, 0xe07a7a],
  ["On the Rocks Old Fashioned", 24, HEX.whiskey, { bottle: "can" }],
  ["On the Rocks Margarita", 24, 0x8fd16a],
  ["On the Rocks Manhattan", 24, HEX.redWine],
  ["Jose Cuervo Light Margarita", 4.5, HEX.lime],
  ["1800 Ultimate Margarita", 9.5, HEX.lime],
  ["Copari Vodka Soda", 4.5, HEX.seltzer],
  ["Nutrl Vodka Soda", 4.5, HEX.seltzer],
  ["Press Premium Seltzer", 4.0, HEX.seltzer],
  ["Bon & Viv Spiked Seltzer", 4.5, HEX.seltzer],
  ["Arnold Palmer Spiked", 5.0, HEX.hardTea, { label: 0xf2d44a }],
  ["Twisted Shotgun", 12, HEX.hardTea],
  ["Cayman Jack Margarita", 6, HEX.lime],
  ["Redd's Apple Ale", 5.0, HEX.lime, { bottle: "beer" }],
  ["Twisted Shotz", 17, HEX.fireball, { bottle: "can" }],
  ["BuzzBallz Tequila 'Rita", 15, HEX.lime, { bottle: "can" }],
  ["BuzzBallz Chill 'N Pineapple", 15, HEX.pineapple],
  ["BuzzBallz Straw-Ber-Rita", 15, HEX.rose],
  ["Daily's Cocktails Margarita", 10, HEX.lime],
  ["Chi-Chi's Margarita", 10, HEX.lime],
  ["Barefoot Spritzer", 6, HEX.rose, { bottle: "can" }],
  ["Underwood Canned Pinot Noir", 13, HEX.redWine, { bottle: "can" }],
  ["Fishers Island Lemonade", 8, 0xf5d76e],
  ["Farmhouse Hard Cider", 6, HEX.wheat, { bottle: "can" }],
  ["Blue Chair Bay Rum Punch", 12.5, HEX.cran],
  ["Kinky Pink RTD", 8, HEX.rose],
  ["Svedka Blue Raspberry RTD", 4.5, 0x4a5aff],
];

const MIXERS = [
  d("Club Soda", "rtd", 0, HEX.soda, { bottle: "can", tags: ["mixer", "soda"] }),
  d("Tonic Water", "rtd", 0, HEX.tonic, { bottle: "can", tags: ["mixer", "tonic"] }),
  d("Coca-Cola", "rtd", 0, HEX.cola, { bottle: "can", tags: ["mixer", "cola"] }),
  d("Ginger Beer", "rtd", 0, HEX.ginger, { bottle: "can", tags: ["mixer"] }),
  d("Ginger Ale", "rtd", 0, HEX.ginger, { bottle: "can", tags: ["mixer"] }),
  d("Cranberry Juice", "rtd", 0, HEX.cran, { tags: ["mixer"] }),
  d("Orange Juice", "rtd", 0, HEX.oj, { tags: ["mixer"] }),
  d("Pineapple Juice", "rtd", 0, HEX.pineapple, { tags: ["mixer"] }),
  d("Lime Juice", "rtd", 0, HEX.lime, { tags: ["mixer"] }),
  d("Grapefruit Juice", "rtd", 0, HEX.rose, { tags: ["mixer"] }),
  d("Tomato Juice", "rtd", 0, 0xb01030, { tags: ["mixer"] }),
  d("Red Bull", "rtd", 0, 0x1e90ff, { bottle: "can", tags: ["mixer", "energy"] }),
  d("Espresso Shot", "rtd", 0, HEX.coffee, { bottle: "spirit", tags: ["mixer"] }),
  d("Simple Syrup", "liqueur", 0, HEX.soda, { tags: ["mixer"] }),
  d("Sweet & Sour", "rtd", 0, 0xf5d76e, { tags: ["mixer"] }),
  d("Grenadine", "liqueur", 0, HEX.cran, { tags: ["mixer"] }),
  d("Bitters", "liqueur", 35, 0x4a2208, { glass: "shot", tags: ["mixer"] }),
  d("Vermouth Rosso", "liqueur", 15, HEX.vermouth, { tags: ["mixer"] }),
  d("Dry Vermouth", "liqueur", 18, HEX.whiteWine, { tags: ["mixer"] }),
];

const COCKTAILS = [
  d("Old Fashioned", "cocktail", 32, HEX.whiskey, { glass: "rocks" }),
  d("Margarita", "cocktail", 22, HEX.lime, { glass: "coupe" }),
  d("Mojito", "cocktail", 13, HEX.lime, { glass: "highball" }),
  d("Negroni", "cocktail", 24, HEX.campari, { glass: "rocks" }),
  d("Moscow Mule", "cocktail", 12, HEX.lime, { glass: "highball" }),
  d("Espresso Martini", "cocktail", 18, HEX.coffee, { glass: "coupe" }),
  d("Whiskey Sour", "cocktail", 20, HEX.whiskey, { glass: "rocks" }),
  d("Gin & Tonic", "cocktail", 12, HEX.tonic, { glass: "highball" }),
  d("Rum & Coke", "cocktail", 12, HEX.cola, { glass: "highball" }),
  d("Vodka Soda", "cocktail", 12, HEX.seltzer, { glass: "highball" }),
  d("Vodka Red Bull", "cocktail", 12, 0x1e90ff, { glass: "highball" }),
  d("Paloma", "cocktail", 12, HEX.rose, { glass: "highball" }),
  d("Aperol Spritz", "cocktail", 8, HEX.aperol, { glass: "wine" }),
  d("Manhattan", "cocktail", 30, HEX.redWine, { glass: "coupe" }),
  d("Martini", "cocktail", 32, HEX.vodka, { glass: "coupe" }),
  d("Dirty Martini", "cocktail", 32, HEX.gin, { glass: "coupe" }),
  d("Bloody Mary", "cocktail", 12, 0xb01030, { glass: "highball" }),
  d("Piña Colada", "cocktail", 13, HEX.pineapple, { glass: "highball" }),
  d("Daiquiri", "cocktail", 20, HEX.lime, { glass: "coupe" }),
  d("Cosmopolitan", "cocktail", 20, HEX.cran, { glass: "coupe" }),
  d("Long Island Iced Tea", "cocktail", 22, HEX.cola, { glass: "highball" }),
  d("Tequila Sunrise", "cocktail", 14, 0xf5a31a, { glass: "highball" }),
  d("French 75", "cocktail", 16, HEX.champagne, { glass: "coupe" }),
  d("Paper Plane", "cocktail", 24, HEX.aperol, { glass: "coupe" }),
  d("Penicillin", "cocktail", 24, HEX.scotch, { glass: "rocks" }),
  d("Mai Tai", "cocktail", 22, 0xe07a3a, { glass: "rocks" }),
  d("Dark 'n' Stormy", "cocktail", 14, HEX.ginger, { glass: "highball" }),
  d("Tom Collins", "cocktail", 12, HEX.lime, { glass: "highball" }),
  d("Sazerac", "cocktail", 32, HEX.whiskey, { glass: "rocks" }),
  d("Boulevardier", "cocktail", 26, HEX.campari, { glass: "rocks" }),
  d("Amaretto Sour", "cocktail", 16, 0xd4a017, { glass: "rocks" }),
  d("Irish Coffee", "cocktail", 12, HEX.coffee, { glass: "wine" }),
  d("Hot Toddy", "cocktail", 12, HEX.whiskey, { glass: "wine" }),
  d("Sangria", "cocktail", 10, HEX.redWine, { glass: "wine" }),
  d("Mimosa", "cocktail", 8, HEX.oj, { glass: "coupe" }),
  d("Bellini", "cocktail", 8, HEX.rose, { glass: "coupe" }),
  d("Kir Royale", "cocktail", 10, 0x6b1c23, { glass: "coupe" }),
  d("White Russian", "cocktail", 18, 0xf0d9b5, { glass: "rocks" }),
  d("Black Russian", "cocktail", 28, HEX.coffee, { glass: "rocks" }),
  d("Godfather", "cocktail", 32, HEX.whiskey, { glass: "rocks" }),
  d("Rusty Nail", "cocktail", 32, HEX.scotch, { glass: "rocks" }),
  d("Sidecar", "cocktail", 24, 0xe8c547, { glass: "coupe" }),
  d("Last Word", "cocktail", 24, HEX.lime, { glass: "coupe" }),
  d("Corpse Reviver #2", "cocktail", 22, HEX.gin, { glass: "coupe" }),
  d("Vesper", "cocktail", 32, HEX.gin, { glass: "coupe" }),
  d("Paloma Ranch Water", "cocktail", 12, HEX.seltzer, { glass: "highball" }),
  d("Ranch Water", "cocktail", 12, HEX.seltzer, { glass: "highball" }),
  d("Whiskey Ginger", "cocktail", 14, HEX.ginger, { glass: "highball" }),
  d("Jack & Coke", "cocktail", 12, HEX.cola, { glass: "highball" }),
  d("Cuba Libre", "cocktail", 12, HEX.cola, { glass: "highball" }),
  d("Screwdriver", "cocktail", 12, HEX.oj, { glass: "highball" }),
  d("Cape Codder", "cocktail", 12, HEX.cran, { glass: "highball" }),
  d("Sea Breeze", "cocktail", 12, HEX.cran, { glass: "highball" }),
  d("Bay Breeze", "cocktail", 12, HEX.cran, { glass: "highball" }),
  d("Greyhound", "cocktail", 12, HEX.rose, { glass: "highball" }),
  d("Salty Dog", "cocktail", 12, HEX.rose, { glass: "highball" }),
  d("Tequila Shot", "cocktail", 40, HEX.tequila, { glass: "shot" }),
  d("Whiskey Shot", "cocktail", 40, HEX.whiskey, { glass: "shot" }),
  d("Vodka Shot", "cocktail", 40, HEX.vodka, { glass: "shot" }),
  d("Jägerbomb", "cocktail", 18, HEX.jager, { glass: "highball" }),
  d("Pickleback", "cocktail", 40, HEX.whiskey, { glass: "shot" }),
];

function pack(rows, type) {
  return rows.map((r) => {
    const [name, abv, color, extra = {}] = r;
    const t = extra.type || type;
    return d(name, t, abv, color, extra);
  });
}

export const CATALOG = [
  ...pack(BEERS, "beer"),
  ...pack(CIDERS, "cider"),
  ...pack(WINES, "wine"),
  ...pack(SPIRITS, "spirit"),
  ...pack(LIQUEURS, "liqueur"),
  ...pack(RTD, "rtd"),
  ...MIXERS,
  ...COCKTAILS,
];

const SPIRIT_NAMES = [
  "Vodka", "Gin", "Rum", "Spiced Rum", "Dark Rum", "Whiskey", "Bourbon",
  "Scotch", "Rye", "Tequila", "Mezcal", "Brandy", "Cognac", "Moonshine",
];
const MIXER_NAMES = [
  "Soda", "Tonic", "Coke", "Diet Coke", "Ginger Beer", "Ginger Ale",
  "Cranberry", "OJ", "Pineapple", "Grapefruit", "Lime", "Energy Drink",
  "Iced Tea", "Lemonade", "Water", "Soda Water", "Coconut Water",
  "Mango Juice", "Peach Nectar", "Red Bull",
];
const RTD_BRANDS = [
  "Twisted Tea", "Cutwater", "White Claw", "High Noon", "Truly", "Vizzy",
  "Mike's Hard", "Smirnoff Ice", "Sun Cruiser", "Nutrl", "Press",
  "Topo Chico Hard", "On the Rocks", "BuzzBallz", "Four Loko",
];
const RTD_FLAVORS = [
  "Original", "Peach", "Mango", "Watermelon", "Black Cherry", "Lime",
  "Grapefruit", "Pineapple", "Berry", "Lemonade", "Half & Half",
  "Blueberry", "Strawberry", "Passionfruit", "Cucumber", "Blood Orange",
  "Tangerine", "Guava", "Dragonfruit", "Coconut", "Habanero", "Tea + Lemon",
];
const WINE_REGIONS = [
  "Napa", "Sonoma", "Willamette", "Bordeaux", "Burgundy", "Tuscany",
  "Mendoza", "Rioja", "Mosel", "Marlborough", "Barossa", "Paso Robles",
];
const HOUSE_ADJ = [
  "House", "Bartender's", "Well", "Top-shelf", "Dusty", "Secret",
  "Shift-drink", "Last-call", "Neon", "Back-bar", "Well-pour", "Private",
];

const COLOR_FROM = [
  ["vodka", HEX.vodka], ["gin", HEX.gin], ["rum", HEX.rum], ["whiskey", HEX.whiskey],
  ["bourbon", HEX.bourbon], ["scotch", HEX.scotch], ["tequila", HEX.tequila],
  ["mezcal", HEX.mezcal], ["wine", HEX.redWine], ["red", HEX.redWine],
  ["white", HEX.whiteWine], ["rosé", HEX.rose], ["rose", HEX.rose],
  ["beer", HEX.lager], ["ipa", HEX.ipa], ["stout", HEX.stout],
  ["tea", HEX.hardTea], ["cola", HEX.cola], ["coffee", HEX.coffee],
  ["lime", HEX.lime], ["mango", HEX.oj], ["peach", 0xf0a060],
  ["cherry", HEX.cran], ["berry", 0x6b3fa0], ["pineapple", HEX.pineapple],
  ["grapefruit", HEX.rose], ["orange", HEX.oj], ["cinnamon", HEX.fireball],
  ["coconut", HEX.malibu], ["espresso", HEX.coffee],
];

function colorForName(name) {
  const n = name.toLowerCase();
  for (const [k, c] of COLOR_FROM) if (n.includes(k)) return c;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 33 + n.charCodeAt(i)) >>> 0;
  return (h & 0xffffff) | 0x202020;
}

function typeForName(name) {
  const n = name.toLowerCase();
  if (/(claw|high noon|truly|twisted tea|cutwater|seltzer|buzzball|four loko|mike's|smirnoff ice)/.test(n)) return "rtd";
  if (/(ipa|lager|stout|pils|ale|porter|beer|hefe)/.test(n)) return "beer";
  if (/(cabernet|merlot|pinot|chardonnay|prosecco|champagne|wine|rosé|rose|riesling)/.test(n)) return "wine";
  if (/(margarita|mule|spritz|martini|sour|colada|mojito|negroni|old fashioned|paloma)/.test(n)) return "cocktail";
  if (/(cider)/.test(n)) return "cider";
  if (/(cream|schnapps|liqueur|baileys|kahlua|aperol|campari|jäger|jager)/.test(n)) return "liqueur";
  return "spirit";
}

function abvForType(type, name) {
  const n = name.toLowerCase();
  if (type === "beer" || type === "cider" || type === "seltzer") return 5;
  if (type === "rtd") return n.includes("cutwater") && /(margarita|old fashioned|horchata)/.test(n) ? 12 : 5;
  if (type === "wine") return 13;
  if (type === "cocktail") return 18;
  if (type === "liqueur") return 22;
  return 40;
}

const GENERATED = [];

function generateEndless(count = 400) {
  const out = [];
  for (const s of SPIRIT_NAMES) {
    for (const m of MIXER_NAMES) {
      out.push(d(`${s} + ${m}`, "cocktail", 14, colorForName(`${s} ${m}`), {
        glass: "highball",
        tags: [s.toLowerCase(), m.toLowerCase(), "highball", "mixed"],
      }));
    }
  }
  for (const b of RTD_BRANDS) {
    for (const f of RTD_FLAVORS) {
      out.push(d(`${b} ${f}`, "rtd", 5, colorForName(f), {
        bottle: "can",
        tags: [b.toLowerCase(), f.toLowerCase(), "rtd"],
      }));
    }
  }
  for (const r of WINE_REGIONS) {
    out.push(d(`${r} Cabernet`, "wine", 13.5, HEX.redWine));
    out.push(d(`${r} Chardonnay`, "wine", 13, HEX.whiteWine));
    out.push(d(`${r} Pinot Noir`, "wine", 13, 0x7a1a32));
    out.push(d(`${r} Rosé`, "wine", 12, HEX.rose));
  }
  for (const a of HOUSE_ADJ) {
    for (const s of SPIRIT_NAMES) {
      out.push(d(`${a} ${s}`, "spirit", 40, colorForName(s), { tags: ["house", s.toLowerCase()] }));
    }
  }
  GENERATED.push(...out.slice(0, count));
  return GENERATED;
}

generateEndless(500);

export const ALL = [...CATALOG, ...GENERATED];

const byName = new Map();
for (const drink of ALL) {
  const key = drink.name.toLowerCase();
  if (!byName.has(key)) byName.set(key, drink);
}

export const CATEGORIES = [
  { id: "all", label: "ALL", test: () => true },
  { id: "beer", label: "BEER", test: (d) => d.type === "beer" || d.type === "cider" },
  { id: "wine", label: "WINE", test: (d) => d.type === "wine" },
  { id: "spirits", label: "SPIRITS", test: (d) => d.type === "spirit" },
  { id: "liqueur", label: "LIQUEUR", test: (d) => d.type === "liqueur" },
  { id: "cocktail", label: "MIXED", test: (d) => d.type === "cocktail" },
  { id: "rtd", label: "CANS", test: (d) => d.type === "rtd" || d.type === "seltzer" || d.bottle === "can" },
  { id: "tea", label: "TEA", test: (d) => /tea|arnold palmer/.test((d.name || "").toLowerCase()) },
  { id: "mixer", label: "MIXERS", test: (d) => (d.tags || []).includes("mixer") || d.abv === 0 },
];

export function findDrinks(query, limit = 24, category = "all") {
  const q = (query || "").trim().toLowerCase();
  const cat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const inCat = (d) => category === "all" || cat.test(d);
  if (!q) {
    const pool = CATALOG.filter(inCat);
    return (pool.length ? pool : ALL.filter(inCat)).slice(0, limit);
  }
  const scored = [];
  for (const drink of ALL) {
    if (!inCat(drink)) continue;
    const n = drink.name.toLowerCase();
    if (n === q) scored.push([0, drink]);
    else if (n.startsWith(q)) scored.push([1, drink]);
    else if (n.includes(q)) scored.push([2, drink]);
    else if ((drink.tags || []).some((t) => t.includes(q))) scored.push([3, drink]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  const hits = scored.slice(0, limit).map((row) => row[1]);
  if (hits.length) return hits;
  if (category !== "all") return [];
  return [spawnCustom(query)];
}

export function spawnCustom(name) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return CATALOG[0];
  const key = trimmed.toLowerCase();
  if (byName.has(key)) return byName.get(key);
  const type = typeForName(trimmed);
  const drink = d(trimmed, type, abvForType(type, trimmed), colorForName(trimmed), {
    tags: ["custom", ...trimmed.toLowerCase().split(/\s+/)],
  });
  ALL.push(drink);
  byName.set(key, drink);
  return drink;
}

export function randomDrink(filter) {
  const pool = filter ? ALL.filter(filter) : CATALOG;
  return pool[(Math.random() * pool.length) | 0];
}

export const RECIPES = [
  { name: "Gin & Tonic", need: ["gin", "tonic"] },
  { name: "Rum & Coke", need: ["rum", "cola"] },
  { name: "Vodka Soda", need: ["vodka", "soda"] },
  { name: "Vodka Red Bull", need: ["vodka", "red bull"] },
  { name: "Whiskey Ginger", need: ["whiskey", "ginger"] },
  { name: "Jack & Coke", need: ["jack", "cola"] },
  { name: "Screwdriver", need: ["vodka", "orange"] },
  { name: "Cape Codder", need: ["vodka", "cranberry"] },
  { name: "Ranch Water", need: ["tequila", "soda"] },
  { name: "Paloma", need: ["tequila", "grapefruit"] },
  { name: "Moscow Mule", need: ["vodka", "ginger"] },
  { name: "Dark 'n' Stormy", need: ["rum", "ginger"] },
  { name: "Aperol Spritz", need: ["aperol", "prosecco"] },
  { name: "Mimosa", need: ["champagne", "orange"] },
  { name: "White Russian", need: ["vodka", "kahl"] },
  { name: "Espresso Martini", need: ["vodka", "espresso"] },
  { name: "Old Fashioned", need: ["bourbon", "bitters"] },
  { name: "Manhattan", need: ["whiskey", "vermouth"] },
  { name: "Negroni", need: ["gin", "campari"] },
  { name: "Margarita", need: ["tequila", "lime"] },
  { name: "Cuba Libre", need: ["rum", "cola"] },
  { name: "Tequila Sunrise", need: ["tequila", "orange"] },
  { name: "Irish Coffee", need: ["jameson", "espresso"] },
  { name: "Long Island Iced Tea", need: ["vodka", "gin", "rum", "tequila"] },
];

export function nameMix(parts) {
  if (parts.length === 1) return parts[0].name;
  const blob = parts.map((p) => p.name.toLowerCase()).join(" | ");
  for (const r of RECIPES) {
    if (r.need.every((n) => blob.includes(n))) return r.name;
  }
  return parts.map((p) => p.name).join(" + ");
}

export function mixColor(parts) {
  if (!parts.length) return 0xffffff;
  let r = 0, g = 0, b = 0, t = 0;
  for (const p of parts) {
    const a = Math.max(0.15, p.amount || 1);
    r += ((p.color >> 16) & 255) * a;
    g += ((p.color >> 8) & 255) * a;
    b += (p.color & 255) * a;
    t += a;
  }
  r = Math.min(255, r / t) | 0;
  g = Math.min(255, g / t) | 0;
  b = Math.min(255, b / t) | 0;
  return (r << 16) | (g << 8) | b;
}

export function mixAbv(parts) {
  if (!parts.length) return 0;
  let alcohol = 0, vol = 0;
  for (const p of parts) {
    const a = p.amount || 1;
    alcohol += (p.abv / 100) * a;
    vol += a;
  }
  return vol ? (alcohol / vol) * 100 : 0;
}

export const GLASS_TYPES = ["pint", "wine", "rocks", "shot", "highball", "coupe", "can"];

export const DARES = [
  { text: "Pour yourself a whiskey. Neat is fine. Pretending is not.", test: (g) => has(g, "whiskey") || has(g, "bourbon") || has(g, "scotch") },
  { text: "Grab a Twisted Tea. Any flavor. The porch is imaginary.", test: (g) => has(g, "twisted tea") },
  { text: "Cutwater run. Paloma, vodka soda, or anything with Cutwater on the can.", test: (g) => has(g, "cutwater") },
  { text: "Wine o'clock. Red, white, bubbles — bartender's choice.", test: (g) => typeIs(g, "wine") || has(g, "prosecco") || has(g, "champagne") },
  { text: "Beer break. Pint it.", test: (g) => typeIs(g, "beer") },
  { text: "Vodka. Straight or mixed. You know what you are.", test: (g) => has(g, "vodka") },
  { text: "Tequila moment. Shot glass optional, consequences are not.", test: (g) => has(g, "tequila") || has(g, "mezcal") },
  { text: "Build a highball: spirit + mixer in the same glass.", test: (g) => (g.parts?.length || 0) >= 2 },
  { text: "Seltzer era. White Claw, High Noon, Truly, Vizzy — pick a can.", test: (g) => has(g, "claw") || has(g, "high noon") || has(g, "truly") || has(g, "vizzy") || typeIs(g, "seltzer") },
  { text: "Gin & tonic. You have both. Mix them.", test: (g) => has(g, "gin") && (has(g, "tonic") || /gin & tonic/i.test(g.name || "")) },
  { text: "Something 40% or higher. This is a dare, not a spritz.", test: (g) => (g.abv || 0) >= 38 },
  { text: "Rum. Dark, spiced, coconut — pirate rules apply.", test: (g) => has(g, "rum") || has(g, "malibu") },
  { text: "A ready-to-drink can. Pop it like you stocked it.", test: (g) => typeIs(g, "rtd") || g.bottle === "can" },
  { text: "Champagne or prosecco. Toast yourself. No one else showed up.", test: (g) => has(g, "champagne") || has(g, "prosecco") || has(g, "cava") },
  { text: "Jägermeister or Fireball. Character-building.", test: (g) => has(g, "jäger") || has(g, "jager") || has(g, "fireball") },
  { text: "Mix three things in one glass. House special. Name it later.", test: (g) => (g.parts?.length || 0) >= 3 },
  { text: "IPA or stout. Hoppy or dark. No lagers hiding.", test: (g) => has(g, "ipa") || has(g, "stout") || has(g, "porter") },
  { text: "Margarita energy. Tequila + lime, or a canned 'rita.", test: (g) => has(g, "margarita") || (has(g, "tequila") && has(g, "lime")) },
  { text: "Coffee in it. Espresso martini, Irish coffee, Kahlúa — caffeinate the shift.", test: (g) => has(g, "espresso") || has(g, "coffee") || has(g, "kahl") },
  { text: "A wine you can't pronounce. Or Barolo. Same vibe.", test: (g) => typeIs(g, "wine") },
  { text: "Chug whatever is in the glass. Empty it. That's the game.", test: (g) => (g.fill || 0) <= 0.02, chug: true },
  { text: "Hennessy or any cognac. VS is fine. The bottle is watching.", test: (g) => has(g, "hennessy") || has(g, "cognac") || has(g, "rémy") || has(g, "remy") },
  { text: "Mule. Copper mug not included. Ginger beer is.", test: (g) => has(g, "mule") || (has(g, "ginger") && (has(g, "vodka") || has(g, "whiskey") || has(g, "rum"))) },
  { text: "Anything peach. Twisted Tea Peach counts. You know it does.", test: (g) => has(g, "peach") },
  { text: "A shot. Glass on the rail. Down it.", test: (g) => g.glass === "shot" || (g.abv || 0) >= 35 },
];

function blob(g) {
  const parts = (g.parts || []).map((p) => p.name).join(" ");
  return `${g.name || ""} ${parts}`.toLowerCase();
}
function has(g, s) {
  return blob(g).includes(s.toLowerCase());
}
function typeIs(g, t) {
  if (g.type === t) return true;
  return (g.parts || []).some((p) => p.type === t);
}
