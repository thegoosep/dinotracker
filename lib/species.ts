export interface Species {
  id: string;
  name: string;
  icon: string;
  blueprint: string;
  baseHp?: number;
}

// Base HP for wild stat calculation: HP = baseHp * (1 + 0.2 * points)
// Melee is universal: 100% + (points * 5%)
const BASE_HP: Record<string, number> = {
  Rex: 1100, Gigant: 80000, Therizino: 870, Spino: 700, Yutyrannus: 1025,
  Megatherium: 750, Rhino: 750, Daeodon: 900, Carno: 420, Allosaurus: 650,
  Turtle: 1100, Paracer: 1140, Stego: 870, GasBags: 1600, Trike: 525, Diplodocus: 2400,
  Ptero: 210, Argent: 365, Quetz: 1200, Tapejara: 260, Tropeognathus: 425,
  Pela: 240, Griffin: 1125, Owl: 1200, IceJumper: 750, Spindles: 350, Gacha: 2200,
  RockDrake: 1950, LionfishLion: 1500, BogSpider: 600, Cherufe: 3000,
  MilkGlider: 400, SpaceWhale: 8000, Mantis: 800, Desmodus: 450,
  BionicStego: 870, BionicTrike: 525, BionicQuetz: 1200, BionicRex: 1100,
  Ankylo: 700, Doedicurus: 850, Mammoth: 850, Beaver: 475, Thyla: 750,
  Baryonyx: 440, Basilo: 2400, Mosa: 4500, Tuso: 3400, Dunkleosteus: 1600,
};

export function getBaseHp(speciesId: string): number | undefined {
  return BASE_HP[speciesId];
}

export function calcWildHp(speciesId: string, points: number): number | undefined {
  const base = BASE_HP[speciesId];
  if (!base) return undefined;
  return Math.round(base * (1 + 0.2 * points));
}

export function calcWildMelee(points: number): number {
  return 100 + points * 5;
}

export const ALL_SPECIES: Species[] = [
  // --- Combat / Boss ---
  { id: 'Rex', name: 'Rex', icon: 'rex.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Rex/Rex_Character_BP.Rex_Character_BP'" },
  { id: 'Gigant', name: 'Giganotosaurus', icon: 'giganotosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Giganotosaurus/Gigant_Character_BP.Gigant_Character_BP'" },
  { id: 'Therizino', name: 'Therizinosaurus', icon: 'therizinosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Therizinosaurus/Therizino_Character_BP.Therizino_Character_BP'" },
  { id: 'Spino', name: 'Spinosaurus', icon: 'spino.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Spino/Spino_Character_BP.Spino_Character_BP'" },
  { id: 'Yutyrannus', name: 'Yutyrannus', icon: 'yutyrannus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Yutyrannus/Yutyrannus_Character_BP.Yutyrannus_Character_BP'" },
  { id: 'Megatherium', name: 'Megatherium', icon: 'megatherium.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Megatherium/Megatherium_Character_BP.Megatherium_Character_BP'" },
  { id: 'Rhino', name: 'Woolly Rhino', icon: 'woollyrhino.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/WoollyRhino/Rhino_Character_BP.Rhino_Character_BP'" },
  { id: 'Daeodon', name: 'Daeodon', icon: 'daeodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Daeodon/Daeodon_Character_BP.Daeodon_Character_BP'" },
  { id: 'Carcha', name: 'Carcharodontosaurus', icon: '', blueprint: '' },
  { id: 'Carno', name: 'Carnotaurus', icon: 'carno.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Carno/Carno_Character_BP.Carno_Character_BP'" },
  { id: 'Allosaurus', name: 'Allosaurus', icon: 'allosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Allosaurus/Allo_Character_BP.Allo_Character_BP'" },
  // --- Soaking / Tanks ---
  { id: 'Turtle', name: 'Carbonemys', icon: 'turtle.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Turtle/Turtle_Character_BP.Turtle_Character_BP'" },
  { id: 'Paracer', name: 'Paraceratherium', icon: 'paraceratherium.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Paraceratherium/Paracer_Character_BP.Paracer_Character_BP'" },
  { id: 'Stego', name: 'Stegosaurus', icon: 'stego.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Stego/Stego_Character_BP.Stego_Character_BP'" },
  { id: 'GasBags', name: 'Gasbags', icon: 'gasbag.png', blueprint: "Blueprint'/Game/Extinction/Dinos/GasBag/GasBags_Character_BP.GasBags_Character_BP'" },
  { id: 'Trike', name: 'Triceratops', icon: 'trike.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Trike/Trike_Character_BP.Trike_Character_BP'" },
  { id: 'Diplodocus', name: 'Diplodocus', icon: 'diplodocus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Diplodocus/Diplodocus_Character_BP.Diplodocus_Character_BP'" },
  // --- Flyers ---
  { id: 'Ptero', name: 'Pteranodon', icon: 'pt.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Ptero/Ptero_Character_BP.Ptero_Character_BP'" },
  { id: 'Argent', name: 'Argentavis', icon: 'argentavis.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Argentavis/Argent_Character_BP.Argent_Character_BP'" },
  { id: 'Quetz', name: 'Quetzal', icon: 'quetzal.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Quetzalcoatlus/Quetz_Character_BP.Quetz_Character_BP'" },
  { id: 'Tapejara', name: 'Tapejara', icon: 'tapejara.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Tapejara/Tapejara_Character_BP.Tapejara_Character_BP'" },
  { id: 'Tropeognathus', name: 'Tropeognathus', icon: 'tropeognathus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Tropeognathus/Tropeognathus_Character_BP.Tropeognathus_Character_BP'" },
  { id: 'Pela', name: 'Pelagornis', icon: 'pelagornis.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Pelagornis/Pela_Character_BP.Pela_Character_BP'" },
  { id: 'Griffin', name: 'Griffin', icon: 'griffin.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Griffin/Griffin_Character_BP.Griffin_Character_BP'" },
  { id: 'Archaeopteryx', name: 'Archaeopteryx', icon: 'archaeopteryx.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Archaeopteryx/Archa_Character_BP.Archa_Character_BP'" },
  { id: 'Dimorphodon', name: 'Dimorphodon', icon: 'dimorphodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dimorphodon/Dimorph_Character_BP.Dimorph_Character_BP'" },
  { id: 'Ichthyornis', name: 'Ichthyornis', icon: 'ichthyornis.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Ichthyornis/Ichthyornis_Character_BP.Ichthyornis_Character_BP'" },
  // --- Extinction ---
  { id: 'Owl', name: 'Snow Owl', icon: 'owl.png', blueprint: "Blueprint'/Game/Extinction/Dinos/Owl/Owl_Character_BP.Owl_Character_BP'" },
  { id: 'IceJumper', name: 'Managarmr', icon: 'managarmr.png', blueprint: "Blueprint'/Game/Extinction/Dinos/IceJumper/IceJumper_Character_BP.IceJumper_Character_BP'" },
  { id: 'Spindles', name: 'Velonasaur', icon: 'velo.png', blueprint: "Blueprint'/Game/Extinction/Dinos/Spindles/Spindles_Character_BP.Spindles_Character_BP'" },
  { id: 'Gacha', name: 'Gacha', icon: 'gacha.png', blueprint: "Blueprint'/Game/Extinction/Dinos/Gacha/Gacha_Character_BP.Gacha_Character_BP'" },
  // --- Aberration / Genesis ---
  { id: 'RockDrake', name: 'Rock Drake', icon: 'rock_drake.png', blueprint: "Blueprint'/Game/Aberration/Dinos/RockDrake/RockDrake_Character_BP.RockDrake_Character_BP'" },
  { id: 'LionfishLion', name: 'Shadowmane', icon: 'shadowmane.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/LionfishLion/LionfishLion_Character_BP.LionfishLion_Character_BP'" },
  { id: 'BogSpider', name: 'Bloodstalker', icon: 'bloodstalker.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BogSpider/BogSpider_Character_BP.BogSpider_Character_BP'" },
  { id: 'Cherufe', name: 'Magmasaur', icon: 'magmasaur.png', blueprint: "Blueprint'/Game/Genesis/Dinos/Cherufe/Cherufe_Character_BP.Cherufe_Character_BP'" },
  { id: 'MilkGlider', name: 'Maewing', icon: 'maewing.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/MilkGlider/MilkGlider_Character_BP.MilkGlider_Character_BP'" },
  { id: 'SpaceWhale', name: 'Astrocetus', icon: 'astrocetus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/SpaceWhale/SpaceWhale_Character_BP.SpaceWhale_Character_BP'" },
  { id: 'CaveWolf', name: 'Ravager', icon: 'ravager.png', blueprint: "Blueprint'/Game/Aberration/Dinos/CaveWolf/CaveWolf_Character_BP.CaveWolf_Character_BP'" },
  { id: 'Basilisk', name: 'Basilisk', icon: 'basilisk.png', blueprint: "Blueprint'/Game/Aberration/Dinos/Basilisk/Basilisk_Character_BP.Basilisk_Character_BP'" },
  { id: 'Karkinos', name: 'Karkinos', icon: 'karkinos.png', blueprint: "Blueprint'/Game/Aberration/Dinos/Crab/Crab_Character_BP.Crab_Character_BP'" },
  { id: 'Noglin', name: 'Noglin', icon: 'noglin.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BrainSlug/BrainSlug_Character_BP.BrainSlug_Character_BP'" },
  { id: 'Ferox', name: 'Ferox', icon: 'ferox.png', blueprint: "Blueprint'/Game/Genesis/Dinos/Shapeshifter/Shapeshifter_Small/Shapeshifter_Small_Character_BP.Shapeshifter_Small_Character_BP'" },
  { id: 'Megachelon', name: 'Megachelon', icon: 'megachelon.png', blueprint: "Blueprint'/Game/Genesis/Dinos/GiantTurtle/GiantTurtle_Character_BP.GiantTurtle_Character_BP'" },
  { id: 'SpaceDolphin', name: 'Astrodelphis', icon: 'astrodelphis.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/SpaceDolphin/SpaceDolphin_Character_BP.SpaceDolphin_Character_BP'" },
  { id: 'Strider', name: 'Tek Strider', icon: 'strider.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/TekStrider/TekStrider_Character_BP.TekStrider_Character_BP'" },
  { id: 'RollRat', name: 'Roll Rat', icon: 'roll_rat.png', blueprint: "Blueprint'/Game/Aberration/Dinos/MoleRat/MoleRat_Character_BP.MoleRat_Character_BP'" },
  // --- Water ---
  { id: 'Tusoteuthis', name: 'Tusoteuthis', icon: 'tusoteuthis.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Tusoteuthis/Tusoteuthis_Character_BP.Tusoteuthis_Character_BP'" },
  { id: 'Basilosaurus', name: 'Basilosaurus', icon: 'basilosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Basilosaurus/Basilosaurus_Character_BP.Basilosaurus_Character_BP'" },
  { id: 'Mosa', name: 'Mosasaurus', icon: 'mosasaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Mosasaurus/Mosa_Character_BP.Mosa_Character_BP'" },
  { id: 'Plesiosaur', name: 'Plesiosaur', icon: 'plesiosaur.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Plesiosaur/Plesiosaur_Character_BP.Plesiosaur_Character_BP'" },
  { id: 'Megalodon', name: 'Megalodon', icon: 'megalodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Megalodon/Megalodon_Character_BP.Megalodon_Character_BP'" },
  { id: 'Dunkleosteus', name: 'Dunkleosteus', icon: 'dunkleosteus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dunkleosteus/Dunkle_Character_BP.Dunkle_Character_BP'" },
  { id: 'Ichthyosaurus', name: 'Ichthyosaurus', icon: 'ichthyosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dolphin/Dolphin_Character_BP.Dolphin_Character_BP'" },
  { id: 'Anglerfish', name: 'Anglerfish', icon: 'anglerfish.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Anglerfish/Angler_Character_BP.Angler_Character_BP'" },
  { id: 'Manta', name: 'Manta', icon: 'manta.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Manta/Manta_Character_BP.Manta_Character_BP'" },
  { id: 'Eel', name: 'Electrophorus', icon: 'eel.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Eel/Eel_Character_BP.Eel_Character_BP'" },
  { id: 'Liopleurodon', name: 'Liopleurodon', icon: 'liopleurodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Liopleurodon/Liopleurodon_Character_BP.Liopleurodon_Character_BP'" },
  // --- Farming / Utility ---
  { id: 'Ankylo', name: 'Ankylosaurus', icon: 'ankylo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Ankylo/Ankylo_Character_BP.Ankylo_Character_BP'" },
  { id: 'Doed', name: 'Doedicurus', icon: 'doedicurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Doedicurus/Doed_Character_BP.Doed_Character_BP'" },
  { id: 'Mammoth', name: 'Mammoth', icon: 'mammoth.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Mammoth/Mammoth_Character_BP.Mammoth_Character_BP'" },
  { id: 'Mantis', name: 'Mantis', icon: 'mantis.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Mantis/Mantis_Character_BP.Mantis_Character_BP'" },
  { id: 'Beaver', name: 'Castoroides', icon: 'beaver.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Beaver/Beaver_Character_BP.Beaver_Character_BP'" },
  { id: 'Moschops', name: 'Moschops', icon: 'moschops.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Moschops/Moschops_Character_BP.Moschops_Character_BP'" },
  { id: 'DungBeetle', name: 'Dung Beetle', icon: 'dung_beetle.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/DungBeetle/DungBeetle_Character_BP.DungBeetle_Character_BP'" },
  { id: 'Achatina', name: 'Achatina', icon: 'achatina.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Achatina/Achatina_Character_BP.Achatina_Character_BP'" },
  { id: 'Oviraptor', name: 'Oviraptor', icon: 'oviraptor.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Oviraptor/Oviraptor_Character_BP.Oviraptor_Character_BP'" },
  { id: 'Chalico', name: 'Chalicotherium', icon: 'chalicotherium.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Chalicotherium/Chalico_Character_BP.Chalico_Character_BP'" },
  // --- Cave / PvP ---
  { id: 'Baryonyx', name: 'Baryonyx', icon: 'baryonyx.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Baryonyx/Baryonyx_Character_BP.Baryonyx_Character_BP'" },
  { id: 'Thylacoleo', name: 'Thylacoleo', icon: 'thylacoleo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Thylacoleo/Thylacoleo_Character_BP.Thylacoleo_Character_BP'" },
  { id: 'Megalosaurus', name: 'Megalosaurus', icon: 'megalosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Megalosaurus/Megalosaurus_Character_BP.Megalosaurus_Character_BP'" },
  { id: 'Sarco', name: 'Sarcosuchus', icon: 'sarco.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Sarco/Sarco_Character_BP.Sarco_Character_BP'" },
  { id: 'Kaprosuchus', name: 'Kaprosuchus', icon: 'kaprosuchus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Kaprosuchus/Kaprosuchus_Character_BP.Kaprosuchus_Character_BP'" },
  { id: 'Direbear', name: 'Dire Bear', icon: 'direbear.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Direbear/Direbear_Character_BP.Direbear_Character_BP'" },
  { id: 'Megalania', name: 'Megalania', icon: 'megalania.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Megalania/Megalania_Character_BP.Megalania_Character_BP'" },
  { id: 'Purlovia', name: 'Purlovia', icon: 'purlovia.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Purlovia/Purlovia_Character_BP.Purlovia_Character_BP'" },
  { id: 'Arthro', name: 'Arthropluera', icon: 'arthropluera.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Arthropluera/Arthro_Character_BP.Arthro_Character_BP'" },
  // --- Wyverns ---
  { id: 'Wyvern', name: 'Wyvern (all types)', icon: 'fire_wyvern.png', blueprint: '' },
  { id: 'FireWyvern', name: 'Fire Wyvern', icon: 'fire_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_Fire.Wyvern_Character_BP_Fire'" },
  { id: 'LightningWyvern', name: 'Lightning Wyvern', icon: 'lightning_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_Lightning.Wyvern_Character_BP_Lightning'" },
  { id: 'PoisonWyvern', name: 'Poison Wyvern', icon: 'poison_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_Poison.Wyvern_Character_BP_Poison'" },
  { id: 'IceWyvern', name: 'Ice Wyvern', icon: 'ice_wyvern.png', blueprint: "Blueprint'/Game/Mods/Ragnarok/Custom_Assets/Dinos/Wyvern/Ice_Wyvern/Ragnarok_Wyvern_Override_Ice.Ragnarok_Wyvern_Override_Ice'" },
  { id: 'VoidWyvern', name: 'Void Wyvern', icon: 'void_wyvern.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/TekWyvern/TekWyvern_Character_BP.TekWyvern_Character_BP'" },
  { id: 'BloodCrystalWyvern', name: 'Blood Crystal Wyvern', icon: 'blood_crystal_wyvern.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/CrystalWyvern/CrystalWyvern_Character_BP_Blood.CrystalWyvern_Character_BP_Blood'" },
  { id: 'EmberCrystalWyvern', name: 'Ember Crystal Wyvern', icon: 'ember_crystal_wyvern.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/CrystalWyvern/CrystalWyvern_Character_BP_Ember.CrystalWyvern_Character_BP_Ember'" },
  { id: 'TropicalCrystalWyvern', name: 'Tropical Crystal Wyvern', icon: 'tropical_crystal_wyvern.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/CrystalWyvern/CrystalWyvern_Character_BP_WS.CrystalWyvern_Character_BP_WS'" },
  { id: 'ZombieFireWyvern', name: 'Zombie Fire Wyvern', icon: 'zombie_fire_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_ZombieFire.Wyvern_Character_BP_ZombieFire'" },
  { id: 'ZombieLightningWyvern', name: 'Zombie Lightning Wyvern', icon: 'zombie_lightning_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_ZombieLightning.Wyvern_Character_BP_ZombieLightning'" },
  { id: 'ZombiePoisonWyvern', name: 'Zombie Poison Wyvern', icon: 'zombie_poison_wyvern.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_ZombiePoison.Wyvern_Character_BP_ZombiePoison'" },
  // --- Tek ---
  { id: 'BionicRex', name: 'Tek Rex', icon: 'tek_rex.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Rex/BionicRex_Character_BP.BionicRex_Character_BP'" },
  { id: 'BionicStego', name: 'Tek Stego', icon: 'tek_stego.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Stego/BionicStego_Character_BP.BionicStego_Character_BP'" },
  { id: 'BionicTrike', name: 'Tek Trike', icon: 'tek_trike.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Trike/BionicTrike_Character_BP.BionicTrike_Character_BP'" },
  { id: 'BionicQuetz', name: 'Tek Quetzal', icon: 'tek_quetzal.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Quetzalcoatlus/BionicQuetz_Character_BP.BionicQuetz_Character_BP'" },
  { id: 'BionicRaptor', name: 'Tek Raptor', icon: 'tek_raptor.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Raptor/BionicRaptor_Character_BP.BionicRaptor_Character_BP'" },
  { id: 'BionicPara', name: 'Tek Parasaur', icon: 'tek_parasaur.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Para/BionicPara_Character_BP.BionicPara_Character_BP'" },
  // --- R-Variants (Genesis 2 / Eden / Rockwell) ---
  { id: 'R_Allo', name: 'R-Allosaurus', icon: 'r_allo.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Allo_Character_BP_Rockwell.Allo_Character_BP_Rockwell'" },
  { id: 'R_Carno', name: 'R-Carnotaurus', icon: 'r_carno.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Carno_Character_BP_Rockwell.Carno_Character_BP_Rockwell'" },
  { id: 'R_Daeodon', name: 'R-Daeodon', icon: 'r_daeodon.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Daeodon_Character_BP_Eden.Daeodon_Character_BP_Eden'" },
  { id: 'R_Dilo', name: 'R-Dilophosaur', icon: 'r_dilo.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Dilo_Character_BP_Rockwell.Dilo_Character_BP_Rockwell'" },
  { id: 'R_Direwolf', name: 'R-Direwolf', icon: 'r_direwolf.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Direwolf_Character_BP_Eden.Direwolf_Character_BP_Eden'" },
  { id: 'R_Equus', name: 'R-Equus', icon: 'r_equus.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Equus_Character_BP_Eden.Equus_Character_BP_Eden'" },
  { id: 'R_GasBags', name: 'R-Gasbags', icon: 'r_gasbags.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/GasBags_Character_BP_Eden.GasBags_Character_BP_Eden'" },
  { id: 'R_Gigant', name: 'R-Giganotosaurus', icon: 'r_gigant.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Gigant_Character_BP_Rockwell.Gigant_Character_BP_Rockwell'" },
  { id: 'R_Megatherium', name: 'R-Megatherium', icon: 'r_megatherium.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Megatherium_Character_BP_Eden.Megatherium_Character_BP_Eden'" },
  { id: 'R_Owl', name: 'R-Snow Owl', icon: 'r_owl.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Owl_Character_BP_Eden.Owl_Character_BP_Eden'" },
  { id: 'R_Para', name: 'R-Parasaur', icon: 'r_para.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Para_Character_BP_Eden.Para_Character_BP_Eden'" },
  { id: 'R_Procoptodon', name: 'R-Procoptodon', icon: 'r_procoptodon.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Procoptodon_Character_BP_Eden.Procoptodon_Character_BP_Eden'" },
  { id: 'R_Quetz', name: 'R-Quetzal', icon: 'r_quetz.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Quetz_Character_BP_Rockwell.Quetz_Character_BP_Rockwell'" },
  { id: 'R_Sauropod', name: 'R-Brontosaurus', icon: 'r_sauropod.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Sauropod_Character_BP_Rockwell.Sauropod_Character_BP_Rockwell'" },
  { id: 'R_Velo', name: 'R-Velonasaur', icon: 'r_velo.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Spindles_Character_BP_Rockwell.Spindles_Character_BP_Rockwell'" },
  { id: 'R_Thylacoleo', name: 'R-Thylacoleo', icon: 'r_thylacoleo.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Thylacoleo_Character_BP_Eden.Thylacoleo_Character_BP_Eden'" },
  { id: 'R_Carbo', name: 'R-Carbonemys', icon: 'r_carbo.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/BiomeVariants/Turtle_Character_BP_Rockwell.Turtle_Character_BP_Rockwell'" },
  // --- X-Variants (Genesis 1) ---
  { id: 'X_Paracer', name: 'X-Paraceratherium', icon: 'x_paracer.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/BogParaceratherium/Bog_Paracer_Character_BP.Bog_Paracer_Character_BP'" },
  { id: 'X_Raptor', name: 'X-Raptor', icon: 'x_raptor.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Bog_Raptor/Bog_Raptor_Character_BP.Bog_Raptor_Character_BP'" },
  { id: 'X_Spino', name: 'X-Spinosaurus', icon: 'x_spino.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Bog_Spino/Bog_Spino_Character_BP.Bog_Spino_Character_BP'" },
  { id: 'X_Tapejara', name: 'X-Tapejara', icon: 'x_tapejara.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Bog_Tapejara/Bog_Tapejara_Character_BP.Bog_Tapejara_Character_BP'" },
  { id: 'X_Golem', name: 'X-Rock Golem', icon: 'x_golem.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Lava_Golem/Volcano_Golem_Character_BP.Volcano_Golem_Character_BP'" },
  { id: 'X_Basilosaurus', name: 'X-Basilosaurus', icon: 'x_basilosaurus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Ocean_Basilosaurus/Ocean_Basilosaurus_Character_BP.Ocean_Basilosaurus_Character_BP'" },
  { id: 'X_Dunkleosteus', name: 'X-Dunkleosteus', icon: 'x_dunkleosteus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Ocean_Dunkleosteus/Ocean_Dunkle_Character_BP.Ocean_Dunkle_Character_BP'" },
  { id: 'X_Megalodon', name: 'X-Megalodon', icon: 'x_megalodon.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Ocean_Megalodon/Ocean_Megalodon_Character_BP.Ocean_Megalodon_Character_BP'" },
  { id: 'X_Mosa', name: 'X-Mosasaurus', icon: 'x_mosasaurus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Ocean_Mosasaurus/Ocean_Mosa_Character_BP.Ocean_Mosa_Character_BP'" },
  { id: 'X_Argent', name: 'X-Argentavis', icon: 'x_argent.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Snow_Argentavis/Snow_Argent_Character_BP.Snow_Argent_Character_BP'" },
  { id: 'X_Rhino', name: 'X-Woolly Rhino', icon: 'x_woollyrhino.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Snow_WoollyRhino/Snow_Rhino_Character_BP.Snow_Rhino_Character_BP'" },
  { id: 'X_Yutyrannus', name: 'X-Yutyrannus', icon: 'x_yutyrannus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Snow_Yutyrannus/Snow_Yutyrannus_Character_BP.Snow_Yutyrannus_Character_BP'" },
  { id: 'X_Allo', name: 'X-Allosaurus', icon: 'x_allosaurus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Volcano_Allosaurus/Volcano_Allo_Character_BP.Volcano_Allo_Character_BP'" },
  { id: 'X_Ankylo', name: 'X-Ankylosaurus', icon: 'x_ankylosaurus.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Volcano_Ankylosaurus/Volcano_Ankylo_Character_BP.Volcano_Ankylo_Character_BP'" },
  { id: 'X_Rex', name: 'X-Rex', icon: 'x_rex.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Volcano_Rex/Volcano_Rex_Character_BP.Volcano_Rex_Character_BP'" },
  { id: 'X_Trike', name: 'X-Triceratops', icon: 'x_trike.png', blueprint: "Blueprint'/Game/Genesis/Dinos/BiomeVariants/Volcano_Trike/Volcano_Trike_Character_BP.Volcano_Trike_Character_BP'" },
  // --- Scorched Earth ---
  { id: 'Morellatops', name: 'Morellatops', icon: 'morellatops.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Camelsaurus/camelsaurus_Character_BP.camelsaurus_Character_BP'" },
  { id: 'Phoenix', name: 'Phoenix', icon: 'phoenix.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Phoenix/Phoenix_Character_BP.Phoenix_Character_BP'" },
  { id: 'RockGolem', name: 'Rock Golem', icon: 'rock_golem.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/RockGolem/RockGolem_Character_BP.RockGolem_Character_BP'" },
  { id: 'ThornyDragon', name: 'Thorny Dragon', icon: 'thorny_dragon.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/SpineyLizard/SpineyLizard_Character_BP.SpineyLizard_Character_BP'" },
  { id: 'Moth', name: 'Lymantria', icon: 'moth.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Moth/Moth_Character_BP.Moth_Character_BP'" },
  { id: 'Vulture', name: 'Vulture', icon: 'vulture.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Vulture/Vulture_Character_BP.Vulture_Character_BP'" },
  { id: 'Jerboa', name: 'Jerboa', icon: 'jerboa.png', blueprint: "Blueprint'/Game/ScorchedEarth/Dinos/Jerboa/Jerboa_Character_BP.Jerboa_Character_BP'" },
  // --- Valguero ---
  { id: 'ChalkGolem', name: 'Chalk Golem', icon: 'chalkgolem.png', blueprint: "Blueprint'/Game/Mods/Valguero/Assets/Dinos/RockGolem/ChalkGolem/ChalkGolem_Character_BP.ChalkGolem_Character_BP'" },
  // --- Lost Island ---
  { id: 'Amargasaurus', name: 'Amargasaurus', icon: 'amargasaurus.png', blueprint: "Blueprint'/Game/LostIsland/Dinos/Amargasaurus/Amargasaurus_Character_BP.Amargasaurus_Character_BP'" },
  { id: 'Dinopithecus', name: 'Dinopithecus', icon: 'dinopithecus.png', blueprint: "Blueprint'/Game/LostIsland/Dinos/Dinopithecus/Dinopithecus_Character_BP.Dinopithecus_Character_BP'" },
  // --- Fjordur ---
  { id: 'Andrewsarchus', name: 'Andrewsarchus', icon: 'andrew.png', blueprint: "Blueprint'/Game/Fjordur/Dinos/Andrewsarchus/Andrewsarchus_Character_BP.Andrewsarchus_Character_BP'" },
  { id: 'Desmodus', name: 'Desmodus', icon: 'desmo.png', blueprint: "Blueprint'/Game/Fjordur/Dinos/Desmodus/Desmodus_Character_BP.Desmodus_Character_BP'" },
  { id: 'Fenrir', name: 'Fenrir', icon: 'fenrir.png', blueprint: "Blueprint'/Game/Fjordur/Dinos/Fenrir/Fenrir_Character_BP.Fenrir_Character_BP'" },
  // --- Other Common ---
  { id: 'Deinonychus', name: 'Deinonychus', icon: 'deinonychus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Raptor/Uberraptor/Deinonychus_Character_BP.Deinonychus_Character_BP'" },
  { id: 'Sino', name: 'Sinomacrops', icon: 'sinomacrops.png', blueprint: "Blueprint'/Game/LostIsland/Dinos/Sinomacrops/Sinomacrops_Character_BP.Sinomacrops_Character_BP'" },
  { id: 'Procoptodon', name: 'Procoptodon', icon: 'procoptodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Procoptodon/Procoptodon_Character_BP.Procoptodon_Character_BP'" },
  { id: 'Raptor', name: 'Raptor', icon: 'raptor.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Raptor/Raptor_Character_BP.Raptor_Character_BP'" },
  { id: 'Rhyniognatha', name: 'Rhyniognatha', icon: 'rhyniognatha.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Rhyniognatha/Rhynio_Character_BP.Rhynio_Character_BP'" },
  { id: 'Sabertooth', name: 'Sabertooth', icon: 'sabertooth.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Saber/Saber_Character_BP.Saber_Character_BP'" },
  { id: 'Direwolf', name: 'Direwolf', icon: 'direwolf.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Direwolf/Direwolf_Character_BP.Direwolf_Character_BP'" },
  { id: 'Equus', name: 'Equus', icon: 'equus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Equus/Equus_Character_BP.Equus_Character_BP'" },
  { id: 'Unicorn', name: 'Unicorn', icon: 'unicorn.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Equus/Equus_Character_BP_Unicorn.Equus_Character_BP_Unicorn'" },
  { id: 'Kentrosaurus', name: 'Kentrosaurus', icon: 'kentrosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Kentrosaurus/Kentro_Character_BP.Kentro_Character_BP'" },
  { id: 'Iguanodon', name: 'Iguanodon', icon: 'iguanodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Iguanodon/Iguanodon_Character_BP.Iguanodon_Character_BP'" },
  { id: 'Gallimimus', name: 'Gallimimus', icon: 'gallimimus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Gallimimus/Galli_Character_BP.Galli_Character_BP'" },
  { id: 'TerrorBird', name: 'Terror Bird', icon: 'terrorbird.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/TerrorBird/TerrorBird_Character_BP.TerrorBird_Character_BP'" },
  { id: 'Pachy', name: 'Pachycephalosaurus', icon: 'pachy.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Pachy/Pachy_Character_BP.Pachy_Character_BP'" },
  { id: 'Pachyrhino', name: 'Pachyrhinosaurus', icon: 'pachyrhinosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Pachyrhinosaurus/Pachyrhino_Character_BP.Pachyrhino_Character_BP'" },
  // --- Small / Passive ---
  { id: 'Dodo', name: 'Dodo', icon: 'dodo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dodo/Dodo_Character_BP.Dodo_Character_BP'" },
  { id: 'Dilo', name: 'Dilophosaur', icon: 'dilo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dilo/Dilo_Character_BP.Dilo_Character_BP'" },
  { id: 'Compy', name: 'Compy', icon: 'compy.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Compy/Compy_Character_BP.Compy_Character_BP'" },
  { id: 'Microraptor', name: 'Microraptor', icon: 'microraptor.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Microraptor/Microraptor_Character_BP.Microraptor_Character_BP'" },
  { id: 'Troodon', name: 'Troodon', icon: 'troodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Troodon/Troodon_Character_BP.Troodon_Character_BP'" },
  { id: 'Pegomastax', name: 'Pegomastax', icon: 'pegomastax.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Pegomastax/Pegomastax_Character_BP.Pegomastax_Character_BP'" },
  { id: 'Lystrosaurus', name: 'Lystrosaurus', icon: 'lystrosaurus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Lystrosaurus/Lystro_Character_BP.Lystro_Character_BP'" },
  { id: 'Kairuku', name: 'Kairuku', icon: 'kairuku.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Kairuku/Kairuku_Character_BP.Kairuku_Character_BP'" },
  { id: 'Hyaenodon', name: 'Hyaenodon', icon: 'hyaenodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Hyaenodon/Hyaenodon_Character_BP.Hyaenodon_Character_BP'" },
  { id: 'Mesopithecus', name: 'Mesopithecus', icon: 'mesopithecus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Monkey/Monkey_Character_BP.Monkey_Character_BP'" },
  { id: 'Otter', name: 'Otter', icon: 'otter.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Otter/Otter_Character_BP.Otter_Character_BP'" },
  { id: 'Phiomia', name: 'Phiomia', icon: 'phiomia.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Phiomia/Phiomia_Character_BP.Phiomia_Character_BP'" },
  { id: 'Parasaur', name: 'Parasaur', icon: 'parasaur.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Para/Para_Character_BP.Para_Character_BP'" },
  { id: 'Dimetrodon', name: 'Dimetrodon', icon: 'dimetrodon.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Dimetrodon/Dimetro_Character_BP.Dimetro_Character_BP'" },
  { id: 'Diplocaulus', name: 'Diplocaulus', icon: 'diplocaulus.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Diplocaulus/Diplocaulus_Character_BP.Diplocaulus_Character_BP'" },
  { id: 'Ovis', name: 'Ovis', icon: 'ovis.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Sheep/Sheep_Character_BP.Sheep_Character_BP'" },
  // --- Aberration Light Pets ---
  { id: 'Featherlight', name: 'Featherlight', icon: 'featherlight.png', blueprint: "Blueprint'/Game/Aberration/Dinos/LanternBird/LanternBird_Character_BP.LanternBird_Character_BP'" },
  { id: 'Shinehorn', name: 'Shinehorn', icon: 'shinehorn.png', blueprint: "Blueprint'/Game/Aberration/Dinos/LanternGoat/LanternGoat_Character_BP.LanternGoat_Character_BP'" },
  { id: 'Glowtail', name: 'Glowtail', icon: 'glowtail.png', blueprint: "Blueprint'/Game/Aberration/Dinos/LanternLizard/LanternLizard_Character_BP.LanternLizard_Character_BP'" },
  { id: 'Bulbdog', name: 'Bulbdog', icon: 'bulldog.png', blueprint: "Blueprint'/Game/Aberration/Dinos/LanternPug/LanternPug_Character_BP.LanternPug_Character_BP'" },
  // --- Misc ---
  { id: 'Titanoboa', name: 'Titanoboa', icon: 'titanoboa.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/BoaFrill/BoaFrill_Character_BP.BoaFrill_Character_BP'" },
  { id: 'Onyc', name: 'Onyc', icon: 'onyc.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Bat/Bat_Character_BP.Bat_Character_BP'" },
  { id: 'Bee', name: 'Giant Bee', icon: 'bee.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Bee/Bee_Character_BP.Bee_Character_BP'" },
  { id: 'Scorpion', name: 'Pulmonoscorpius', icon: 'scorpion.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Scorpion/Scorpion_Character_BP.Scorpion_Character_BP'" },
  { id: 'Araneo', name: 'Araneo', icon: 'araneo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Spider-Small/SpiderS_Character_BP.SpiderS_Character_BP'" },
  { id: 'Beelzebufo', name: 'Beelzebufo', icon: 'beelzebufo.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/Toad/Toad_Character_BP.Toad_Character_BP'" },
  { id: 'Nameless', name: 'Nameless', icon: 'nameless.png', blueprint: "Blueprint'/Game/Aberration/Dinos/Nameless/Xenomorph_Character_BP_Male_Tamed.Xenomorph_Character_BP_Male_Tamed'" },
  { id: 'IceGolem', name: 'Ice Golem', icon: 'ice_golem.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/IceGolem/IceGolem_Character_BP.IceGolem_Character_BP'" },
  { id: 'Exosuit', name: 'Exo Mek', icon: 'exosuit.png', blueprint: "Blueprint'/Game/Genesis2/Dinos/Exosuit/Exosuit_Character_BP.Exosuit_Character_BP'" },
  // --- Titans ---
  { id: 'Titanosaur', name: 'Titanosaur', icon: 'titanosaur.png', blueprint: "Blueprint'/Game/PrimalEarth/Dinos/titanosaur/Titanosaur_Character_BP.Titanosaur_Character_BP'" },
  { id: 'IceTitan', name: 'Ice Titan', icon: 'ice_titan.png', blueprint: "Blueprint'/Game/Extinction/Dinos/IceKaiju/IceKaiju_Character_BP.IceKaiju_Character_BP'" },
  { id: 'ForestTitan', name: 'Forest Titan', icon: 'forest_titan.png', blueprint: "Blueprint'/Game/Extinction/Dinos/ForestKaiju/ForestKaiju_Character_BP.ForestKaiju_Character_BP'" },
  { id: 'DesertTitan', name: 'Desert Titan', icon: 'desert_titan.png', blueprint: "Blueprint'/Game/Extinction/Dinos/DesertKaiju/DesertKaiju_Character_BP.DesertKaiju_Character_BP'" },
];

export function getSpeciesById(id: string): Species | undefined {
  return ALL_SPECIES.find(s => s.id === id);
}

export function getSpeciesIconUrl(id: string, baseUrl: string): string {
  const species = getSpeciesById(id);
  if (!species || !species.icon) return '';
  return `${baseUrl}/icons/${species.icon}`;
}
