// Terracraft Game Engine: Inventory, Crafting, Game Loop, Camera, Input, HUD & Combat

// Items definition database
const ITEMS = {
  dirt: { id: 'dirt', name: 'Dirt Block', type: 'tile', tile: TILES.DIRT, icon: '🟫', stackMax: 999 },
  stone: { id: 'stone', name: 'Stone Block', type: 'tile', tile: TILES.STONE, icon: '🪨', stackMax: 999 },
  wood: { id: 'wood', name: 'Wood', type: 'tile', tile: TILES.WOOD, icon: '🪵', stackMax: 999 },
  acorn: { id: 'acorn', name: 'Forest Acorn', type: 'material', icon: '🌰', stackMax: 999 },
  bone: { id: 'bone', name: 'Hell Bone', type: 'material', icon: '🦴', stackMax: 999 },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', type: 'material', icon: '⛏️', stackMax: 999 },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', type: 'material', icon: '🪙', stackMax: 999 },
  diamond: { id: 'diamond', name: 'Diamond', type: 'material', icon: '💎', stackMax: 999 },
  apple: { id: 'apple', name: 'Sunlit Apple', type: 'consumable', heal: 25, hunger: 18, icon: '🍎', stackMax: 30 },
  fallen_star: { id: 'fallen_star', name: 'Fallen Star', type: 'consumable', mana: 20, icon: '🌟', stackMax: 30 },
  arrow: { id: 'arrow', name: 'Wooden Arrow', type: 'ammo', icon: '➶', stackMax: 999 },
  bomb: { id: 'bomb', name: 'Forest Bomb', type: 'consumable', damage: 45, radius: 105, icon: '💣', stackMax: 20 },
  wool: { id: 'wool', name: 'Soft Wool', type: 'material', icon: '🧶', stackMax: 999 },
  raw_mutton: { id: 'raw_mutton', name: 'Roasted Mutton', type: 'consumable', heal: 35, hunger: 28, icon: '🍖', stackMax: 30 },
  crystal: { id: 'crystal', name: 'Cave Crystal', type: 'material', icon: '💎', stackMax: 999 },
  snow_block: { id: 'snow_block', name: 'Snow Block', type: 'tile', tile: TILES.SNOW, icon: '❄️', stackMax: 999 },
  sand_block: { id: 'sand_block', name: 'Sand Block', type: 'tile', tile: TILES.SAND, icon: '🟨', stackMax: 999 },
  mud_block: { id: 'mud_block', name: 'Mud Block', type: 'tile', tile: TILES.MUD, icon: '🟩', stackMax: 999 },
  stone_brick: { id: 'stone_brick', name: 'Stone Brick', type: 'tile', tile: TILES.STONE_BRICK, icon: '🧱', stackMax: 999 },
  glass_block: { id: 'glass_block', name: 'Glass Block', type: 'tile', tile: TILES.GLASS, icon: '🔳', stackMax: 999 },
  bed: { id: 'bed', name: 'Forest Bed', type: 'tile', tile: TILES.BED, icon: '🛏️', stackMax: 1 },
  chest: { id: 'chest', name: 'Chest', type: 'tile', tile: TILES.CHEST, icon: '🧰', stackMax: 99 },
  wood_platform: { id: 'wood_platform', name: 'Wood Platform', type: 'tile', tile: TILES.WOOD_PLATFORM, icon: '🌉', stackMax: 999 },
  // ---- Building set --------------------------------------------------------
  // Ten blocks with no combat role at all: they exist so a player who wants to
  // build a house, a bridge or a whole town has more than four colours to do it
  // in. Every one of them is craftable from materials the early game already
  // produces, so none of this is locked behind the bosses.
  planks: { id: 'planks', name: 'Oak Planks', type: 'tile', tile: TILES.PLANKS, icon: '🟧', stackMax: 999 },
  cobblestone: { id: 'cobblestone', name: 'Cobblestone', type: 'tile', tile: TILES.COBBLESTONE, icon: '🪨', stackMax: 999 },
  brick_block: { id: 'brick_block', name: 'Brick Block', type: 'tile', tile: TILES.BRICK_BLOCK, icon: '🧱', stackMax: 999 },
  polished_stone: { id: 'polished_stone', name: 'Polished Stone', type: 'tile', tile: TILES.POLISHED_STONE, icon: '⬜', stackMax: 999 },
  sandstone_brick: { id: 'sandstone_brick', name: 'Sandstone Brick', type: 'tile', tile: TILES.SANDSTONE_BRICK, icon: '🟨', stackMax: 999 },
  hay_block: { id: 'hay_block', name: 'Hay Bale', type: 'tile', tile: TILES.HAY_BLOCK, icon: '🌾', stackMax: 999 },
  wool_block: { id: 'wool_block', name: 'Wool Block', type: 'tile', tile: TILES.WOOL_BLOCK, icon: '🤍', stackMax: 999 },
  ice_block: { id: 'ice_block', name: 'Ice Block', type: 'tile', tile: TILES.ICE_BLOCK, icon: '🧊', stackMax: 999 },
  bookshelf: { id: 'bookshelf', name: 'Bookshelf', type: 'tile', tile: TILES.BOOKSHELF, icon: '📚', stackMax: 999 },
  lantern: { id: 'lantern', name: 'Lantern', type: 'tile', tile: TILES.LANTERN, icon: '🏮', stackMax: 999 },
  // ---- Building set, wave two ------------------------------------------------
  slate_brick: { id: 'slate_brick', name: 'Slate Brick', type: 'tile', tile: TILES.SLATE_BRICK, icon: '⬛', stackMax: 999 },
  thatch: { id: 'thatch', name: 'Thatch', type: 'tile', tile: TILES.THATCH, icon: '🌾', stackMax: 999 },
  marble: { id: 'marble', name: 'Marble', type: 'tile', tile: TILES.MARBLE, icon: '⬜', stackMax: 999 },
  bamboo: { id: 'bamboo', name: 'Bamboo', type: 'tile', tile: TILES.BAMBOO, icon: '🎋', stackMax: 999 },
  copper_block: { id: 'copper_block', name: 'Copper Block', type: 'tile', tile: TILES.COPPER_BLOCK, icon: '🟫', stackMax: 999 },
  // ---- Backpacks -------------------------------------------------------------
  // Three tiers, and only the BEST one you are carrying counts: 5, 10 and 15
  // extra bag slots on top of the 40 you start with. They are a passive carrying
  // upgrade, not an equip slot — there is no "which backpack am I wearing"
  // decision, so the biggest one in the bag simply opens up the most room.
  backpack_small: {
    id: 'backpack_small', name: 'Worn Satchel', type: 'backpack',
    bonusSlots: 5, icon: '🎒', stackMax: 1
  },
  backpack_mid: {
    id: 'backpack_mid', name: "Traveller's Pack", type: 'backpack',
    bonusSlots: 10, icon: '🎒', stackMax: 1
  },
  backpack_large: {
    id: 'backpack_large', name: 'Void-Slung Hauler', type: 'backpack',
    bonusSlots: 15, icon: '🎒', stackMax: 1
  },
  torch: { id: 'torch', name: 'Torch', type: 'tile', tile: TILES.TORCH, icon: '🔥', stackMax: 999 },
  copper_pickaxe: { id: 'copper_pickaxe', name: 'Copper Pickaxe', type: 'tool', toolPower: 1, damage: 6, icon: '⛏️', stackMax: 1 },
  copper_sword: { id: 'copper_sword', name: 'Copper Shortsword', type: 'weapon', weaponType: 'melee', damage: 12, range: 45, icon: '🗡️', stackMax: 1 },
  iron_broadsword: { id: 'iron_broadsword', name: 'Iron Broadsword', type: 'weapon', weaponType: 'melee', damage: 22, range: 60, icon: '⚔️', stackMax: 1 },
  silver_saber: { id: 'silver_saber', name: 'Silver Saber', type: 'weapon', weaponType: 'melee', damage: 34, range: 72, icon: '🗡️', stackMax: 1 },
  starlight_bow: { id: 'starlight_bow', name: 'Starlight Bow', type: 'weapon', weaponType: 'ranged', damage: 18, projectile: 'arrow', speed: 9, icon: '🏹', stackMax: 1 },
  forest_wand: { id: 'forest_wand', name: 'Forest Wand', type: 'weapon', weaponType: 'magic', damage: 28, manaCost: 8, projectile: 'magic_bolt', speed: 10, icon: '🪄', stackMax: 1 },
  crystal_spear: { id: 'crystal_spear', name: 'Crystal Spear', type: 'weapon', weaponType: 'melee', damage: 46, range: 84, icon: '🔱', stackMax: 1 },
  ember_bow: { id: 'ember_bow', name: 'Ember Bow', type: 'weapon', weaponType: 'ranged', damage: 32, projectile: 'arrow', speed: 11, icon: '🏹', stackMax: 1 },
  moon_staff: { id: 'moon_staff', name: 'Moon Staff', type: 'weapon', weaponType: 'magic', damage: 52, manaCost: 12, projectile: 'magic_bolt', speed: 12, icon: '🌙', stackMax: 1 },
  diamond_blade: { id: 'diamond_blade', name: 'Diamond Blade', type: 'weapon', weaponType: 'melee', damage: 58, range: 88, icon: '⚔️', stackMax: 1 },
  iron_armor: { id: 'iron_armor', name: 'Iron Armor Plate', type: 'armor', defense: 6, reduction: 0.12, icon: '🛡️', stackMax: 1 },
  gold_armor: { id: 'gold_armor', name: 'Gold Armor Plate', type: 'armor', defense: 4, reduction: 0.08, icon: '🟨', stackMax: 1 },
  diamond_armor: { id: 'diamond_armor', name: 'Diamond Armor Plate', type: 'armor', defense: 9, reduction: 0.18, icon: '💠', stackMax: 1 },
  crystal_armor: { id: 'crystal_armor', name: 'Crystal Armor Plate', type: 'armor', defense: 15, reduction: 0.25, icon: '💠', stackMax: 1 },
  healing_potion: { id: 'healing_potion', name: 'Lesser Healing Potion', type: 'consumable', heal: 50, icon: '🧪', stackMax: 1 },
  campfire: { id: 'campfire', name: 'Campfire', type: 'tile', tile: TILES.CAMPFIRE, icon: '🏕️', stackMax: 99 }
};

// ============================================================
// ITEM BALANCE PATCH + NEW ITEMS
// Kept as a separate table so the core item list stays readable.
// `useTime` = seconds between uses, `critBonus` = extra crit chance on top of
// the 20% base, so weapons finally have distinct rhythms.
// ============================================================
const ITEM_TUNING = {
  copper_pickaxe: { useTime: 0.22, toolPower: 1 },
  copper_sword: { useTime: 0.27, critBonus: 0.02 },
  iron_broadsword: { useTime: 0.34, critBonus: 0.02 },
  silver_saber: { useTime: 0.24, critBonus: 0.05 },
  starlight_bow: { useTime: 0.42, critBonus: 0.03 },
  forest_wand: { useTime: 0.50, critBonus: 0.02 },
  crystal_spear: { useTime: 0.38, critBonus: 0.04 },
  ember_bow: { useTime: 0.34, critBonus: 0.05 },
  moon_staff: { useTime: 0.46, critBonus: 0.06 },
  diamond_blade: { useTime: 0.22, critBonus: 0.08 },
  aurora_blade: { useTime: 0.26, critBonus: 0.1 },
  bomb: { useTime: 0.9 }
};

// Merge tuning INTO the existing definitions. (Object.assign(ITEMS, ITEM_TUNING)
// would REPLACE the whole item object with {useTime...}, wiping its icon/name/type
// — that was the "undefined" in-hand / missing texture bug.)
for (const [tuneId, tune] of Object.entries(ITEM_TUNING)) {
  if (ITEMS[tuneId]) Object.assign(ITEMS[tuneId], tune);
  else ITEMS[tuneId] = { id: tuneId, ...tune };
}

const KEYBIND_DEFAULTS = {
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  crouch: 'KeyS',
  dodge: 'ShiftLeft',
  sprint: 'ControlLeft',
  craft: 'KeyE',
  inventory: 'KeyI',
  heal: 'KeyH',
  buff: 'KeyQ',
  drop: 'KeyG',
  creative: 'KeyC',
  settings: 'KeyO',
  journal: 'KeyJ',
  minimap: 'KeyM',
  talk: 'KeyT',
  fps: 'KeyF',
  pause: 'KeyP',
  slot1: 'Digit1',
  slot2: 'Digit2',
  slot3: 'Digit3',
  slot4: 'Digit4',
  slot5: 'Digit5',
  slot6: 'Digit6',
  slot7: 'Digit7',
  slot8: 'Digit8',
  slot9: 'Digit9'
};

const KEYBIND_ALIASES = {
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  jump: ['KeyW', 'ArrowUp'],
  crouch: ['ArrowDown'],
  dodge: ['ShiftRight'],
  sprint: ['ControlRight']
};

function keybindConflictAction(action, code, bindings) {
  for (const [other, bound] of Object.entries(bindings)) {
    if (other === action) continue;
    if (bound === code || (KEYBIND_ALIASES[other] || []).includes(code) ||
        (KEYBIND_ALIASES[action] || []).includes(bound)) return other;
  }
  return null;
}

function isValidKeybindCode(code, action) {
  const reserved = new Set([
    'Escape', 'Enter', 'Tab', 'Backspace', 'Delete', 'F1', 'F5', 'F11', 'F12',
    'ContextMenu', 'BrowserBack', 'BrowserForward'
  ]);
  return typeof code === 'string' && /^[A-Za-z][A-Za-z0-9]*$/.test(code) &&
    !reserved.has(code) && (!/^(Shift|Control|Alt|Meta)/.test(code) || action === 'sprint');
}

const KEYBIND_LABELS = {
  moveLeft: 'Move left',
  moveRight: 'Move right',
  jump: 'Jump',
  crouch: 'Crouch / drop through',
  dodge: 'Dodge roll',
  sprint: 'Sprint',
  craft: 'Crafting',
  inventory: 'Inventory',
  heal: 'Quick heal',
  buff: 'Drink buff potion',
  drop: 'Drop held item',
  creative: 'Creative menu',
  settings: 'Settings',
  journal: 'Journal',
  minimap: 'Cycle minimap',
  talk: 'Talk to villager',
  fps: 'Performance readout',
  pause: 'Pause',
  slot1: 'Hotbar slot 1',
  slot2: 'Hotbar slot 2',
  slot3: 'Hotbar slot 3',
  slot4: 'Hotbar slot 4',
  slot5: 'Hotbar slot 5',
  slot6: 'Hotbar slot 6',
  slot7: 'Hotbar slot 7',
  slot8: 'Hotbar slot 8',
  slot9: 'Hotbar slot 9'
};

const NEW_ITEMS = {
  life_crystal: {
    id: 'life_crystal', name: 'Life Crystal', type: 'consumable',
    maxHpBonus: 20, icon: '💗', stackMax: 20
  },
  mana_crystal: {
    id: 'mana_crystal', name: 'Mana Crystal', type: 'consumable',
    maxManaBonus: 20, icon: '🔮', stackMax: 20
  },
  swiftness_potion: {
    id: 'swiftness_potion', name: 'Swiftness Potion', type: 'consumable',
    buff: 'swiftness', buffTime: 240, icon: '🏃', stackMax: 1
  },
  ironskin_potion: {
    id: 'ironskin_potion', name: 'Ironskin Potion', type: 'consumable',
    buff: 'ironskin', buffTime: 240, icon: '🛡️', stackMax: 1
  },
  wrath_potion: {
    id: 'wrath_potion', name: 'Wrath Potion', type: 'consumable',
    buff: 'wrath', buffTime: 240, icon: '😤', stackMax: 1
  },
  regeneration_potion: {
    id: 'regeneration_potion', name: 'Regeneration Potion', type: 'consumable',
    buff: 'regeneration', buffTime: 180, icon: '💚', stackMax: 1
  },
  miners_potion: {
    id: 'miners_potion', name: "Miner's Potion", type: 'consumable',
    buff: 'miners_focus', buffTime: 300, icon: '⛏️', stackMax: 1
  },
  hellstone: {
    id: 'hellstone', name: 'Hellstone', type: 'material',
    icon: '🌋', stackMax: 999
  },
  obsidian_block: {
    id: 'obsidian_block', name: 'Obsidian Block', type: 'tile', tile: TILES.OBSIDIAN,
    icon: '⬛', stackMax: 999
  },
  castle_brick: {
    id: 'castle_brick', name: 'Castle Brick', type: 'tile', tile: TILES.CASTLE_BRICK,
    icon: '🧱', stackMax: 999
  },
  demon_brick: {
    id: 'demon_brick', name: 'Demon Brick', type: 'tile', tile: TILES.DEMON_BRICK,
    icon: '🟥', stackMax: 999
  },
  demon_soul: {
    id: 'demon_soul', name: 'Demon Soul', type: 'material',
    icon: '👹', stackMax: 999
  },
  hellstone_greatblade: {
    id: 'hellstone_greatblade', name: 'Hellstone Greatblade', type: 'weapon', weaponType: 'melee',
    damage: 152, range: 120, useTime: 0.30, critBonus: 0.14, lifesteal: 0.05,
    // Hellfire Venom: every hit has a 40% chance to poison. 4s at 14 dps, so a
    // landed proc adds up to ~56 damage over its lifetime.
    poisonChance: 0.40, poisonDuration: 4, poisonDps: 14,
    icon: '⚔️', stackMax: 1
  },
  soulfire_repeater: {
    id: 'soulfire_repeater', name: 'Soulfire Repeater', type: 'weapon', weaponType: 'ranged',
    damage: 82, projectile: 'arrow', speed: 15, useTime: 0.16, critBonus: 0.10,
    usesAmmo: false, icon: '🏹', stackMax: 1
  },
  abyssal_staff: {
    id: 'abyssal_staff', name: 'Abyssal Staff', type: 'weapon', weaponType: 'magic',
    damage: 138, manaCost: 24, projectile: 'magic_bolt', speed: 11, useTime: 0.38,
    critBonus: 0.12, icon: '🪄', stackMax: 1
  },
  inferno_brand: {
    id: 'inferno_brand', name: 'Inferno Brand', type: 'weapon', weaponType: 'melee',
    damage: 180, range: 136, useTime: 0.3, critBonus: 0.2, lifesteal: 0.1,
    icon: '🔥', stackMax: 1
  },
  demon_trophy: {
    id: 'demon_trophy', name: 'Hellbound Demon Trophy', type: 'material',
    icon: '🏆', stackMax: 1
  },
  guardian_trophy: {
    id: 'guardian_trophy', name: 'Guardian Trophy', type: 'material',
    icon: '🏆', stackMax: 1
  },
  // ---- Space dimension: the Void Rift and the Ossuary Sovereign ----
  // Beacon is consumed on use, so a second trip means another craft. That is
  // deliberate: it makes the rift an expedition you prepare for rather than a
  // free elevator, and it gives the Underworld's souls a reason to be mined.
  void_rift_beacon: {
    id: 'void_rift_beacon', name: 'Void Rift Beacon', type: 'consumable',
    riftBeacon: true, icon: '🌀', stackMax: 5
  },
  // The Sovereign is not waiting for you. Walking into the Ossuary finds a
  // sealed grave and a great deal of mining; this is the candle you bring to
  // open it, and it is priced only in things the arena itself gives up (bone
  // piles, meteor seams, nebula clusters) plus Underworld souls. Craftable
  // before you have ever killed a dragon, which is the point: the first fight
  // is something you go and perform, not something that happens to you.
  rite_of_waking: {
    // The one and only rite in the game. Its recipe prices itself: cheap the
    // first time, sharply more expensive after (see Game.riteOfWakingCost).
    id: 'rite_of_waking', name: 'Rite of Waking', type: 'consumable',
    dragonRite: true, icon: '🕯️', stackMax: 3
  },
  meteor_shard: {
    id: 'meteor_shard', name: 'Meteor Shard', type: 'material',
    icon: '☄️', stackMax: 999
  },
  nebula_crystal: {
    id: 'nebula_crystal', name: 'Nebula Crystal', type: 'material',
    icon: '💜', stackMax: 999
  },
  dragonbone: {
    id: 'dragonbone', name: 'Dragonbone', type: 'material',
    icon: '🦴', stackMax: 999
  },
  dragon_trophy: {
    id: 'dragon_trophy', name: 'Ossuary Sovereign Trophy', type: 'material',
    icon: '🏆', stackMax: 1
  },
  star_platform: {
    id: 'star_platform', name: 'Star Platform', type: 'tile', tile: TILES.VOID_PLATFORM,
    icon: '🟪', stackMax: 999
  },
  void_star_blade: {
    id: 'void_star_blade', name: 'Voidstar Cleaver', type: 'weapon', weaponType: 'melee',
    // Forged from the Sovereign's own skeleton, gated behind the strongest boss
    // until the Ossuary plate arrived. The lifesteal used to be 12%, which —
    // stacked on Voidscale's soak and a Regeneration potion — turned the final
    // fight into a health bar race the player always won. It is now a reward
    // for a good hit, not a second life bar.
    damage: 214, range: 142, useTime: 0.27, critBonus: 0.24, lifesteal: 0.07,
    icon: '🌌', stackMax: 1
  },
  voidscale_armor: {
    // Pulled down the ladder from 46% + 36 to 43% + 24. Voidscale used to sit
    // on top of everything and, with the old Regeneration numbers, made the
    // Sovereign's arena feel survivable by standing still. It is still a
    // superb plate — it is just no longer the answer to every fight, and
    // Demonplate now soaks more of both a small bite (3 HP vs 4) and a boss
    // slam (37 vs 39) than it does.
    id: 'voidscale_armor', name: 'Voidscale Armor', type: 'armor', defense: 24, reduction: 0.43,
    icon: '🌌', stackMax: 1
  },
  // ---- The Ossuary's own gear: what the Sovereign actually drops ----------
  ossuary_armor: {
    // The new apex, and deliberately only one step above Demonplate. 47% + 34
    // leaves a 14 HP slime bite at 2 HP rather than the 1 HP floor: the flat
    // defense slice is weighted at 0.15/point precisely so no plate can ever
    // negate a hit outright. Best in the game, not a win button.
    id: 'ossuary_armor', name: 'Skeletal Wyrmplate', type: 'armor', defense: 34, reduction: 0.47,
    icon: '💀', stackMax: 1
  },
  ossuary_blade: {
    // The Sovereign's fused ribs, torn out and honed. Highest raw damage in
    // the game and a slightly faster swing than the Cleaver — but far less
    // crit and far less lifesteal, so it does not also solve the survivability
    // problem the Cleaver + Voidscale + Regeneration combo used to.
    id: 'ossuary_blade', name: "Sovereign's Fang", type: 'weapon', weaponType: 'melee',
    damage: 248, range: 150, useTime: 0.25, critBonus: 0.16, lifesteal: 0.05,
    icon: '🦴', stackMax: 1
  },
  angel_wings: {
    // The craftable flight tier: thirty seconds of powered ascent, then the
    // wings clamp shut for thirty seconds. Reachable before the Sovereign
    // (wool, crystal, gold, fallen stars), so the sky is not boss-gated.
    id: 'angel_wings', name: 'Angel Wings', type: 'accessory', grantsFlight: true,
    feathered: true, flightTime: 30, flightCooldown: 30,
    icon: '🕊️', stackMax: 1
  },
  dragon_wings: {
    // The Sovereign's own wings. They live in the accessory slot — NOT the
    // armour slot — so the plate and the wings can be worn together. Deliberately
    // no defense/reduction: the flat slice would drag the apex tier back onto
    // the 1 HP floor the ladder was tuned away from, and flight is the stat.
    // Three minutes of powered ascent is the entire game's worth of sky; the
    // thirty second cooldown afterwards is what keeps that from being boring.
    id: 'dragon_wings', name: 'Dragon Wings', type: 'accessory', grantsFlight: true,
    flightTime: 180, flightCooldown: 30,
    icon: '🪽', stackMax: 1
  },
  // ---- Fishing ----
  fishing_rod: {
    id: 'fishing_rod', name: 'Fishing Rod', type: 'tool', toolPower: 0,
    useTime: 0.5, icon: '🎣', stackMax: 1
  },
  fish_minnow: {
    id: 'fish_minnow', name: 'Silver Minnow', type: 'consumable',
    heal: 18, hunger: 12, icon: '🐟', stackMax: 99
  },
  fish_bass: {
    id: 'fish_bass', name: 'Forest Bass', type: 'consumable',
    heal: 30, hunger: 22, icon: '🐠', stackMax: 99
  },
  fish_koi: {
    id: 'fish_koi', name: 'Golden Koi', type: 'material',
    icon: '🎏', stackMax: 99
  },
  fish_clownfish: { id: 'fish_clownfish', name: 'Reef Clownfish', type: 'consumable', heal: 22, hunger: 18, icon: '🐠', stackMax: 256 },
  fish_parrotfish: { id: 'fish_parrotfish', name: 'Rainbow Parrotfish', type: 'consumable', heal: 30, hunger: 24, icon: '🐟', stackMax: 256 },
  fish_manta: { id: 'fish_manta', name: 'Moonlit Manta', type: 'material', icon: '🪽', stackMax: 256 },
  fish_lionfish: { id: 'fish_lionfish', name: 'Spined Lionfish', type: 'consumable', heal: 35, hunger: 28, icon: '🐡', stackMax: 256 },
  fish_turtle: { id: 'fish_turtle', name: 'Reef Turtle', type: 'material', icon: '🐢', stackMax: 256 },
  fish_angler: { id: 'fish_angler', name: 'Abyssal Anglerfish', type: 'material', icon: '🐟', stackMax: 256 },
  sacred_pearl: { id: 'sacred_pearl', name: 'Sacred Pearl', type: 'material', icon: '🫧', stackMax: 256 },
  coral_fragment: { id: 'coral_fragment', name: 'Coral Fragment', type: 'material', icon: '🪸', stackMax: 256 },
  sea_scale: { id: 'sea_scale', name: 'Leviathan Scale', type: 'material', icon: '🔹', stackMax: 256 },
  leviathan_trophy: { id: 'leviathan_trophy', name: 'Leviathan Trophy', type: 'material', icon: '🐉', stackMax: 1 },
  leviathan_trident: { id: 'leviathan_trident', name: 'Leviathan Trident', type: 'weapon', weaponType: 'melee', damage: 142, range: 132, useTime: 0.28, icon: '🔱', stackMax: 1 },
  diving_gear_1: { id: 'diving_gear_1', name: 'Reef Diver Set', type: 'material', icon: '🤿', oxygen: 18, stackMax: 1 },
  diving_gear_2: { id: 'diving_gear_2', name: 'Tidecaller Set', type: 'material', icon: '🤿', oxygen: 38, stackMax: 1 },
  diving_gear_3: { id: 'diving_gear_3', name: 'Abyssal Suit', type: 'material', icon: '🫧', oxygen: 75, stackMax: 1 },
  swim_fins_1: { id: 'swim_fins_1', name: 'Reef Swim Fins', type: 'material', icon: '🩴', swimSpeed: 1.18, stackMax: 1 },
  swim_fins_2: { id: 'swim_fins_2', name: 'Current fins', type: 'material', icon: '🩴', swimSpeed: 1.34, stackMax: 1 },
  swim_fins_3: { id: 'swim_fins_3', name: 'Leviathan Fins', type: 'material', icon: '🩴', swimSpeed: 1.55, stackMax: 1 },
  sunken_boot: {
    id: 'sunken_boot', name: 'Sunken Boot', type: 'material',
    icon: '🥾', stackMax: 99
  },
  anglers_charm: {
    id: 'anglers_charm', name: "Angler's Charm", type: 'armor', defense: 3, reduction: 0.04,
    icon: '🧿', stackMax: 1
  },
  cursed_edge: {
    id: 'cursed_edge', name: "Cursed Knight's Edge", type: 'weapon', weaponType: 'melee',
    damage: 88, range: 108, useTime: 0.24, critBonus: 0.08, icon: '⚔️', stackMax: 1
  },
  rainbow_ore: {
    id: 'rainbow_ore', name: 'Rainbow Ore', type: 'material',
    icon: '🌈', stackMax: 999
  },
  prismatic_saber: {
    id: 'prismatic_saber', name: 'Prismatic Saber', type: 'weapon', weaponType: 'melee',
    damage: 98, range: 112, useTime: 0.25, critBonus: 0.10, icon: '🌟', stackMax: 1
  },
  aurora_blade: {
    id: 'aurora_blade', name: 'Aurora Blade', type: 'weapon', weaponType: 'melee',
    damage: 125, range: 128, useTime: 0.28, critBonus: 0.12, lifesteal: 0.06,
    icon: '🌠', stackMax: 1
  },
  // ---- THE BAN HAMMER -------------------------------------------------------
  // A creative-menu weapon and nothing else. `hitsAll` makes one swing connect
  // with EVERY target within `banRadius` instead of only those inside the swing
  // cone, so a single swing clears a room. It has no recipe, no drop table and
  // no shop: `creativeOnly` is enforced inside Game.addItem, so every normal
  // route to an item — crafting, mining, boss bags, loot rolls, save editing —
  // is refused, and only the creative menu can grant it.
  ban_hammer: {
    id: 'ban_hammer', name: 'The Ban Hammer', type: 'weapon', weaponType: 'melee',
    // TEN MILLION. One swing deletes literally anything it touches, including
    // the 100,000 HP Sovereign. A creative sandbox toy, not a balanced weapon,
    // and `hitsAll` means one swing erases a whole room.
    damage: 10000000, range: 130, useTime: 0.85, critBonus: 0.05, banRadius: 260,
    hitsAll: true, creativeOnly: true, icon: '🔨', stackMax: 1
  },
  rainbow_armor: {
    id: 'rainbow_armor', name: 'Prismatic Armor', type: 'armor', defense: 22, reduction: 0.32,
    icon: '🌈', stackMax: 1
  },
  fallen_star_armor: {
    // Defence trimmed 28 -> 22 when the Ossuary plate joined the ladder. The
    // small-hit ladder has to stay strictly monotonic in whole HP (there are
    // only ~7 integer steps to share between nine plates), and a nerfed
    // Voidscale landing at 4 HP on a slime bite meant this tier had to move one
    // step down to keep every plate a distinct rung.
    id: 'fallen_star_armor', name: 'Fallen Star Armor', type: 'armor', defense: 22, reduction: 0.40,
    icon: '🌟', stackMax: 1
  },
  demon_armor: {
    // 48% would be the obvious "just make it bigger" pick, but combined with the
    // flat defense slice it ate a small hit whole: at 48% + 36 defense a 14 HP
    // slime bite was fully negated down to the 1 HP floor, making Demonplate
    // functionally immune to chip damage. 44% + 32 keeps it the clear apex while
    // every tier stays a distinct step on a small hit.
    id: 'demon_armor', name: 'Demonplate Armor', type: 'armor', defense: 32, reduction: 0.44,
    icon: '👹', stackMax: 1
  }
};

Object.assign(ITEMS, NEW_ITEMS);
for (const item of Object.values(ITEMS)) item.stackMax = 256;

// ============================================================
// ARMOUR LADDER
// One ordered list, strongest first. Everything that needs to
// reason about "which armour is better" reads this instead of
// hardcoding ids, which is how pieces used to fall out of the
// system and quietly stop granting anything.
//
// `reduction` is a fraction of incoming damage the plate soaks
// up, on top of the flat `defense` subtraction. The ladder is
// deliberately gentle and no tier reaches immunity: the 1 HP
// floor in Player.takeDamage() always applies, so the best
// armour still lets most of a big hit through.
// ============================================================
const ARMOR_TIERS = [
  'ossuary_armor',      // 1st - 47%  (pried off the Ossuary Sovereign itself)
  'demon_armor',        // 2nd - 44%  (forged from the Demon himself)
  'voidscale_armor',    // 3rd - 43% at less defence (nerfed: see the item)
  'fallen_star_armor',  // 4th - 40%
  'rainbow_armor',      // 5th - 32%
  'crystal_armor',      // 6th - 25%
  'diamond_armor',      // 7th - 18%
  'iron_armor',         // 8th - 12%
  'gold_armor',         // 9th - 8%
  'anglers_charm'       // accessory - 4%
];

/** The armour item with the highest reduction that the player owns. */
function bestOwnedArmor(game) {
  for (const id of ARMOR_TIERS) {
    if (game.countItem(id) > 0) return ITEMS[id];
  }
  return null;
}

// Crafting recipes
const RECIPES = [
  {
    result: { id: 'torch', count: 3 },
    materials: [{ id: 'wood', count: 1 }],
    name: 'Torches (x3)'
  },
  {
    result: { id: 'arrow', count: 25 },
    materials: [{ id: 'wood', count: 1 }, { id: 'stone', count: 1 }],
    name: 'Wooden Arrows (x25)'
  },
  {
    result: { id: 'stone_brick', count: 4 },
    materials: [{ id: 'stone', count: 2 }],
    name: 'Stone Bricks (x4)'
  },
  {
    result: { id: 'glass_block', count: 4 },
    materials: [{ id: 'stone', count: 2 }, { id: 'sand_block', count: 2 }],
    name: 'Glass Blocks (x4)'
  },
  // ---- Building set recipes. Costs are pitched so a first-night base is
  // reachable from a few minutes of mining, while the nicer materials (brick,
  // polished stone, ice) want a bit more of the world opened up first.
  {
    result: { id: 'planks', count: 4 },
    materials: [{ id: 'wood', count: 1 }],
    name: 'Oak Planks (x4)'
  },
  {
    result: { id: 'cobblestone', count: 4 },
    materials: [{ id: 'stone', count: 4 }],
    name: 'Cobblestone (x4)'
  },
  {
    result: { id: 'brick_block', count: 4 },
    materials: [{ id: 'stone', count: 3 }, { id: 'sand_block', count: 1 }],
    name: 'Brick Blocks (x4)'
  },
  {
    result: { id: 'polished_stone', count: 4 },
    materials: [{ id: 'stone', count: 4 }, { id: 'crystal', count: 1 }],
    name: 'Polished Stone (x4)'
  },
  {
    result: { id: 'sandstone_brick', count: 4 },
    materials: [{ id: 'sand_block', count: 4 }],
    name: 'Sandstone Bricks (x4)'
  },
  {
    result: { id: 'hay_block', count: 1 },
    materials: [{ id: 'acorn', count: 6 }],
    name: 'Hay Bale'
  },
  {
    result: { id: 'wool_block', count: 2 },
    materials: [{ id: 'wool', count: 3 }],
    name: 'Wool Blocks (x2)'
  },
  {
    result: { id: 'ice_block', count: 2 },
    materials: [{ id: 'snow_block', count: 3 }, { id: 'crystal', count: 1 }],
    name: 'Ice Blocks (x2)'
  },
  {
    result: { id: 'bookshelf', count: 1 },
    materials: [{ id: 'wood', count: 8 }, { id: 'acorn', count: 4 }],
    name: 'Bookshelf'
  },
  {
    // A real light source you can hang anywhere, so a build does not have to be
    // a line of torches. Same light value as a torch but priced higher.
    result: { id: 'lantern', count: 2 },
    materials: [{ id: 'iron_ore', count: 2 }, { id: 'torch', count: 1 }, { id: 'crystal', count: 1 }],
    name: 'Lanterns (x2)'
  },
  // ---- Building set, wave two ------------------------------------------------
  // Five more blocks, all craftable from what the early and mid game already
  // produces. Slate and marble are stone; thatch and bamboo are wood-side; the
  // copper block is the first metal building block in the game.
  {
    result: { id: 'slate_brick', count: 2 },
    materials: [{ id: 'stone', count: 6 }, { id: 'iron_ore', count: 1 }],
    name: 'Slate Bricks (x2)'
  },
  {
    result: { id: 'thatch', count: 2 },
    materials: [{ id: 'wood', count: 4 }, { id: 'acorn', count: 4 }],
    name: 'Thatch (x2)'
  },
  {
    result: { id: 'marble', count: 1 },
    materials: [{ id: 'stone', count: 10 }, { id: 'crystal', count: 2 }],
    name: 'Marble'
  },
  {
    result: { id: 'bamboo', count: 2 },
    materials: [{ id: 'wood', count: 5 }, { id: 'wool', count: 1 }],
    name: 'Bamboo (x2)'
  },
  {
    result: { id: 'copper_block', count: 1 },
    materials: [{ id: 'iron_ore', count: 8 }, { id: 'gold_ore', count: 2 }],
    name: 'Copper Block'
  },
  // ---- Backpacks: the bag gets bigger, in three steps ------------------------
  // Each tier is a strict upgrade on the one before, and each consumes the last,
  // so the ladder reads as one journey rather than three parallel sidegrades.
  {
    result: { id: 'backpack_small', count: 1 },
    materials: [{ id: 'wool', count: 8 }, { id: 'wood', count: 6 }],
    name: 'Worn Satchel (+5 bag slots)'
  },
  {
    result: { id: 'backpack_mid', count: 1 },
    materials: [{ id: 'backpack_small', count: 1 }, { id: 'iron_ore', count: 8 }, { id: 'wool', count: 10 }],
    name: "Traveller's Pack (+10 bag slots)"
  },
  {
    result: { id: 'backpack_large', count: 1 },
    materials: [
      { id: 'backpack_mid', count: 1 }, { id: 'gold_ore', count: 12 },
      { id: 'crystal', count: 6 }, { id: 'rainbow_ore', count: 4 }
    ],
    name: 'Void-Slung Hauler (+15 bag slots)'
  },
  {
    result: { id: 'apple', count: 2 },
    materials: [{ id: 'acorn', count: 3 }],
    name: 'Sunlit Apples (x2)'
  },
  {
    result: { id: 'fallen_star', count: 2 },
    materials: [{ id: 'gold_ore', count: 1 }, { id: 'acorn', count: 2 }],
    name: 'Fallen Stars (x2)'
  },
  {
    result: { id: 'bomb', count: 2 },
    materials: [{ id: 'stone', count: 4 }, { id: 'iron_ore', count: 1 }, { id: 'torch', count: 1 }],
    name: 'Forest Bombs (x2)'
  },
  {
    result: { id: 'bed', count: 1 },
    materials: [{ id: 'wood', count: 15 }, { id: 'wool', count: 3 }],
    name: 'Explorer Bed'
  },
  {
    // Storage furniture: 18 world-side slots per chest, so a base can stock
    // supplies without the bag (or the cross-world stash) carrying everything.
    result: { id: 'chest', count: 1 },
    materials: [{ id: 'wood', count: 8 }, { id: 'iron_ore', count: 2 }],
    name: 'Chest'
  },
  {
    result: { id: 'campfire', count: 1 },
    materials: [{ id: 'wood', count: 10 }, { id: 'torch', count: 2 }],
    name: 'Cozy Campfire'
  },
  {
    result: { id: 'iron_broadsword', count: 1 },
    materials: [{ id: 'iron_ore', count: 8 }, { id: 'wood', count: 3 }],
    name: 'Iron Broadsword'
  },
  {
    result: { id: 'silver_saber', count: 1 },
    materials: [{ id: 'gold_ore', count: 8 }, { id: 'iron_ore', count: 4 }],
    name: 'Silver Saber'
  },
  {
    result: { id: 'starlight_bow', count: 1 },
    materials: [{ id: 'wood', count: 12 }, { id: 'acorn', count: 4 }],
    name: 'Starlight Bow'
  },
  {
    result: { id: 'forest_wand', count: 1 },
    materials: [{ id: 'wood', count: 15 }, { id: 'gold_ore', count: 5 }],
    name: 'Forest Wand'
  },
  {
    result: { id: 'crystal_spear', count: 1 },
    materials: [{ id: 'crystal', count: 10 }, { id: 'iron_ore', count: 8 }, { id: 'wood', count: 3 }],
    name: 'Crystal Spear'
  },
  {
    result: { id: 'ember_bow', count: 1 },
    materials: [{ id: 'crystal', count: 8 }, { id: 'gold_ore', count: 5 }, { id: 'wood', count: 12 }],
    name: 'Ember Bow'
  },
  {
    result: { id: 'moon_staff', count: 1 },
    materials: [{ id: 'crystal', count: 14 }, { id: 'gold_ore', count: 8 }, { id: 'fallen_star', count: 3 }],
    name: 'Moon Staff'
  },
  {
    result: { id: 'diamond_blade', count: 1 },
    materials: [{ id: 'diamond', count: 10 }, { id: 'gold_ore', count: 4 }, { id: 'wood', count: 2 }],
    name: 'Diamond Blade'
  },
  {
    result: { id: 'iron_armor', count: 1 },
    materials: [{ id: 'iron_ore', count: 12 }],
    name: 'Iron Armor'
  },
  {
    result: { id: 'gold_armor', count: 1 },
    materials: [{ id: 'gold_ore', count: 16 }],
    name: 'Gold Armor'
  },
  {
    result: { id: 'diamond_armor', count: 1 },
    materials: [{ id: 'diamond', count: 20 }, { id: 'gold_ore', count: 4 }],
    name: 'Diamond Armor'
  },
  {
    result: { id: 'crystal_armor', count: 1 },
    materials: [{ id: 'crystal', count: 20 }, { id: 'iron_ore', count: 12 }],
    name: 'Crystal Armor'
  },
  {
    result: { id: 'healing_potion', count: 2 },
    materials: [{ id: 'acorn', count: 2 }, { id: 'wood', count: 1 }],
    name: 'Healing Potion (x2)'
  },
  // ---- Fishing gear ----
  {
    result: { id: 'fishing_rod', count: 1 },
    materials: [{ id: 'wood', count: 8 }, { id: 'wool', count: 2 }],
    name: 'Fishing Rod'
  },
  { result: { id: 'diving_gear_1', count: 1 }, materials: [{ id: 'wool', count: 8 }, { id: 'iron_ore', count: 6 }, { id: 'fish_clownfish', count: 3 }], name: 'Reef Diver Set (18s oxygen)' },
  { result: { id: 'diving_gear_2', count: 1 }, materials: [{ id: 'diving_gear_1', count: 1 }, { id: 'gold_ore', count: 8 }, { id: 'coral_fragment', count: 16 }, { id: 'fish_manta', count: 2 }], name: 'Tidecaller Set (38s oxygen)' },
  { result: { id: 'diving_gear_3', count: 1 }, materials: [{ id: 'diving_gear_2', count: 1 }, { id: 'diamond', count: 8 }, { id: 'sacred_pearl', count: 2 }, { id: 'fish_angler', count: 3 }], name: 'Abyssal Suit (75s oxygen)' },
  { result: { id: 'swim_fins_1', count: 1 }, materials: [{ id: 'wool', count: 4 }, { id: 'fish_turtle', count: 2 }], name: 'Reef Swim Fins' },
  { result: { id: 'swim_fins_2', count: 1 }, materials: [{ id: 'swim_fins_1', count: 1 }, { id: 'fish_turtle', count: 2 }, { id: 'coral_fragment', count: 12 }], name: 'Current Fins' },
  { result: { id: 'swim_fins_3', count: 1 }, materials: [{ id: 'swim_fins_2', count: 1 }, { id: 'fish_manta', count: 3 }, { id: 'sacred_pearl', count: 1 }], name: 'Leviathan Fins' },
  { result: { id: 'leviathan_trident', count: 1 }, materials: [{ id: 'leviathan_trophy', count: 1 }, { id: 'sea_scale', count: 18 }, { id: 'sacred_pearl', count: 4 }], name: 'Leviathan Trident' },
  {
    result: { id: 'anglers_charm', count: 1 },
    materials: [{ id: 'gold_ore', count: 6 }, { id: 'crystal', count: 3 }, { id: 'fish_koi', count: 2 }],
    name: "Angler's Charm (+3 defense)"
  },
  // ---- Enchanting table: crystals from the caves become permanent power ----
  {
    result: { id: 'life_crystal', count: 1 },
    materials: [{ id: 'crystal', count: 5 }, { id: 'gold_ore', count: 2 }, { id: 'apple', count: 2 }],
    name: 'Life Crystal (+20 max life)'
  },
  {
    result: { id: 'mana_crystal', count: 1 },
    materials: [{ id: 'crystal', count: 5 }, { id: 'fallen_star', count: 2 }],
    name: 'Mana Crystal (+20 max mana)'
  },
  // ---- Buff potions ----
  {
    result: { id: 'swiftness_potion', count: 1 },
    materials: [{ id: 'acorn', count: 3 }, { id: 'crystal', count: 1 }],
    name: 'Swiftness Potion'
  },
  {
    result: { id: 'ironskin_potion', count: 1 },
    materials: [{ id: 'iron_ore', count: 3 }, { id: 'crystal', count: 1 }],
    name: 'Ironskin Potion'
  },
  {
    result: { id: 'wrath_potion', count: 1 },
    materials: [{ id: 'gold_ore', count: 2 }, { id: 'crystal', count: 1 }],
    name: 'Wrath Potion'
  },
  {
    result: { id: 'regeneration_potion', count: 1 },
    materials: [{ id: 'apple', count: 2 }, { id: 'acorn', count: 2 }, { id: 'crystal', count: 1 }],
    name: 'Regeneration Potion'
  },
  {
    result: { id: 'miners_potion', count: 1 },
    materials: [{ id: 'crystal', count: 2 }, { id: 'stone', count: 4 }],
    name: "Miner's Potion"
  },
  {
    result: { id: 'rainbow_armor', count: 1 },
    materials: [
      { id: 'rainbow_ore', count: 12 }, { id: 'diamond', count: 8 },
      { id: 'crystal', count: 15 }, { id: 'gold_ore', count: 10 }
    ],
    name: 'Prismatic Armor (+22 defense)'
  },
  {
    result: { id: 'fallen_star_armor', count: 1 },
    materials: [
      { id: 'fallen_star', count: 12 }, { id: 'diamond', count: 12 },
      { id: 'rainbow_ore', count: 8 }, { id: 'crystal', count: 20 }
    ],
    name: 'Fallen Star Armor (+28 defense)'
  },
  // ---- Endgame: both blades demand rare Rainbow Ore ----
  {
    result: { id: 'prismatic_saber', count: 1 },
    materials: [
      { id: 'rainbow_ore', count: 15 }, { id: 'diamond', count: 10 },
      { id: 'crystal', count: 12 }, { id: 'gold_ore', count: 8 }
    ],
    name: 'Prismatic Saber'
  },
  {
    result: { id: 'aurora_blade', count: 1 },
    materials: [
      { id: 'rainbow_ore', count: 25 }, { id: 'diamond', count: 15 },
      { id: 'crystal', count: 20 }, { id: 'life_crystal', count: 2 },
      { id: 'fallen_star', count: 3 }
    ],
    name: 'Aurora Blade (life steal)'
  },
  // ---- Underworld forge: materials are found after the Hellstone layer ----
  {
    result: { id: 'hellstone_greatblade', count: 1 },
    materials: [
      { id: 'hellstone', count: 18 }, { id: 'obsidian_block', count: 8 },
      { id: 'demon_soul', count: 3 }, { id: 'castle_brick', count: 6 }
    ],
    name: 'Hellstone Greatblade (ember trail)'
  },
  {
    result: { id: 'soulfire_repeater', count: 1 },
    materials: [
      { id: 'hellstone', count: 10 }, { id: 'obsidian_block', count: 4 },
      { id: 'demon_soul', count: 2 }, { id: 'castle_brick', count: 4 }
    ],
    name: 'Soulfire Repeater (rapid arrow)'
  },
  {
    result: { id: 'abyssal_staff', count: 1 },
    materials: [
      { id: 'hellstone', count: 15 }, { id: 'obsidian_block', count: 8 },
      { id: 'demon_soul', count: 3 }, { id: 'demon_brick', count: 6 }
    ],
    name: 'Abyssal Staff (deep mana bolt)'
  },
  {
    // The apex of the armour ladder. It deliberately costs the Demon's Trophy, so
    // the only way to wear his hide is to actually beat him — the trophy is the
    // one material in the game that cannot be bought, farmed or substituted.
    result: { id: 'demon_armor', count: 1 },
    materials: [
      { id: 'demon_trophy', count: 1 },
      { id: 'hellstone', count: 25 }, { id: 'obsidian_block', count: 12 },
      { id: 'demon_soul', count: 8 }, { id: 'castle_brick', count: 10 }
    ],
    name: 'Demonplate Armor (44% damage reduction)'
  },
  // ---- Space dimension recipes -------------------------------------------------
  // The beacon is the gateway to the Ossuary and is deliberately priced in
  // Underworld loot: you have to have been deep enough to meet the Demon before
  // you can even knock on the Sovereign's door.
  {
    result: { id: 'void_rift_beacon', count: 1 },
    materials: [
      { id: 'demon_soul', count: 4 }, { id: 'hellstone', count: 6 },
      { id: 'crystal', count: 4 }, { id: 'gold_ore', count: 8 }
    ],
    name: 'Void Rift Beacon (tears open the Ossuary)'
  },
  // The FIRST Sovereign is woken by a rite too, not by walking in. Everything it
  // asks for is mineable out of the Ossuary itself (dragonbone off the bone
  // piles, meteor shards and nebula crystals out of the seams and the deep) plus
  // a couple of Underworld souls, so the first expedition is a scouting trip you
  // come back from prepared. The dragon never simply appears.
  {
    result: { id: 'rite_of_waking', count: 1 },
    // `dynamicRite` is the whole point of this entry: the price is resolved at
    // craft time from ritesCrafted (cheap first time, expensive afterwards), so
    // this list is only the placeholder the QA and integrity checks read.
    dynamicRite: true,
    materials: [
      { id: 'dragonbone', count: 10 }, { id: 'meteor_shard', count: 8 },
      { id: 'nebula_crystal', count: 4 }
    ],
    name: 'Rite of Waking (wakes the first Sovereign in the Ossuary)'
  },
  {
    result: { id: 'star_platform', count: 4 },
    materials: [{ id: 'meteor_shard', count: 1 }, { id: 'stone', count: 4 }],
    name: 'Star Platforms (x4)'
  },
  {
    result: { id: 'void_star_blade', count: 1 },
    materials: [
      { id: 'dragonbone', count: 14 }, { id: 'meteor_shard', count: 10 },
      { id: 'nebula_crystal', count: 6 }
    ],
    name: 'Voidstar Cleaver (214 damage, 7% lifesteal)'
  },
  {
    result: { id: 'voidscale_armor', count: 1 },
    materials: [
      { id: 'dragon_trophy', count: 1 }, { id: 'dragonbone', count: 24 },
      { id: 'nebula_crystal', count: 12 }, { id: 'meteor_shard', count: 16 }
    ],
    name: 'Voidscale Armor (43% damage reduction)'
  },
  // ---- The Sovereign's own gear ------------------------------------------------
  // The Sovereign's Fang has a recipe, because a lost blade should be rebuildable
  // from ore. The Wyrmplate and the Dragon Wings DELIBERATELY DO NOT: they are
  // not craftable at any price. The first Sovereign is the one and only source of
  // both — every later dragon drops the trophy, the fang and the ore, never the
  // plate or the wings again. Losing either to a bad respawn is permanent.
  {
    result: { id: 'ossuary_blade', count: 1 },
    materials: [
      { id: 'dragonbone', count: 26 }, { id: 'nebula_crystal', count: 12 },
      { id: 'meteor_shard', count: 16 }
    ],
    name: "Sovereign's Fang (248 damage, 5% lifesteal)"
  },
  // ---- Flight -----------------------------------------------------------------
  // Angel Wings are the pre-boss flight tier: everything on this list is
  // farmable in the overworld (sheep, caves, gold veins, night sky), so the
  // sky is open to anyone willing to gather. Thirty seconds up, thirty back.
  {
    result: { id: 'angel_wings', count: 1 },
    materials: [
      { id: 'wool', count: 12 }, { id: 'crystal', count: 8 },
      { id: 'gold_ore', count: 6 }, { id: 'fallen_star', count: 4 }
    ],
    name: 'Angel Wings (30s flight, 30s cooldown)'
  }
  // NOTE: there is deliberately no Skeletal Wyrmplate recipe and no Dragon Wings
  // recipe. Both come from the first Sovereign's corpse and nowhere else — see
  // UNCRAFTABLE_RECIPE_IDS below, which the QA suite asserts against.
];

// Recipe ids the forge must NEVER be able to produce, whatever the materials.
// A plate or a pair of wings that can be bought with ore would not be the first
// dragon's trophy at all.
const UNCRAFTABLE_RECIPE_IDS = ['ossuary_armor', 'dragon_wings'];

class Game {
  constructor() {
    this.saveKey = (() => {
      try {
        const active = Number(localStorage.getItem('terracraft-active-save') || 1);
        return `terracraft-world-slot-${active >= 1 && active <= 3 ? active : 1}`;
      } catch (_) { return 'terracraft-world-slot-1'; }
    })();
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.lightCanvas = document.getElementById('lightingCanvas');
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.sound = new SoundSystem();
    this.particles = new ParticleSystem();
    this.world = new World(440, 175, this.worldSeed());
    this.world.generateReef();
    this.weather = new WeatherSystem(this.world);

    // ---- Retro pixel presentation ----
    // The world is drawn into a small offscreen buffer and upscaled with nearest-neighbour.
    // renderScale=1 means 1 world pixel = 1 CSS pixel (widest, least zoomed view).
    // Higher values look chunkier but show less of the world (more "zoomed in").
    this.renderScale = 1;
    this.zoom = 1; // camera zoom: >1 = closer, <1 = see more. Change with +/- keys or buttons.
    this.dpr = window.devicePixelRatio || 1;

    // ---- Adaptive quality ----
    // One master switch that trades a little sharpness for smoothness. The
    // budget measures the *average* frame, so one hitch cannot flip it back on.
    this.autoQuality = true;
    this.quality = {
      budgetMs: 24,        // average frame time above this = drop sharpness
      avgMs: 16.7,         // rolling average, seeded at 60fps
      goodFrames: 0,       // consecutive fast frames before restoring sharpness
      // Start at full resolution and let the rolling average decide. The old
      // seed (`innerWidth * innerHeight * dpr^2 > 2.6e6`) started *high-DPI
      // laptops in low quality before a single frame had been measured, which
      // is why the same build looked chunky on one machine and crisp on
      // another. Measured performance is the honest signal.
      lowQuality: false
    };
    this.settings = this.loadSettings();
    // Applied before the first frame so the HUD never paints at the wrong size
    // and then jump. #ui-layer only - the main menu keeps its own size.
    this.applyUiScale();
    this.showFps = this.settings.showFps;
    this.autosaveInterval = this.settings.autosave;
    this.applyQualityMode(this.settings.quality, false);
    // Same helper weather.js uses for its particle cap.
    this.pixelCanvas = document.createElement('canvas');
    this.pixelCtx = this.pixelCanvas.getContext('2d');
    this.pixelCtx.imageSmoothingEnabled = false;

    // Additive bloom layer: torches, lava, stars and explosions cast real light.
    this.glowCanvas = document.getElementById('glowCanvas');
    this.glowCtx = this.glowCanvas ? this.glowCanvas.getContext('2d') : null;
    this.applyGlowMode(false);

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };

    // Spawn player in center of world
    const spawnX = Math.floor(this.world.width / 2) * TILE_SIZE;
    const spawnY = (this.world.surfaceHeights[Math.floor(this.world.width / 2)] - 3) * TILE_SIZE;
    this.player = new Player(spawnX, spawnY);
    this.oxygen = 75;
    this.oxygenMax = 75;
    this.oxygenDamageTimer = 0;
    this.reefFish = [];
    this.reefFishSpawnTimer = 0;
    this.leviathanHP = null;
    this.leviathanSlain = false;
    this.equippedArmorId = null;
    // Second slot: accessories (currently only the Sovereign's Dragon Wings).
    // Kept separate from equippedArmorId so flight never costs you the plate.
    this.equippedAccessoryId = null;

    // Initial camera position centered on player
    this.camera.x = Math.max(0, Math.min(this.world.pixelWidth - this.camera.viewportWidth, this.player.x + this.player.width / 2 - this.camera.viewportWidth / 2));
    this.camera.y = Math.max(0, Math.min(this.world.pixelHeight - this.camera.viewportHeight, this.player.y + this.player.height / 2 - this.camera.viewportHeight / 2));

    // Inventory: 9 hotbar slots + 31 bag slots (40 total).
    this.inventory = Array.from({ length: 40 }, () => ({ id: 'empty', count: 0 }));
    // Starting loadout
    this.inventory[0] = { id: 'copper_pickaxe', count: 1 };
    this.inventory[1] = { id: 'copper_sword', count: 1 };
    this.inventory[2] = { id: 'torch', count: 30 };
    this.inventory[3] = { id: 'bed', count: 1 };
    this.inventory[4] = { id: 'empty', count: 0 };
    this.inventory[5] = { id: 'arrow', count: 30 };
    this.inventory[6] = { id: 'bomb', count: 2 };

    // Entities
    this.monsters = [];
    this.critters = [];
    this.cerberus = null;
    this.projectiles = [];
    this.drops = [];
    this.boss = null;

    // ---- Game feel, buffs and navigation (see juice.js) ----
    this.feel = new GameFeel();
    this.buffs = new BuffSystem();
    this.minimap = new Minimap(this.world);
    // Volume, music, shake, hit-stop, damage numbers, minimap and tooltips.
    // Applied HERE, not next to loadSettings() above, because every one of them
    // reaches a subsystem that is constructed after it: the sound mixer (line
    // 849), the particle system (850), GameFeel and the minimap (both just
    // above). Called earlier it would throw on the first missing one.
    this.applyAllSettings();
    // Villagers who hand out quests (see npcs.js).
    this.npcs = typeof NPCManager !== 'undefined' ? new NPCManager(this) : null;
    // Persistent journey goals, explorer ranks, biome discoveries and streaks.
    this.journey = typeof JourneySystem !== 'undefined' ? new JourneySystem(this) : null;
    // Multiplayer session (see multiplayer.js). 'none' until the player hosts
    // or joins from the title screen; every hook below is a no-op while idle.
    this.mp = typeof Multiplayer !== 'undefined' ? new Multiplayer(this) : null;
    this.paused = false;
    // Armed from the player's chosen interval so the first autosave happens a
    // full interval from boot, not 90s regardless of their setting.
    this.autosaveInterval = this.settings && this.settings.autosave ? this.settings.autosave : 90;
    this.autosaveTimer = this.autosaveInterval;
    this.potionsUsed = 0;

    // Player progression + run statistics (shown on death / victory screens)
    this.maxHpUpgrades = 0;
    this.maxManaUpgrades = 0;
    this.stats = {
      kills: 0,
      eliteKills: 0,
      bossKills: 0,
      blocksMined: 0,
      blocksPlaced: 0,
      itemsCrafted: 0,
      woodCollected: 0,
      damageDealt: 0,
      damageTaken: 0,
      deaths: 0,
      playTime: 0
    };
    this.deathCause = 'The wilds of Terracraft overwhelmed you.';
    // Discovery journal counters (see scoreBreakdown / logDiscovery).
    this.chestsOpened = 0;
    this.questsDone = 0;
    this.villagersMet = {};
    this.fishCaught = 0;
    this.fishingSkill = 0;
    this.discoveryPoints = 0;
    this.discoveryLog = [];
    this.attackCooldown = 0;    // gates weapon use time
    this.eliteChance = 0.09;    // night-time elite promotion chance

    // ---- Shared inventory ----
    // Terraria's piggy bank, and the single biggest quality-of-life difference
    // between a 15-minute session and a 3-hour one: a small bag that is NOT in
    // your inventory carries across every world.
    this.savedInventory = [];   // Ctrl+click an item here to keep it
    this.savedDirty = false;    // persists at most once a second, not per click
    this.loadSharedInventory();

    // ---- Chest storage ----
    // A chest is world furniture, not bag space: every chest keeps its own 18
    // slots keyed by the tile it occupies, so the contents follow the chest
    // (and the world save) instead of the player. openChest points at the
    // panel currently on screen, or null when it is shut.
    this.chestStorage = {};
    this.openChest = null;

    // Which bag slot the favourite/delete controls are acting on (Shift+click).
    // Null means "nothing selected", which is the state the buttons render in.
    this.selectedSlotIndex = null;

    // Input state
    this.input = {
      keys: {},
      mouseX: 0,
      mouseY: 0,
      mouseDown: false,
      mouseRightDown: false,
      keybinds: this.settings.keybinds
    };

    // ---- Control scheme -------------------------------------------------
    // 'pc' = keyboard + mouse, 'touch' = the on-screen pad, null = the player
    // has not been asked yet. The title screen answers this BEFORE it shows the
    // menu. Kept deliberately out of this.settings: settings are per-world
    // tuning the player adjusts in game, this is a per-device fact about the
    // hardware, and mixing them would put "are you on a phone?" into save files.
    this.platform = null;
    // Both of these are read by refreshTouchControls, which loadControlScheme()
    // calls further down the constructor - before paused is set and before
    // initTitleScreen() runs. Left undefined they would be falsy-but-accidental,
    // so the pad could be armed for one frame before the title screen covers it.
    this.titleScreenOpen = true;
    this.isDead = false;
    // Which virtual keys the pad is currently holding, so it can let go of all
    // of them at once when it goes away (see releaseTouchInput).
    this._touchHeld = new Set();
    this._touchActions = new Set();
    this._touchControlsShown = false;
    // The pointer id that owns the aim, or null. Only one finger aims at a time.
    this._touchAimPointer = null;

    // Timers & spawning
    this.spawnTimer = 1.5;
    this.critterTimer = 0;
    this.campfireToastTimer = 0;
    this.lavaDamageTimer = 0;
    this.bedCooldown = 0; // seconds left before the bed can skip night again
    this.altarNagTimer = 0; // throttles the "a boss already hunts you" toast
    this.respawnPoint = null;   // sleep-bound respawn {kind:'bed', bedX, bedY, x, y}
    this.bossDaysDone = [];     // auto-summoned forest boss days (7 and 20)
    // ---- Space dimension: the Void Rift and the Ossuary Sovereign ----
    this.wormhole = null;        // live WormholeFX while a rift is open
    this.wormholeIntent = null;  // 'space' | 'overworld': what the collapse does
    this.riftUses = 0;           // rifts opened so far — later ones tear in faster
    this.dragonHP = null;        // Sovereign's damaged HP, kept across a death/retreat
    // True once the Sovereign has been killed. A dead dragon STAYS dead: walking
    // back into the Ossuary is a trip to a quarry, and only a Rite of Waking can
    // raise another. This flag is what stops a cleared arena from re-arming a
    // fight the player has already won.
    this.dragonSlain = false;
    // Rites of Waking this save has crafted. Zero = the first one is still ahead
    // of you and it prices cheap; one or more = every further rite is priced as
    // a deliberate, expensive return trip to the hardest fight in the game.
    this.ritesCrafted = 0;
    // How many Sovereigns this save has felled, ever. `dragonSlain` is NOT this
    // counter — wakeSovereign clears it every time a new dragon is raised, so it
    // is false during the second fight just as it is during the first. The
    // "only the first kill drops the plate and the wings" rule needs a fact that
    // survives being re-armed, so it gets its own counter.
    this.dragonKills = 0;
    // The Sovereign's death show (space.js DragonFinale) and the victory
    // screen it holds back — both exist only for the seconds after the kill.
    this.dragonFinale = null;
    this.victoryDelay = 0;
    this.riftReturnDelay = 0;    // beats until a post-death re-entry fires
    // Seconds of "you were just hit" during which no regeneration runs.
    this.regenLock = 0;
    this._wingsLocked = false;   // so the wings-recharged toast fires once
    this.bedNagTimer = 0; // throttles "can't sleep" toasts while mouse is held
    this.nightAnnounced = false;
    this.lastTime = performance.now();
    // Frame pacing: the loop only *exhibits* frames once both halves of the
    // update/render pair have finished, which is what makes the quality
    // controller measure real work instead of requestAnimationFrame's own
    // clamped timing.
    this._fpsCount = 0;
    this._fpsAccum = 0;
    this._fpsPeak = 0;
    this.worstFrameMs = 0;
    this.fps = 60;
    this.running = true;

    this.initWindow();
    this.initInput();
    this.initUI();
    // Arms the touch pad's listeners and reads the remembered platform answer,
    // which initTitleScreen then uses to decide what it shows FIRST.
    this.initTouchControls();
    this.loadControlScheme();
    this.particles.initAmbientLeaves(this.world.pixelWidth, this.world.pixelHeight);

    this.loadGame(true);

    this.paused = true;
    this.initTitleScreen();

    // Welcome toast
    this.showToast('🌲 Welcome to Terracraft! Chop wood & craft weapons.');

    // Start loop
    requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Main menu. Terraria's title screen is a living scene rather than a static
   * backdrop, so this draws one: a full day/night cycle with the sun and moon
   * crossing the sky, drifting clouds, parallax ridges, trees that sway, a pond
   * catching the light, fireflies after dark and the odd passing bird. It also
   * owns the menu / world-select / credits panels and the splash line.
   */
  initTitleScreen() {
    const screen = document.getElementById('title-screen');
    const scene = document.getElementById('title-scene');
    if (!screen || !scene) return;

    // Built exactly once. Returning to the title from inside a session re-shows
    // the screen (see showTitleScreen) rather than rebuilding it: re-running this
    // would attach a SECOND set of listeners to every menu button, and start a
    // SECOND splash animation loop on top of the one already running.
    if (this._titleScreenBuilt) {
      this._titleScreenScreen = screen;
      return;
    }
    this._titleScreenBuilt = true;
    this._titleScreenScreen = screen;

    const context = scene.getContext('2d');
    if (!context) return;

    const splash = document.getElementById('title-splash');
    const menu = document.getElementById('title-menu');
    const worlds = document.getElementById('title-worlds');
    const credits = document.getElementById('title-credits');
    const mpPanel = document.getElementById('title-multiplayer-panel');
    // The platform question, which owns the very first thing the screen shows.
    const platform = document.getElementById('title-platform');
    this.titleScreenOpen = true;
    this.titlePanel = this.platform ? 'menu' : 'platform';

    // ---- Splash line ---------------------------------------------------
    // Minecraft and Terraria both rotate a yellow blurb beside the logo. One
    // entry is deliberately rare so pulling it feels like something happened.
    const rareSplash = 'Shoutout to Terraria!';
    const splashes = [
      'A little world, a big adventure!',
      'Watch the skies for falling stars!',
      'Home is where the campfire is.',
      'Made with dirt and determination!',
      'Somewhere, a slime is bouncing.',
      'Your next favorite tree is waiting.',
      'Adventure grows on trees. Sort of.',
      'Dig down - the good stuff is below.',
      'Three worlds, one hero.',
      'Now with 100% more parallax.',
      'Chop wood, craft weapons, survive the night!',
      'The guide believes in you.',
      'Rain washes in, monsters wander out.',
      'Bring a torch. Bring two.',
      'No creepers here. Just slimes.',
      'Terraria would be proud.',
      'Sit back. Enjoy the view.',
      'Sword in one hand, pickaxe in the other.'
    ];
    let lastSplash = performance.now();
    const rollSplash = (first = false) => {
      if (!splash) return;
      const rare = Math.random() < (first ? 0.12 : 0.1);
      splash.textContent = rare
        ? rareSplash
        : splashes[Math.floor(Math.random() * splashes.length)];
      splash.classList.toggle('title-splash-rare', rare);
      // Restart the pop so a freshly rolled line announces itself.
      splash.classList.remove('splash-pop');
      void splash.offsetWidth;
      splash.classList.add('splash-pop');
    };

    // ---- Scene data ----------------------------------------------------
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 320,
        y: Math.random() * 104,
        big: Math.random() < 0.18,
        phase: Math.random() * Math.PI * 2
      });
    }
    const clouds = [
      { x: 14, y: 30, scale: 1.15, speed: 3.2 },
      { x: 148, y: 17, scale: 0.82, speed: 2.1 },
      { x: 252, y: 51, scale: 0.66, speed: 4.0 },
      { x: 92, y: 63, scale: 0.50, speed: 2.6 },
      { x: 300, y: 24, scale: 0.95, speed: 1.7 }
    ];
    const fireflies = [];
    for (let i = 0; i < 18; i++) {
      fireflies.push({
        x: Math.random() * 320,
        y: 132 + Math.random() * 34,
        phase: Math.random() * Math.PI * 2,
        drift: 6 + Math.random() * 12
      });
    }
    const birds = [];
    let nextBird = 1500;
    let shootingStar = null;
    let nextShootingStar = 5000;
    let prevTime = performance.now();

    // One full cycle of the menu sky (sunrise -> noon -> sunset -> night).
    const DAY_MS = 104000;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const wrapPos = (v, span) => (((v % span) + span) % span);
    const mixRGB = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
    const css = (c) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

    // Three anchor palettes: deep night, golden hour, full day. Everything on
    // screen is a blend of two of them, so the whole scene shifts together.
    const NIGHT = {
      skyTop: [7, 13, 40], skyMid: [22, 36, 82], skyBot: [44, 62, 104],
      far: [26, 40, 70], near: [20, 46, 60], hill: [17, 52, 46],
      grass: [16, 58, 45], deep: [10, 34, 30], water: [18, 40, 64],
      leafA: [19, 47, 42], leafB: [25, 58, 50], trunk: [48, 36, 30]
    };
    const DUSK = {
      skyTop: [70, 58, 126], skyMid: [214, 118, 84], skyBot: [246, 194, 128],
      far: [120, 94, 120], near: [98, 98, 118], hill: [58, 72, 68],
      grass: [52, 74, 62], deep: [36, 48, 48], water: [112, 88, 100],
      leafA: [54, 70, 62], leafB: [68, 84, 72], trunk: [86, 64, 52]
    };
    const DAY = {
      skyTop: [46, 103, 223], skyMid: [101, 185, 240], skyBot: [182, 225, 200],
      far: [108, 159, 194], near: [77, 156, 154], hill: [55, 142, 107],
      grass: [52, 146, 108], deep: [39, 111, 79], water: [44, 116, 176],
      leafA: [37, 131, 84], leafB: [46, 145, 90], trunk: [104, 74, 50]
    };
    const KEYS = Object.keys(DAY);
    const blendPalette = (day) => {
      const from = day < 0.5 ? NIGHT : DUSK;
      const to = day < 0.5 ? DUSK : DAY;
      const t = day < 0.5 ? day * 2 : (day - 0.5) * 2;
      const out = {};
      for (const key of KEYS) out[key] = mixRGB(from[key], to[key], t);
      return out;
    };

    const resize = () => {
      scene.width = Math.max(320, Math.round(window.innerWidth / 2));
      scene.height = Math.max(180, Math.round(window.innerHeight / 2));
    };
    resize();
    window.addEventListener('resize', resize);

    const drawCloud = (x, y, scale, body, shade) => {
      context.fillStyle = body;
      context.fillRect(x, y + 3 * scale, 24 * scale, 5 * scale);
      context.fillRect(x + 5 * scale, y, 12 * scale, 8 * scale);
      context.fillRect(x + 15 * scale, y + 2 * scale, 12 * scale, 6 * scale);
      context.fillStyle = shade;
      context.fillRect(x + 3 * scale, y + 7 * scale, 21 * scale, 2 * scale);
    };

    const drawTree = (x, ground, scale, leafA, leafB, trunk) => {
      const trunkHi = mixRGB(trunk, [232, 204, 166], 0.35);
      context.fillStyle = trunk;
      context.fillRect(x - 2 * scale, ground - 24 * scale, 5 * scale, 25 * scale);
      context.fillStyle = css(trunkHi);
      context.fillRect(x - scale, ground - 23 * scale, scale, 20 * scale);
      context.fillStyle = leafA;
      context.fillRect(x - 10 * scale, ground - 35 * scale, 20 * scale, 15 * scale);
      context.fillRect(x - 7 * scale, ground - 40 * scale, 14 * scale, 8 * scale);
      context.fillRect(x - 14 * scale, ground - 32 * scale, 7 * scale, 9 * scale);
      context.fillRect(x + 7 * scale, ground - 31 * scale, 7 * scale, 8 * scale);
      context.fillStyle = leafB;
      context.fillRect(x - 6 * scale, ground - 36 * scale, 4 * scale, 4 * scale);
      context.fillRect(x + 4 * scale, ground - 30 * scale, 4 * scale, 4 * scale);
    };

    const mountains = [
      [[-25, 118], [34, 62], [75, 118], [124, 72], [185, 124], [248, 64], [345, 125]],
      [[-20, 134], [47, 88], [95, 135], [157, 86], [218, 136], [278, 92], [345, 142]]
    ];

    const draw = (time) => {
      // The loop must stay scheduled even while a world is being played: it was
      // previously `return`ed out of when the player entered a world, which
      // killed the animation for good and left the menu background showing the
      // frozen game canvas when they came back. Now it keeps ticking and simply
      // skips the painting until the title screen is on top again.
      if (!this.titleScreenOpen) {
        prevTime = time;
        requestAnimationFrame(draw);
        return;
      }
      const width = 320;
      const height = 180;
      const dt = Math.min(0.1, Math.max(0, (time - prevTime) / 1000));
      prevTime = time;
      context.setTransform(scene.width / width, 0, 0, scene.height / height, 0, 0);
      context.imageSmoothingEnabled = false;

      // ---- sky ---------------------------------------------------------
      const cycle = (time % DAY_MS) / DAY_MS;   // 0 = sunrise, .5 = sunset
      const sunAngle = cycle * Math.PI * 2;   // 0 = sunrise, .5 = sunset
      const light = Math.sin(sunAngle);          // -1 midnight .. 1 noon
      const day = clamp01((light + 0.28) / 0.56);
      const night = 1 - day;
      const P = blendPalette(day);

      const sky = context.createLinearGradient(0, 0, 0, height * 0.8);
      sky.addColorStop(0, css(P.skyTop));
      sky.addColorStop(0.55, css(P.skyMid));
      sky.addColorStop(1, css(P.skyBot));
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      const sunX = 160 + Math.cos(sunAngle - Math.PI) * 152;
      const sunY = 116 - light * 100;

      // ---- stars + the occasional shooting star ------------------------
      if (night > 0.06) {
        for (const star of stars) {
          const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(time * 0.002 + star.phase));
          context.fillStyle = 'rgba(255,252,226,' + (night * twinkle).toFixed(3) + ')';
          const size = star.big ? 2 : 1;
          context.fillRect(Math.round(star.x), Math.round(star.y), size, size);
        }
        if (night > 0.45) {
          if (!shootingStar && time > nextShootingStar) {
            shootingStar = {
              x: 40 + Math.random() * 230,
              y: 8 + Math.random() * 44,
              born: time
            };
            nextShootingStar = time + 7000 + Math.random() * 9000;
          }
          if (shootingStar) {
            const t = (time - shootingStar.born) / 750;
            if (t >= 1) {
              shootingStar = null;
            } else {
              const sx = shootingStar.x + t * 62;
              const sy = shootingStar.y + t * 34;
              const streak = context.createLinearGradient(sx - 26, sy - 15, sx, sy);
              streak.addColorStop(0, 'rgba(255,255,255,0)');
              streak.addColorStop(1, 'rgba(255,255,240,' + (night * (1 - t)).toFixed(3) + ')');
              context.strokeStyle = streak;
              context.lineWidth = 2;
              context.beginPath();
              context.moveTo(sx - 26, sy - 15);
              context.lineTo(sx, sy);
              context.stroke();
            }
          }
        } else {
          shootingStar = null;
        }
      }

      // ---- sun ---------------------------------------------------------
      if (sunY > -40 && sunY < 150) {
        const glow = context.createRadialGradient(sunX, sunY, 2, sunX, sunY, 36);
        glow.addColorStop(0, 'rgba(255,247,190,.95)');
        glow.addColorStop(0.3, 'rgba(255,233,140,.5)');
        glow.addColorStop(1, 'rgba(255,220,120,0)');
        context.fillStyle = glow;
        context.fillRect(sunX - 38, sunY - 38, 76, 76);
        const sx = Math.round(sunX);
        const sy = Math.round(sunY);
        context.fillStyle = '#fff6b8';
        context.fillRect(sx - 6, sy - 6, 12, 12);
        context.fillStyle = '#fffde8';
        context.fillRect(sx - 3, sy - 3, 6, 6);
      }

      // ---- moon --------------------------------------------------------
      const moonAngle = sunAngle + Math.PI;
      const moonX = 160 + Math.cos(moonAngle - Math.PI) * 152;
      const moonY = 116 - Math.sin(moonAngle) * 100;
      if (moonY > -40 && moonY < 150) {
        const glow = context.createRadialGradient(moonX, moonY, 2, moonX, moonY, 28);
        glow.addColorStop(0, 'rgba(226,240,255,.8)');
        glow.addColorStop(1, 'rgba(200,224,255,0)');
        context.fillStyle = glow;
        context.fillRect(moonX - 30, moonY - 30, 60, 60);
        const mx = Math.round(moonX);
        const my = Math.round(moonY);
        context.fillStyle = '#eef4ff';
        context.fillRect(mx - 6, my - 6, 12, 12);
        context.fillStyle = '#c6d4ea';
        context.fillRect(mx - 4, my - 3, 3, 3);
        context.fillRect(mx + 1, my + 1, 3, 3);
        context.fillRect(mx - 1, my + 3, 2, 2);
      }

      // ---- clouds ------------------------------------------------------
      const cloudBody = css(mixRGB([255, 255, 255], [54, 64, 102], night));
      const cloudShade = css(mixRGB([189, 231, 255], [36, 44, 78], night));
      const wrap = width + 80;
      for (const cloud of clouds) {
        const cx = wrapPos(cloud.x + time * 0.001 * cloud.speed, wrap) - 40;
        drawCloud(cx, cloud.y, cloud.scale, cloudBody, cloudShade);
      }

      // ---- birds (day only) -------------------------------------------
      if (day > 0.55) {
        if (time > nextBird) {
          birds.push({
            x: -14,
            y: 20 + Math.random() * 48,
            speed: 13 + Math.random() * 10,
            flap: Math.random() * 6
          });
          nextBird = time + 3200 + Math.random() * 4200;
        }
        for (let i = birds.length - 1; i >= 0; i--) {
          const bird = birds[i];
          bird.x += bird.speed * dt;
          if (bird.x > width + 20) { birds.splice(i, 1); continue; }
          const lift = Math.sin(time * 0.012 + bird.flap) * 3;
          context.strokeStyle = 'rgba(24,34,46,' + (0.7 * day).toFixed(3) + ')';
          context.lineWidth = 1.5;
          context.beginPath();
          context.moveTo(bird.x - 5, bird.y + lift);
          context.lineTo(bird.x, bird.y);
          context.lineTo(bird.x + 5, bird.y + lift);
          context.stroke();
        }
      }

      // ---- mountains ---------------------------------------------------
      for (let layer = 0; layer < mountains.length; layer++) {
        context.beginPath();
        context.moveTo(-30, height);
        for (const point of mountains[layer]) context.lineTo(point[0], point[1]);
        context.lineTo(width + 30, height);
        context.closePath();
        context.fillStyle = css(layer === 0 ? P.far : P.near);
        context.fill();
      }
      if (day > 0.3) {
        context.fillStyle = 'rgba(255,255,255,' + (((day - 0.3) / 0.7) * 0.9).toFixed(3) + ')';
        for (const point of mountains[0]) {
          if (point[1] > 90) continue;
          context.beginPath();
          context.moveTo(point[0] - 9, point[1] + 12);
          context.lineTo(point[0], point[1]);
          context.lineTo(point[0] + 9, point[1] + 12);
          context.closePath();
          context.fill();
        }
      }

      // ---- rolling hills ------------------------------------------------
      const hillShade = css(mixRGB(P.hill, P.deep, 0.4));
      for (let x = 0; x < width; x += 3) {
        const ridge = 124 + Math.sin(x * 0.031) * 10 + Math.sin(x * 0.087) * 4;
        context.fillStyle = (x % 6) ? css(P.hill) : hillShade;
        context.fillRect(x, ridge, 3, height - ridge);
      }
      for (let x = -8; x < width + 20; x += 27) {
        const ridge = 133 + Math.sin(x * 0.031) * 10 + Math.sin(x * 0.087) * 4;
        const sway = Math.sin(time * 0.0012 + x * 0.4) * 1.6;
        drawTree(x + 10 + sway, ridge + 9, 0.8 + (x % 3) * 0.08, css(P.leafA), css(P.leafB), css(P.trunk));
      }

      // ---- dark forest band + foreground grass --------------------------
      const forest = css(mixRGB(P.deep, [0, 0, 0], 0.4));
      for (let x = 0; x < width; x += 3) {
        const edge = 150 + Math.sin(x * 0.06) * 3;
        context.fillStyle = forest;
        context.fillRect(x, edge, 3, height - edge);
      }
      context.fillStyle = css(P.grass);
      context.fillRect(0, 168, width, height - 168);
      context.fillStyle = css(mixRGB(P.grass, [255, 255, 255], 0.18));
      context.fillRect(0, 168, width, 2);

      // ---- pond ----------------------------------------------------------
      const lakeX = 196;
      const lakeY = 170;
      const lakeW = 118;
      const lakeH = height - lakeY;
      context.fillStyle = css(P.water);
      context.fillRect(lakeX, lakeY, lakeW, lakeH);
      context.fillStyle = css(mixRGB(P.water, [255, 255, 255], 0.22));
      context.fillRect(lakeX, lakeY, lakeW, 2);
      context.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.16 * day).toFixed(3) + ')';
      const shimmerSpan = lakeW - 40;
      for (let i = 0; i < 5; i++) {
        const sx = lakeX + 8 + wrapPos(i * 33 + time * 0.011 * (i % 2 ? 1 : -1), shimmerSpan);
        context.fillRect(Math.round(sx), lakeY + 4 + (i % 3) * 3, 13, 1);
      }

      // ---- foreground trees (kept clear of the water) --------------------
      const fgLeafA = css(mixRGB(P.leafA, P.deep, 0.45));
      const fgLeafB = css(mixRGB(P.leafB, P.deep, 0.35));
      const fgTrunk = css(mixRGB(P.trunk, P.deep, 0.3));
      for (let x = -12; x < width + 24; x += 41) {
        if (x > lakeX - 26 && x < lakeX + lakeW + 6) continue;
        const sway = Math.sin(time * 0.0009 + x * 0.3) * 1.2;
        drawTree(x + 14 + sway, 186, 1.35, fgLeafA, fgLeafB, fgTrunk);
      }

      // ---- torches -------------------------------------------------------
      const drawTorch = (x) => {
        context.fillStyle = '#6a4a30';
        context.fillRect(x, 158, 3, 14);
        context.fillStyle = '#8a6642';
        context.fillRect(x + 2, 158, 1, 14);
        const flick = 0.72 + Math.abs(Math.sin(time * 0.012 + x)) * 0.28;
        const strength = 0.35 + night * 0.65;
        const glow = context.createRadialGradient(x + 1, 155, 1, x + 1, 155, 20 * flick);
        glow.addColorStop(0, 'rgba(255,206,92,' + (0.75 * strength).toFixed(3) + ')');
        glow.addColorStop(1, 'rgba(255,150,40,0)');
        context.fillStyle = glow;
        context.fillRect(x - 22, 133, 46, 46);
        context.fillStyle = 'rgba(255,231,140,' + (0.9 * flick).toFixed(3) + ')';
        context.fillRect(x, 153, 3, 5);
        context.fillStyle = 'rgba(255,146,44,' + (0.85 * flick).toFixed(3) + ')';
        context.fillRect(x, 151, 3, 3);
      };
      drawTorch(24);
      drawTorch(168);

      // ---- fireflies (night only) ----------------------------------------
      if (night > 0.15) {
        for (const fly of fireflies) {
          const fx = Math.round(fly.x + Math.sin(time * 0.0007 + fly.phase) * fly.drift);
          const fy = Math.round(fly.y + Math.cos(time * 0.0009 + fly.phase * 1.7) * 5);
          const pulse = (Math.sin(time * 0.004 + fly.phase * 3) + 1) * 0.5;
          context.fillStyle = 'rgba(255,240,130,' + (night * pulse * 0.4).toFixed(3) + ')';
          context.fillRect(fx - 1, fy - 1, 4, 4);
          context.fillStyle = 'rgba(255,244,150,' + (night * (0.25 + pulse * 0.75)).toFixed(3) + ')';
          context.fillRect(fx, fy, 2, 2);
        }
      }

      if (splash && time - lastSplash > 8000) {
        lastSplash = time;
        rollSplash();
      }
      requestAnimationFrame(draw);
    };

    rollSplash(true);
    requestAnimationFrame(draw);

    // ---- panels ---------------------------------------------------------
    const enterWorld = () => {
      if (!this.titleScreenOpen) return;
      this.titleScreenOpen = false;
      this.paused = false;
      screen.classList.add('title-screen-leaving');
      setTimeout(() => screen.classList.add('hidden'), 500);
    };
    const pickWorld = (slot) => {
      if (this.startTitleWorld(slot)) enterWorld();
    };
    const showPanel = (name) => {
      this.titlePanel = name;
      menu.hidden = name !== 'menu';
      if (worlds) worlds.hidden = name !== 'worlds';
      credits.hidden = name !== 'credits';
      if (platform) platform.hidden = name !== 'platform';
      if (mpPanel) mpPanel.hidden = name !== 'multiplayer';
      if (name === 'worlds') this.renderTitleWorlds(pickWorld);
      if (name === 'multiplayer') { this.initMultiplayerPanel(); this.syncMultiplayerPanel(); }
      // Hand focus to whatever is now on top, so keyboard players are never
      // stranded on a button that just disappeared.
      const target = name === 'worlds'
        ? document.querySelector('#title-world-list .title-world-card')
        : name === 'credits'
          ? document.getElementById('title-credits-back')
          : name === 'multiplayer'
            ? (document.getElementById('mp-name') || document.getElementById('title-multiplayer-back'))
            : name === 'platform'
              ? document.getElementById('title-platform-pc')
              : document.getElementById('title-singleplayer');
      if (target && target.focus) {
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      }
    };

    // ---- The platform question ------------------------------------------
    // A coarse pointer with no fine one is a phone or a tablet, so pre-flag the
    // answer that is almost certainly right. It is a hint, not a decision: both
    // buttons behave identically and the answer is what the player clicks.
    const coarseOnly = (() => {
      try {
        if (typeof window.matchMedia !== 'function') return false;
        return window.matchMedia('(pointer: coarse)').matches &&
          !window.matchMedia('(pointer: fine)').matches;
      } catch (_) { return false; }
    })();
    const pcBadge = document.getElementById('title-platform-pc-badge');
    const mobileBadge = document.getElementById('title-platform-mobile-badge');
    if (pcBadge) pcBadge.hidden = coarseOnly;
    if (mobileBadge) mobileBadge.hidden = !coarseOnly;

    const pickScheme = (mode) => (event) => {
      event?.stopPropagation?.();
      // This tap is very often the FIRST user gesture on a phone, and an
      // AudioContext can only be built inside one - so unlock here or the game
      // stays silent until the player happens to find a keyboard.
      this.sound.init();
      this.setControlScheme(mode);
    };
    document.getElementById('title-platform-pc')?.addEventListener('click', pickScheme('pc'));
    document.getElementById('title-platform-mobile')?.addEventListener('click', pickScheme('touch'));
    // The corner chip: the way back to the question once it has been answered.
    document.getElementById('title-controls-chip')?.addEventListener('click', (event) => {
      event?.stopPropagation?.();
      showPanel('platform');
    });

    document.getElementById('title-singleplayer')?.addEventListener('click', () => showPanel('worlds'));
    document.getElementById('title-multiplayer')?.addEventListener('click', () => showPanel('multiplayer'));
    document.getElementById('title-credits-button')?.addEventListener('click', () => showPanel('credits'));
    document.getElementById('title-worlds-back')?.addEventListener('click', () => showPanel('menu'));
    document.getElementById('title-credits-back')?.addEventListener('click', () => showPanel('menu'));
    this.initMultiplayerPanel();

    // The menu owns the keyboard. stopPropagation keeps every one of these
    // keypresses away from the game's own handlers running underneath, and a
    // focus stop on the section itself covers the case where focus has not
    // landed on a button yet (the very first arrow keypress, for instance).
    const onKey = (event) => {
      event.stopPropagation();
      if (!this.titleScreenOpen) return;
      // The platform question has to be answered before anything else: there is
      // no menu behind it to fall back on, and backing out would leave the game
      // with no control scheme at all.
      if (this.titlePanel === 'platform') {
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        if (this.titlePanel !== 'menu') {
          event.preventDefault();
          showPanel('menu');
        }
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const focusables = [];
      for (const el of screen.querySelectorAll('button')) {
        if (!el.disabled && el.offsetParent !== null) focusables.push(el);
      }
      if (!focusables.length) return;
      const current = focusables.indexOf(document.activeElement);
      const next = event.key === 'ArrowDown'
        ? (current + 1 + focusables.length) % focusables.length
        : (current <= 0 ? focusables.length - 1 : current - 1);
      try { focusables[next].focus({ preventScroll: true }); } catch (_) { focusables[next].focus(); }
      event.preventDefault();
    };
    screen.addEventListener('keydown', onKey);

    // Without focus on the section itself the first keypress lands on <body>
    // and never reaches the listener above.
    try { screen.focus({ preventScroll: true }); } catch (_) { try { screen.focus(); } catch (__) {} }

    // Kept so returning to the title from a session can put the menu back the
    // way it was found, without rebuilding any of the above.
    this._titleShowPanel = showPanel;
    this._titleEnterWorld = enterWorld;
    // Open on the question when it has never been answered, otherwise straight
    // on the menu. showTitleScreen always opens on 'menu': coming back mid-
    // session is not a reason to interrogate the player again.
    showPanel(this.platform ? 'menu' : 'platform');
    this.syncControlSchemeLabels();
  }

  /**
   * Put the title screen back on top of a live game.
   *
   * This is the in-session half of what booting the page does. The screen was
   * built once at boot and its animation loop is still running, so all this has
   * to do is un-hide it, pause the simulation underneath, and reset the panel to
   * the top-level menu — otherwise the player lands back on whatever panel they
   * happened to leave.
   */
  showTitleScreen() {
    const screen = this._titleScreenScreen || document.getElementById('title-screen');
    if (!screen) return false;
    // Close anything that was open over the top, or the menu shows through a
    // settings panel or a death screen.
    this.togglePause(false);
    for (const id of ['settings-modal', 'crafting-modal', 'inventory-modal',
      'chest-modal', 'journal-modal', 'npc-modal', 'creative-modal',
      'guide-modal', 'save-manager']) {
      document.getElementById(id)?.classList.add('hidden');
    }
    document.getElementById('death-screen')?.classList.add('hidden');
    document.getElementById('victory-screen')?.classList.add('hidden');

    this.titleScreenOpen = true;
    this.paused = true;
    // Drop any key still held from the moment the menu was opened, or walking
    // with W held and then resuming sends the player off in that direction.
    this.input.keys = {};
    this.input.mouseDown = false;
    this.input.mouseRightDown = false;
    // Put the touch pad away as well, and let go of anything it was holding.
    this.releaseTouchInput();
    this.refreshTouchControls();
    // The "leaving" class was added on the way out and never taken back off, so
    // without this the screen would fade itself straight out again.
    screen.classList.remove('hidden', 'title-screen-leaving');
    if (this._titleShowPanel) this._titleShowPanel('menu');
    try { screen.focus({ preventScroll: true }); } catch (_) { /* not focusable */ }
    return true;
  }

  /**
   * Save the world and drop back to the main menu.
   *
   * Saving first is the whole point: this is the difference between "switch
   * world from in-game" and "lose your afternoon because you closed the tab".
   * Picking the SAME world afterwards resumes instantly with everything still
   * live; picking a different one reloads onto that slot, which is unavoidable
   * because the world is built once in the constructor.
   */
  returnToMainMenu() {
    if (this.isDead) {
      this.showToast('💀 Respawn before leaving — the run is not over yet.');
      return false;
    }
    // A hosted world cannot be hosted from the menu (the simulation pauses
    // there), so leaving ends the session. Guests are told and fall back to
    // single-player on the copy of the world they were just playing.
    if (this.mp && this.mp.isHost) {
      this.mp.disconnect('The host returned to the main menu.');
    }
    try { this.saveGame(true); } catch (_) { /* saveGame reports its own failure */ }
    this.showTitleScreen();
    return true;
  }

  /** Where the answer to "how are you playing?" is remembered. */
  get controlSchemeKey() { return 'terracraft-controls'; }

  /**
   * Read the remembered platform answer.
   *
   * Returns 'pc', 'touch', or null when the player has never been asked — which
   * is exactly the state that makes initTitleScreen open on the question
   * instead of the menu.
   */
  loadControlScheme() {
    let saved = null;
    try { saved = localStorage.getItem(this.controlSchemeKey); } catch (_) { /* blocked storage */ }
    this.platform = saved === 'pc' || saved === 'touch' ? saved : null;
    this.applyControlScheme({ silent: true });
    return this.platform;
  }

  /**
   * Put the chosen control scheme into force.
   *
   * Everything downstream keys off a single class on <body>: the stylesheet
   * shrinks the HUD and reveals the pad under `body.controls-touch`, and
   * nothing else has to know which mode is live. The main menu is a sibling of
   * #ui-layer, so it cannot be caught by any of those rules.
   */
  applyControlScheme({ silent = true } = {}) {
    const touch = this.platform === 'touch';
    if (document.body) {
      document.body.classList.toggle('controls-touch', touch);
      document.body.classList.toggle('controls-pc', this.platform === 'pc');
    }
    // A finger that was down while the scheme changed must not stay down.
    this.releaseTouchInput();
    this.refreshTouchControls();
    this.syncControlSchemeLabels();
    if (!silent) {
      this.showToast(touch
        ? '📱 Touch controls on — tap the world to aim.'
        : '🖥️ Keyboard & mouse controls on.');
    }
    return touch;
  }

  /**
   * Remember and apply a new answer.
   *
   * Called from the title-screen chooser, the corner chip and the Settings row,
   * so all three routes land in the same place. Picking from the title screen
   * also drops the player in front of the menu, so the question is never a
   * dead end they have to back out of.
   */
  setControlScheme(mode, { silent = false } = {}) {
    if (mode !== 'pc' && mode !== 'touch') return false;
    const changed = this.platform !== mode;
    this.platform = mode;
    try { localStorage.setItem(this.controlSchemeKey, mode); } catch (_) { /* blocked storage */ }
    this.applyControlScheme({ silent: silent || !changed });
    if (this.titleScreenOpen && this._titleShowPanel) this._titleShowPanel('menu');
    return true;
  }

  /** Keep the title-screen chip and the Settings row telling the same story. */
  syncControlSchemeLabels() {
    const who = !this.platform ? 'not set' : this.platform === 'touch' ? 'Mobile' : 'PC / Laptop';
    const label = document.getElementById('title-controls-chip-label');
    if (label) {
      label.textContent = 'Controls: ' + (!this.platform
        ? 'Not set'
        : this.platform === 'touch' ? 'Mobile' : 'Keyboard');
    }
    const icon = document.getElementById('title-controls-chip-icon');
    if (icon) icon.textContent = this.platform === 'touch' ? '📱' : '🎮';
    const chip = document.getElementById('title-controls-chip');
    if (chip) chip.title = 'Change the control scheme (currently ' + who + ')';
    const select = document.getElementById('settings-controls');
    if (select && this.platform) select.value = this.platform;
  }

  /**
   * Show or hide the on-screen pad.
   *
   * Run every frame from the main loop rather than from a dozen call sites:
   * pausing, dying, opening a modal, walking into the world and returning to
   * the main menu all change the answer, and one place that recomputes it
   * cannot drift out of step with any of them.
   *
   * The DOM is only touched when the answer actually changes, which also makes
   * this cheap enough to call 60 times a second.
   */
  refreshTouchControls() {
    const layer = this._mobileControls;
    if (!layer) return;
    // Keep the stylesheet's view of the mode in step with this.platform. The
    // CSS trusts `body.controls-touch` for both the smaller HUD and the pad's
    // visibility, so if the two ever disagreed the pad could be armed over a
    // screen that owns input. Cheap enough to re-assert every frame.
    if (document.body) {
      document.body.classList.toggle('controls-touch', this.platform === 'touch');
      document.body.classList.toggle('controls-pc', this.platform === 'pc');
    }
    const wanted = this.platform === 'touch' && !this.paused && !this.titleScreenOpen &&
      !this.isDead && !this.isModalOpen();
    if (wanted === this._touchControlsShown) return;
    this._touchControlsShown = wanted;
    layer.classList.toggle('hidden', !wanted);
    // Hiding the pad while a thumb is down would strand whatever it was
    // holding, which is how you end up with a player who walks forever.
    if (!wanted) this.releaseTouchInput();
  }

  /** Let go of every virtual key and mouse button the pad is holding. */
  releaseTouchInput() {
    for (const code of this._touchHeld) delete this.input.keys[code];
    this._touchHeld.clear();
    for (const btn of this._touchActions) {
      if (btn && btn.classList) btn.classList.remove('is-down');
    }
    this._touchActions.clear();
    this.input.mouseDown = false;
    this.input.mouseRightDown = false;
    this._touchAimPointer = null;
  }

  /**
   * Press or release one virtual key.
   *
   * The pad writes into the same `input.keys` map the keyboard fills, so
   * movement, wall-sliding, wall-kicks, wing flight and drop-through all work
   * without a single line of touch-specific physics.
   *
   * Jump, dodge and the fishing reel are different: they only exist as edge
   * triggers inside the keyboard handler, and a button is not a key, so those
   * three are mirrored here. They fire once per press, for the same reason the
   * real ones ignore OS key-repeat.
   */
  setTouchKey(code, down) {
    if (!code) return;
    if (!down) {
      this._touchHeld.delete(code);
      delete this.input.keys[code];
      return;
    }
    this._touchHeld.add(code);
    this.input.keys[code] = true;
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      this.player.queueJump(this.sound, this.particles);
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      this.player.dodge(this.sound, this.particles);
    } else if (code === 'Escape') {
      this.togglePause();
    } else if (code === 'KeyH') {
      this.quickHeal();
    } else if (code === 'KeyQ') {
      this.quickBuff();
    } else if (code === 'KeyT') {
      if (this.npcs) this.npcs.handleTalkKey();
    } else if (code === 'KeyA' || code === 'KeyD') {
      // Reels in a cast line. The keyboard raises this on keydown of the
      // movement keys, so the pad has to as well or fishing is unreachable.
      this.onFishingKey();
    }
  }

  /**
   * Press or release one virtual mouse button.
   *
   * Matches the real mouse exactly: left fires once on press and then auto-
   * swings while held (the update loop re-runs handleLeftClick for as long as
   * input.mouseDown is set); right fires once on press, as a mouse does.
   */
  setTouchAction(button, down) {
    const left = button === 'left';
    if (down) {
      this.input.mouseDown = !!left;
      this.input.mouseRightDown = !left;
      if (left) this.handleLeftClick();
      else this.handleRightClick();
      return;
    }
    if (left) this.input.mouseDown = false;
    else this.input.mouseRightDown = false;
  }

  /**
   * A fingertip is roughly ten times less precise than a mouse, so the aim
   * point is nudged onto a monster standing right next to it — about one tile
   * of forgiveness. Deliberately a snap onto what is ALREADY aimed at, not an
   * auto-aim: mining a specific block has to stay exact, and a crosshair that
   * wanders off to the nearest zombie makes that impossible.
   */
  snapTouchAim() {
    if (this.platform !== 'touch') return;
    // Only while swinging. The whole point of the forgiveness is to make
    // COMBAT land; snapping while a pickaxe is in hand would drag the aim off
    // the exact tile the player was tapping at, which is the one case that has
    // to stay pixel-precise. Ranged and magic still snap - the projectile goes
    // where the finger points either way.
    const held = this.inventory[this.player.selectedSlot];
    const itemData = held ? ITEMS[held.id] : null;
    if (!itemData || itemData.type !== 'weapon') return;
    const aimX = this.input.mouseX + this.camera.x;
    const aimY = this.input.mouseY + this.camera.y;
    const SNAP = 40;   // px: just over one tile
    let bestX = 0, bestY = 0, bestD = SNAP;
    const consider = (target) => {
      if (!target || target.dead) return;
      const cx = target.x + (target.width || 0) / 2;
      const cy = target.y + (target.height || 0) / 2;
      const d = Math.hypot(cx - aimX, cy - aimY);
      if (d < bestD) { bestD = d; bestX = cx; bestY = cy; }
    };
    for (const m of (this.monsters || [])) consider(m);
    consider(this.boss);
    if (bestD < SNAP) {
      this.input.mouseX = bestX - this.camera.x;
      this.input.mouseY = bestY - this.camera.y;
    }
  }

  /**
   * Wire the on-screen pad.
   *
   * Every button carries either `data-code` (a key to hold) or `data-action`
   * (a mouse button), so the pad can be re-arranged in the markup without
   * touching this method at all.
   */
  initTouchControls() {
    const layer = document.getElementById('mobile-controls');
    if (!layer) return;
    this._mobileControls = layer;
    const buttons = layer.querySelectorAll ? layer.querySelectorAll('.touch-btn') : [];
    for (const btn of buttons) {
      const code = btn.dataset ? btn.dataset.code : null;
      const action = btn.dataset ? btn.dataset.action : null;
      if (!code && !action) continue;
      const press = (event) => {
        // Audio unlock on the first action. Browsers only allow an AudioContext
        // to be created inside a real user gesture, and on a phone the pad
        // buttons and canvas taps ARE that gesture - there is no keydown or
        // mousedown to unlock from, so without this the game is silent on mobile.
        this.sound.init();
        // preventDefault stops the browser inventing a compatibility mousedown
        // for this touch, which would double-fire the swing the button just
        // started.
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        // Pointer capture means sliding a thumb off the button still delivers
        // its release here, instead of leaving the key held down for ever.
        try { btn.setPointerCapture(event.pointerId); } catch (_) { /* not supported */ }
        btn.classList.add('is-down');
        this._touchActions.add(btn);
        if (code) this.setTouchKey(code, true);
        else this.setTouchAction(action, true);
      };
      const release = (event) => {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        btn.classList.remove('is-down');
        this._touchActions.delete(btn);
        if (code) this.setTouchKey(code, false);
        else this.setTouchAction(action, false);
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
      // A long press must not raise the operating system's selection menu.
      btn.addEventListener('contextmenu', (event) => event.preventDefault());
    }
    this.initTouchAim();
  }

  /**
   * Tapping the world aims at it, exactly as moving a mouse there does: the tap
   * writes `input.mouseX/Y` and holds the left button, so mining, attacking and
   * interacting all run through the same code the desktop build uses.
   *
   * Bound to the game canvas rather than the window, because #ui-layer is
   * transparent to pointers outside its panels — so a tap on empty HUD space
   * still lands here, while a tap on a button never does.
   */
  initTouchAim() {
    const canvas = this.canvas;
    if (!canvas || !canvas.addEventListener) return;
    const pos = (event) => {
      const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
      // The canvas fills the viewport, but subtracting its own origin keeps
      // this correct inside a scaled iframe (the Streamlit embed).
      const left = rect && isFinite(rect.left) ? rect.left : 0;
      const top = rect && isFinite(rect.top) ? rect.top : 0;
      this.input.mouseX = event.clientX - left;
      this.input.mouseY = event.clientY - top;
    };
    const canAim = () => this.platform === 'touch' && !this.paused &&
      !this.titleScreenOpen && !this.isDead && !this.isModalOpen();

    canvas.addEventListener('pointerdown', (event) => {
      // One aiming finger at a time: a second thumb landing on the world while
      // the first is holding a mine must not yank the aim across the screen.
      if (!canAim() || this._touchAimPointer !== null) return;
      this._touchAimPointer = event.pointerId;
      // Same reason as the pad buttons: this tap may be the first user gesture
      // the page ever sees, and audio has to be unlocked inside it.
      this.sound.init();
      if (event.preventDefault) event.preventDefault();
      try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* not supported */ }
      pos(event);
      // Snap here too, not only in update(): this handler fires the click
      // SYNCHRONOUSLY, so without it the very first tap of a swing would use
      // the raw fingertip position while every later one was nudged.
      this.snapTouchAim();
      // Tap = "do the right thing for what I am holding, right here".
      // Previously every tap swung the left button, so placing a block needed a
      // tap to aim PLUS a press of the use button - and because the aim could
      // freeze (see the lostpointercapture note below) that second step kept
      // dropping the block at the same old spot.
      this.handleTouchTap();
    });
    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this._touchAimPointer) return;
      pos(event);
    });
    const endAim = (event) => {
      // lostpointercapture fires WITHOUT a pointerup when the browser takes the
      // gesture over (scroll, pinch, system edge-swipe) or the element goes
      // away. Without listening for it the pointer id stayed set for the rest
      // of the session, every later tap was rejected by the guard above, and
      // the aim was frozen on one tile - which is exactly the "I can only
      // place blocks in one direction" bug.
      if (event && event.pointerId !== undefined && event.pointerId !== this._touchAimPointer) return;
      this._touchAimPointer = null;
      this.input.mouseDown = false;
      if (event) {
        try { canvas.releasePointerCapture(event.pointerId); } catch (_) { /* not captured */ }
      }
    };
    canvas.addEventListener('pointerup', endAim);
    canvas.addEventListener('pointercancel', endAim);
    canvas.addEventListener('lostpointercapture', endAim);
    // Belt and braces: a backgrounded tab never delivers pointerup, so make
    // certain the aim is live again when the player comes back.
    window.addEventListener('blur', () => endAim(null));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') endAim(null);
    });
  }

  /**
   * Where the thumb is pointing, and whether that tap would actually do
   * something.
   *
   * This mirrors the placement rules exactly (same range, same "is it air"
   * test, same "would it suffocate me" test) rather than inventing its own, so
   * a green reticle always means the tap places a block and a red one always
   * means it will not. That honesty is the whole point: it turns "why did
   * nothing happen" into a visible answer.
   */
  renderTouchReticle(ctx) {
    const tileX = Math.floor((this.input.mouseX + this.camera.x) / TILE_SIZE);
    const tileY = Math.floor((this.input.mouseY + this.camera.y) / TILE_SIZE);
    if (!Number.isFinite(tileX) || !Number.isFinite(tileY)) return;
    // Only bother while the target is somewhere the player could plausibly
    // reach, so the reticle never sits uselessly on the far side of the map.
    const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    const inRange = Math.hypot(tileX - pTileX, tileY - pTileY) <= 7.0;
    if (!inRange) return;

    const held = this.inventory[this.player.selectedSlot];
    const itemData = held ? ITEMS[held.id] : null;
    const placing = !!itemData && itemData.type === 'tile';
    let ok = this.world.getTile(tileX, tileY) === TILES.AIR;
    if (ok && placing && TILE_PROPERTIES[itemData.tile] &&
        TILE_PROPERTIES[itemData.tile].solid && !TILE_PROPERTIES[itemData.tile].isPlatform) {
      const pLeft = Math.floor(this.player.x / TILE_SIZE);
      const pRight = Math.floor((this.player.x + this.player.width) / TILE_SIZE);
      const pTop = Math.floor(this.player.y / TILE_SIZE);
      const pBot = Math.floor((this.player.y + this.player.height) / TILE_SIZE);
      if (tileX >= pLeft && tileX <= pRight && tileY >= pTop && tileY <= pBot) ok = false;
    }

    const colour = ok ? '#4ade80' : '#f87171';
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;
    ctx.save();
    // Outline the whole tile plus corner ticks: legible against any background
    // without hiding what is underneath.
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.globalAlpha = 0.9;
    const t = 5;
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of [
      [x, y, 1, 1], [x + TILE_SIZE, y, -1, 1],
      [x, y + TILE_SIZE, 1, -1], [x + TILE_SIZE, y + TILE_SIZE, -1, -1]
    ]) {
      ctx.moveTo(cx + dx * t, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * t);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Act on the world where the finger is, using whatever is in hand.
   *
   * A tap has to do the obvious thing for the selected item, or the pad feels
   * broken: with a block in hand the player expects the block to appear under
   * their fingertip, not to swing a pickaxe at it. Routing by item type keeps
   * every existing code path intact - nothing here re-implements placement,
   * mining or drinking, it only decides which of them a tap means.
   */
  handleTouchTap() {
    const held = this.inventory[this.player.selectedSlot];
    const itemData = held ? ITEMS[held.id] : null;
    const worldX = this.input.mouseX + this.camera.x;
    const worldY = this.input.mouseY + this.camera.y;
    const petUse = held?.id === 'bone' && this.cerberus?.isNear(worldX, worldY);
    // Blocks and consumables are "use" actions (place / drink / cast the rod);
    // everything else is "swing" (mine, attack, interact, talk).
    const isUse = (!!itemData && (itemData.type === 'tile' || itemData.type === 'consumable')) || petUse;
    if (isUse) {
      // A canvas tap is a single action. Leaving mouseDown set makes the game
      // loop immediately run the left-click path too, which mines the tile
      // just placed by the right-click path.
      this.input.mouseDown = false;
      this.input.mouseRightDown = true;
      this.handleRightClick();
      this.input.mouseRightDown = false;
    } else {
      this.input.mouseDown = true;
      this.handleLeftClick();
    }
  }

  /**
   * The "select world" list behind the Singleplayer button: the three save
   * files, each showing what it holds and what picking it would do.
   * `onPick(slot)` is supplied by the menu so it can close itself afterwards.
   */
  renderTitleWorlds(onPick) {
    const list = document.getElementById('title-world-list');
    if (!list) return;
    list.innerHTML = '';
    for (let slot = 1; slot <= 3; slot++) {
      const key = this.slotKey(slot);
      let save = null;
      try { save = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
      const current = key === this.saveKey;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'title-world-card' + (current ? ' is-current' : '') + (save ? '' : ' is-empty');

      const badge = document.createElement('span');
      badge.className = 'world-badge';
      badge.textContent = String(slot);

      const main = document.createElement('span');
      main.className = 'world-main';

      const name = document.createElement('span');
      name.className = 'world-name';
      name.textContent = (save && typeof save.name === 'string' && save.name) ? save.name : `World ${slot}`;
      if (current) {
        const tag = document.createElement('em');
        tag.className = 'world-tag';
        tag.textContent = 'CURRENT';
        name.appendChild(tag);
      }

      const meta = document.createElement('span');
      meta.className = 'world-meta';
      if (save) {
        const bits = [`Day ${Number.isFinite(save.dayCount) ? save.dayCount : 1}`];
        const stats = save.progress && save.progress.stats ? save.progress.stats : null;
        if (stats) {
          const minutes = Math.max(0, Math.floor((Number(stats.playTime) || 0) / 60));
          bits.push(minutes >= 60
            ? `${Math.floor(minutes / 60)}h ${minutes % 60}m played`
            : `${minutes}m played`);
          bits.push(`${Number(stats.kills) || 0} kills`);
        }
        meta.textContent = bits.join(' · ');
      } else {
        meta.textContent = 'Empty slot - start a brand new world';
      }

      main.appendChild(name);
      main.appendChild(meta);

      const action = document.createElement('span');
      action.className = 'world-action';
      action.textContent = save ? 'PLAY' : 'CREATE';

      card.appendChild(badge);
      card.appendChild(main);
      card.appendChild(action);
      card.addEventListener('click', () => { if (onPick) onPick(slot); });
      list.appendChild(card);
    }
  }

  /**
   * Pick one of the three save files from the main menu.
   * Returns true when this session is already running that slot (the caller
   * just closes the menu), false when the page is reloading onto another one.
   *
   * The menu boots paused, so nothing in this session is worth writing back -
   * and writing it back would stamp a brand-new save into the slot we are
   * leaving, turning an empty file into an occupied one.
   */
  startTitleWorld(slot) {
    const key = this.slotKey(slot);
    if (key === this.saveKey) return true;
    this.suppressExitSave = true;
    try { localStorage.setItem('terracraft-active-save', String(slot)); } catch (_) {}
    location.reload();
    return false;
  }

  // ============================================================
  // MULTIPLAYER PANEL (see multiplayer.js for the session itself)
  // ============================================================

  /**
   * Wire the title-screen multiplayer panel exactly once. Every listener is
   * built here rather than in a template so the panel can be re-shown without
   * attaching a second set (the same rule the world list follows).
   */
  initMultiplayerPanel() {
    if (this._mpPanelBuilt) return;
    this._mpPanelBuilt = true;
    const name = document.getElementById('mp-name');
    const room = document.getElementById('mp-room');
    const server = document.getElementById('mp-server');
    const status = document.getElementById('mp-status');
    const setStatus = (text) => { if (status) status.textContent = text; };
    try {
      const savedName = localStorage.getItem('terracraft-mp-name');
      if (name && !name.value && savedName) name.value = savedName;
    } catch (_) { /* storage blocked */ }
    if (name) {
      name.addEventListener('change', () => {
        try { localStorage.setItem('terracraft-mp-name', name.value); } catch (_) { /* storage blocked */ }
      });
    }
    // Default room is the same string on both sides, so two tabs can play with
    // one click each. A server address is only needed across machines: on
    // this computer, the bundled server already speaks the /mp relay.
    if (room && !room.value) room.value = 'COOP';
    if (server && !server.value) {
      // Feature-detected: the QA harnesses boot the game without a location,
      // and a missing one must not take the whole panel down.
      const here = typeof location !== 'undefined' ? location : null;
      const host = here ? here.hostname : '';
      const local = ['localhost', '127.0.0.1', '::1', ''].includes(host);
      server.value = here && local ? `ws://${host}:${here.port || 8000}/mp` : '';
    }
    document.getElementById('mp-host-btn')?.addEventListener('click', () => {
      if (!this.mp || this.mp.active) return;
      const result = this.mp.startHost(room?.value || '', server?.value || '', name?.value || 'Host');
      if (!result.ok) { setStatus(result.error); return; }
      // Hosting always walks straight into the world being shared; the room
      // stays alive on the title screen too, so guests can join either way.
      this.enterFromMultiplayer();
    });
    document.getElementById('mp-join-btn')?.addEventListener('click', () => {
      if (!this.mp || this.mp.active) return;
      const result = this.mp.startJoin(room?.value || '', server?.value || '',
        name?.value || 'Player', () => this.enterFromMultiplayer());
      if (!result.ok) { setStatus(result.error); return; }
      setStatus(`Looking for a host in room ${result.room}… (make sure the host used the same room code)`);
    });
    document.getElementById('title-multiplayer-back')?.addEventListener('click', () => {
      if (this._titleShowPanel) this._titleShowPanel('menu');
    });
  }

  /** Keep the panel's status line honest (room code, guest count, failures). */
  syncMultiplayerPanel() {
    const el = document.getElementById('mp-status');
    if (!el) return;
    const mp = this.mp;
    if (!mp) { el.textContent = ''; return; }
    if (mp.status === 'error' || mp.status === 'closed') {
      el.textContent = mp.statusDetail || 'Disconnected.';
      return;
    }
    if (mp.isHost) {
      el.textContent = mp.peers.size
        ? `Room ${mp.room} — ${mp.peers.size}/3 friend(s) connected. Tell them the room code if they lag behind.`
        : `Room ${mp.room} is open — tell your friends this room code, then have them press JOIN GAME (${mp.peers.size}/3).`;
      return;
    }
    if (mp.isClient && mp.status === 'connecting') {
      el.textContent = mp.statusDetail || 'Looking for the host…';
      return;
    }
    if (!mp.active) el.textContent = 'Host a world, or join a friend’s — everyone must use the SAME room code.';
  }

  /** Leave the menu into a session — the same path as picking a world. */
  enterFromMultiplayer() {
    if (this._titleEnterWorld) {
      this._titleEnterWorld();
      return;
    }
    this.titleScreenOpen = false;
    this.paused = false;
  }

  loadSettings() {
    const defaults = {
      quality: 'auto', effects: 'full', glow: 'full', showFps: false, autosave: 90,
      // Audio
      volume: 90, music: true,
      // Game feel (accessibility)
      shake: 'full', hitStop: true,
      // Display
      damageText: true, minimap: 'medium',
      // Interface
      tooltips: true,
      // How large the in-game HUD is drawn. 'normal' is the original size;
      // the player can shrink it to free up room on a phone or enlarge it to
      // read it comfortably. The main menu is deliberately NOT affected.
      uiScale: 'normal',
      keybinds: { ...KEYBIND_DEFAULTS }
    };
    try {
      const raw = localStorage.getItem('terracraft-settings');
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      if (['auto', 'high', 'balanced', 'low'].includes(saved.quality)) defaults.quality = saved.quality;
      if (['full', 'reduced', 'minimal'].includes(saved.effects)) defaults.effects = saved.effects;
      if (['full', 'reduced', 'off'].includes(saved.glow)) defaults.glow = saved.glow;
      defaults.showFps = saved.showFps === true;
      // Clamped so a corrupt or hand-edited value can't stall the game with a
      // 0s autosave loop (or effectively disable saving with a huge one).
      if (Number.isFinite(saved.autosave)) defaults.autosave = Math.max(15, Math.min(600, Math.round(saved.autosave)));
      // Every value below is validated against an allow-list or a numeric
      // range, never trusted raw: this object is read straight out of
      // localStorage, which the player (or any script on the page) can edit.
      if (Number.isFinite(saved.volume)) defaults.volume = Math.max(0, Math.min(100, Math.round(saved.volume)));
      defaults.music = saved.music !== false;
      if (['off', 'reduced', 'full'].includes(saved.shake)) defaults.shake = saved.shake;
      defaults.hitStop = saved.hitStop !== false;
      defaults.damageText = saved.damageText !== false;
      if (['hidden', 'small', 'medium', 'large'].includes(saved.minimap)) defaults.minimap = saved.minimap;
      defaults.tooltips = saved.tooltips !== false;
      if (['small', 'normal', 'large'].includes(saved.uiScale)) defaults.uiScale = saved.uiScale;
      for (const action of Object.keys(KEYBIND_DEFAULTS)) {
        const code = saved.keybinds && saved.keybinds[action];
        if (isValidKeybindCode(code, action) &&
            !keybindConflictAction(action, code, defaults.keybinds)) {
          defaults.keybinds[action] = code;
        }
      }
    } catch (_) {}
    return defaults;
  }

  keyMatches(action, code) {
    return this.settings.keybinds[action] === code ||
      (KEYBIND_ALIASES[action] || []).includes(code);
  }

  keybindActionForCode(code) {
    for (const action of Object.keys(KEYBIND_DEFAULTS)) {
      if (this.keyMatches(action, code)) return action;
    }
    return null;
  }

  formatKeybind(code) {
    if (code === 'Space') return 'SPACE';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
      if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6);
    return code.toUpperCase();
  }

  syncKeybindUI() {
    for (const button of document.querySelectorAll('button[data-keybind]')) {
      const action = button.dataset.keybind;
      const code = this.settings.keybinds[action];
      button.textContent = this._capturingKeybind === action
        ? 'PRESS A KEY…'
        : this.formatKeybind(code);
      button.setAttribute('aria-label', `${KEYBIND_LABELS[action]}: ${this.formatKeybind(code)}. Click to change.`);
      button.setAttribute('aria-pressed', String(this._capturingKeybind === action));
    }
    for (const label of document.querySelectorAll('[data-keybind-label]')) {
      const action = label.dataset.keybindLabel;
      const code = this.settings.keybinds[action];
      if (code) label.textContent = this.formatKeybind(code);
    }
    const rangeText = `${this.formatKeybind(this.settings.keybinds.slot1)}-${this.formatKeybind(this.settings.keybinds.slot9)}`;
    for (const id of ['hotbar-key-range', 'hotbar-key-range-guide']) {
      const range = document.getElementById(id);
      if (range) range.textContent = rangeText;
    }
  }

  captureKeybind(action) {
    if (!Object.prototype.hasOwnProperty.call(KEYBIND_DEFAULTS, action)) return false;
    this._capturingKeybind = action;
    this.syncKeybindUI();
    const button = document.querySelector(`button[data-keybind="${action}"]`);
    button?.focus();
    return true;
  }

  setCapturedKeybind(code) {
    const action = this._capturingKeybind;
    if (!action) return false;
    if (code === 'Escape') {
      this._capturingKeybind = null;
      this.syncKeybindUI();
      this.showToast('Key binding change cancelled.');
      return false;
    }
    if (!isValidKeybindCode(code, action)) {
      this.showToast('Choose a regular keyboard key.');
      return false;
    }
    const conflict = keybindConflictAction(action, code, this.settings.keybinds);
    if (conflict) {
      this.showToast(`That key is already assigned to ${KEYBIND_LABELS[conflict]}.`);
      return false;
    }
    this.settings.keybinds[action] = code;
    this.input.keybinds = this.settings.keybinds;
    this._capturingKeybind = null;
    this.saveSettings();
    this.syncKeybindUI();
    this.showToast(`${KEYBIND_LABELS[action]}: ${this.formatKeybind(code)}.`);
    return true;
  }

  /**
   * Put the chosen HUD size into force.
   *
   * One class on <body> drives everything, so this is a single toggle rather
   * than a pile of inline sizes. Scoped to #ui-layer on purpose: the title
   * screen is a sibling of that element, which is how "resize the HUD" stays
   * from also resizing the main menu the player was told to leave alone.
   */
  applyUiScale() {
    const scale = ['small', 'normal', 'large'].includes(this.settings.uiScale)
      ? this.settings.uiScale : 'normal';
    if (document.body) {
      document.body.classList.toggle('ui-small', scale === 'small');
      document.body.classList.toggle('ui-large', scale === 'large');
    }
    return scale;
  }

  saveSettings() {
    try { localStorage.setItem('terracraft-settings', JSON.stringify(this.settings)); } catch (_) {}
  }

  effectScale() {
    return this.settings.effects === 'minimal' ? 0.3 : this.settings.effects === 'reduced' ? 0.65 : 1;
  }

  // ---- Newer settings: audio, game feel, display -------------------------
  // Each of these has one apply function so the boot path, the change handler
  // and syncSettingsUI can never disagree about what a setting means.

  /** Master volume, 0..100 in the UI, 0..1 on the mixer. */
  applyVolume(announce = true) {
    const pct = Math.max(0, Math.min(100, Number(this.settings.volume) || 0));
    this.sound.setVolume(pct / 100);
    const readout = document.getElementById('settings-volume-value');
    if (readout) readout.textContent = pct + '%';
    if (announce) this.showToast(`🔊 Volume: ${pct}%`);
  }

  applyMusic() {
    this.sound.setMusicEnabled(this.settings.music !== false);
  }

  /** Screen shake. Off discards trauma; reduced scales it down. */
  applyShake(announce = true) {
    const mode = ['off', 'reduced', 'full'].includes(this.settings.shake) ? this.settings.shake : 'full';
    this.feel.setShakeScale(mode === 'off' ? 0 : mode === 'reduced' ? 0.4 : 1);
    if (announce) this.showToast(`📳 Screen shake: ${mode[0].toUpperCase() + mode.slice(1)}`);
  }

  applyHitStop() {
    this.feel.setHitStopEnabled(this.settings.hitStop !== false);
  }

  applyDamageText(announce = true) {
    const on = this.settings.damageText !== false;
    this.particles.setDamageTextEnabled(on);
    if (announce) this.showToast(on ? '🔢 Damage numbers: On' : '🔢 Damage numbers: Off');
  }

  /** Minimap default size. M still cycles it; this sets where it starts. */
  applyMinimap(announce = true) {
    const order = ['hidden', 'small', 'medium', 'large'];
    const mode = order.indexOf(this.settings.minimap);
    if (mode >= 0) {
      this.minimap.mode = mode;
      this.minimap.applyVisibility();
    }
    if (announce) this.showToast(`🗺 Minimap: ${this.settings.minimap}`);
  }

  /**
   * Item name readouts: the hover tooltip and the hotbar popup, which are two
   * halves of one feature and were therefore one switch.
   */
  applyTooltips(announce = true) {
    const on = this.settings.tooltips !== false;
    this.tooltipsEnabled = on;
    const tooltip = this._itemTooltip || document.getElementById('item-tooltip');
    if (tooltip && !on) tooltip.hidden = true;
    if (announce) this.showToast(on ? '🏷️ Item names: On' : '🏷️ Item names: Off');
  }

  /** Boot: push every non-performance setting into the live game. */
  applyAllSettings() {
    this.applyVolume(false);
    this.applyMusic();
    this.applyShake(false);
    this.applyHitStop();
    this.applyDamageText(false);
    this.applyMinimap(false);
    this.applyTooltips(false);
  }

  applyGlowMode(announce = true) {
    const requested = ['full', 'reduced', 'off'].includes(this.settings.glow) ? this.settings.glow : 'full';
    const qualityScale = this.quality.lowQuality ? 0.3 : 1;
    this.glowScale = requested === 'off' ? 0 : requested === 'reduced' ? 0.45 : qualityScale;
    this.world.glowScale = this.glowScale;
    if (this.glowCanvas) this.glowCanvas.style.opacity = requested === 'off' ? '0' : requested === 'reduced' ? '0.7' : '0.9';
    if (announce) this.showToast(`✨ Glow: ${requested === 'off' ? 'Off' : requested[0].toUpperCase() + requested.slice(1)}`);
  }

  applyQualityMode(mode, announce = true) {
    const next = ['auto', 'high', 'balanced', 'low'].includes(mode) ? mode : 'auto';
    this.settings.quality = next;
    this.autoQuality = next === 'auto';
    // Auto quality should step down before sustained work misses a 60 FPS
    // frame budget, not wait until the game is already running below 42 FPS.
    this.quality.budgetMs = next === 'auto' ? 16.7 : next === 'balanced' ? 20 : 24;
    this.quality.goodFrames = 0;
    if (next === 'high') {
      this.quality.lowQuality = false; this.renderScale = 1;
    } else if (next === 'balanced') {
      this.quality.lowQuality = false; this.renderScale = 0.8;
    } else if (next === 'low') {
      this.quality.lowQuality = true; this.renderScale = 0.6;
    } else {
      this.quality.lowQuality = false; this.renderScale = 1;
    }
    this.particleScale = this.effectScale() * (this.quality.lowQuality ? 0.5 : 1);
    this.particles?.setDensity(this.particleScale);
    this.applyGlowMode(false);
    if (this.pixelCanvas && this.canvas) this.resize();
    this.syncSettingsUI();
    if (announce) this.showToast(`⚙ Quality: ${next[0].toUpperCase() + next.slice(1)} · Effects: ${this.settings.effects}`);
  }

  syncSettingsUI() {
    const quality = document.getElementById('settings-quality');
    const effects = document.getElementById('settings-effects');
    const glow = document.getElementById('settings-glow');
    const fps = document.getElementById('settings-fps');
    const autosave = document.getElementById('settings-autosave');
    if (quality) quality.value = this.settings.quality;
    if (effects) effects.value = this.settings.effects;
    if (glow) glow.value = this.settings.glow;
    if (fps) fps.checked = this.settings.showFps === true;
    if (autosave) autosave.value = String(this.settings.autosave);
    // Audio / feel / display / interface. Written the same defensive way as
    // loadSettings: a stale save must never leave a control blank.
    const setSel = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null) el.value = String(value);
    };
    const setCheck = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.checked = value !== false;
    };
    setSel('settings-volume', this.settings.volume);
    setCheck('settings-music', this.settings.music);
    setSel('settings-shake', this.settings.shake);
    setCheck('settings-hitstop', this.settings.hitStop);
    setCheck('settings-damagetext', this.settings.damageText);
    setSel('settings-minimap', this.settings.minimap);
    setCheck('settings-tooltips', this.settings.tooltips);
    setSel('settings-ui-scale', this.settings.uiScale);
    this.syncKeybindUI();
    // The control scheme lives outside this.settings, but it is still a control
    // in this panel, so it gets synced here alongside the rest.
    this.syncControlSchemeLabels();
    const readout = document.getElementById('settings-volume-value');
    if (readout) readout.textContent = (Number(this.settings.volume) || 0) + '%';
  }

  toggleSettings(force) {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    const show = typeof force === 'boolean' ? force : modal.classList.contains('hidden');
    if (show) this.syncSettingsUI();
    modal.classList.toggle('hidden', !show);
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const dpr = this.dpr;
    // Inside an iframe (Streamlit) window.innerWidth is the frame viewport,
    // which can read 0 while the embed is still laying out — fall back to the
    // document size so the canvas never boots at 0x0 (black screen).
    const frameW = window.innerWidth || document.documentElement.clientWidth || 1280;
    const frameH = window.innerHeight || document.documentElement.clientHeight || 800;
    const vw = Math.max(320, Math.floor(frameW * this.zoom));
    const vh = Math.max(240, Math.floor(frameH * this.zoom));
    const internalScale = Math.max(0.5, Math.min(1, this.renderScale || 1));
    const internalW = Math.max(1, Math.floor(vw * internalScale));
    const internalH = Math.max(1, Math.floor(vh * internalScale));
    const outputW = Math.max(1, Math.floor(frameW * dpr));
    const outputH = Math.max(1, Math.floor(frameH * dpr));

    this.pixelCanvas.width = internalW;
    this.pixelCanvas.height = internalH;
    this.pixelCtx = this.pixelCanvas.getContext('2d');
    this.pixelCtx.imageSmoothingEnabled = false;

    // Keep all visual layers on the same internal scale so lighting and bloom
    // remain aligned with the pixel world. CSS stretches each layer to 100% of
    // the viewport, which is what prevents the old top-left/small-screen bug.
    this.canvas.width = outputW;
    this.canvas.height = outputH;
    // Explicitly keep the composited layers viewport-sized even if the stylesheet
    // is cached or temporarily unavailable.
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.lightCanvas.style.width = '100%';
    this.lightCanvas.style.height = '100%';
    if (this.glowCanvas) {
      this.glowCanvas.style.width = '100%';
      this.glowCanvas.style.height = '100%';
      this.glowCanvas.width = internalW;
      this.glowCanvas.height = internalH;
    }
    this.lightCanvas.width = internalW;
    this.lightCanvas.height = internalH;
    this.lightCtx.imageSmoothingEnabled = false;
    if (this.glowCtx) this.glowCtx.imageSmoothingEnabled = false;

    this.camera.viewportWidth = vw;
    this.camera.viewportHeight = vh;
    this.internalScale = internalScale;
  }

  initWindow() {
    window.addEventListener('resize', () => this.resize());
    this.resize();

    // ---- Save on the way out ----
    // The in-loop timer only fires while the game is actually running, so
    // closing the tab (or the Streamlit iframe reloading) used to throw away
    // up to a full interval of progress. These three hooks cover the ways a
    // session really ends:
    //   pagehide      - fires on close/navigation, and unlike beforeunload it
    //                  is reliable on mobile Safari, which is where most
    //                  "I lost my world" reports come from.
    //   visibilitychange - fires when the tab is backgrounded, which on mobile
    //                  is the usual precursor to being killed.
    //   beforeunload  - desktop close, kept as a belt-and-braces fallback.
    // saveGame() is synchronous localStorage, so it completes during teardown.
    const saveOnExit = () => {
      // Never write a mid-death snapshot: dying is not a reason to persist the
      // moment the player fell, and the respawn handler saves the real state.
      if (this.isDead) return;
      // Switching save files from the main menu must not stamp a save into the
      // slot being left behind, or an empty file would become an occupied one.
      if (this.suppressExitSave) return;
      this.saveGame(true);
    };
    window.addEventListener('pagehide', saveOnExit);
    window.addEventListener('beforeunload', saveOnExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveOnExit();
    });
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.sound.init(); // Audio unlock on first action

      if (this._capturingKeybind) {
        e.preventDefault();
        e.stopPropagation();
        this.setCapturedKeybind(e.code);
        return;
      }

      // While a modal is open its input owns the keyboard. The creative search
      // box in particular would otherwise eat characters as game actions.
      const typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (typing) return;

      this.input.keys[e.code] = true;
      const action = this.keybindActionForCode(e.code);
      if (action) e.preventDefault();
      // Track Shift explicitly so the inventory can offer "move whole stack".
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.shiftHeld = true;

      // C opens the creative menu (give yourself any item).
      if (action === 'creative' && !e.repeat) {
        this.toggleCreativeModal();
        return;
      }

      // O opens the compact settings panel.
      if (action === 'settings' && !e.repeat) {
        this.toggleSettings();
        return;
      }

      // J opens the settlement journal (discoveries + score).
      if (action === 'journal' && !e.repeat) {
        this.toggleJournal();
        return;
      }

      // The main menu owns the keyboard while it is open. Its own handler, bound
      // to the title screen, already deals with Escape; letting this one run too
      // would flip `paused` back to false and the world would keep playing
      // underneath a menu the player is still looking at.
      if (this.titleScreenOpen) return;

      // Enter opens multiplayer chat. The handler above already ignores
      // keystrokes that land in a text field, so the chat box owns the keyboard
      // from the moment it takes focus.
      if (e.code === 'Enter' && this.mp && this.mp.active && !e.repeat) {
        e.preventDefault();
        this.mp.openChat();
        return;
      }

      // Pause / resume takes priority over everything else, except closing Settings.
      if (e.code === 'Escape' || action === 'pause') {
        const settingsModal = document.getElementById('settings-modal');
        if (e.code === 'Escape' && settingsModal && !settingsModal.classList.contains('hidden')) {
          this.toggleSettings(false);
          return;
        }
        // Escape shuts the chest panel first — otherwise the first press always
        // opened the pause menu with the storage UI still on screen.
        if (e.code === 'Escape') {
          const chestModal = document.getElementById('chest-modal');
          if (chestModal && !chestModal.classList.contains('hidden')) {
            this.closeChestUI();
            return;
          }
        }
        if (!e.repeat) this.togglePause();
        return;
      }
      if (this.paused) return;

      // M cycles the minimap: hidden -> small -> medium -> large
      if (action === 'minimap' && !e.repeat) {
        const size = this.minimap.cycle();
        this.showToast(size ? `🗺️ Minimap size: ${size}px` : '🗺️ Minimap hidden');
        return;
      }

      // T talks to a nearby villager (quests — see npcs.js)
      if (action === 'talk' && !e.repeat) {
        if (this.npcs) this.npcs.handleTalkKey();
        return;
      }

    // Zoom is handled elsewhere in this build.

    // 1-9 Hotbar selection
      if (action && action.startsWith('slot') && !e.repeat) {
        this.player.selectedSlot = Number(action.slice(4)) - 1;
        this.updateHotbarUI();
      }

      // A/D (or left/right) reels in while a line is in the water. This must
      // run before the movement bindings below so a bite is never missed.
      if ((action === 'moveLeft' || action === 'moveRight') && !e.repeat) {
        if (this.onFishingKey()) return;
      }

      // Jump / Double Jump / Wall Kick.
      // Ignoring OS key-repeat stops a held space bar from instantly burning
      // the double jump the moment we touch the ground.
      if (action === 'jump' && !e.repeat) {
        this.player.queueJump(this.sound, this.particles);
      }

      // Dodge Roll
      if (action === 'dodge' && !e.repeat) {
        this.player.dodge(this.sound, this.particles);
      }

      // Crafting and inventory are deliberately separate screens.
      if (action === 'craft' && !e.repeat) {
        e.preventDefault();
        this.toggleCraftingModal();
      }
      if (action === 'inventory' && !e.repeat) {
        e.preventDefault();
        this.toggleInventoryModal();
      }

      // Quick Heal (H)
      if (action === 'heal' && !e.repeat) {
        this.quickHeal();
      }

      // Q drinks the best buff potion in the bag
      if (action === 'buff' && !e.repeat) {
        this.quickBuff();
      }

      // G throws the selected stack on the floor — Minecraft's Q.
      //
      // Shift drops ONE item, exactly like Minecraft: handy for feeding one
      // ore to a furnace or nudging a stack out from under a wall.
      if (action === 'drop' && !e.repeat) {
        e.preventDefault();
        this.dropSelectedStack(e.shiftKey ? 1 : Infinity);
      }

      // F toggles the performance HUD: FPS, resolution and particle load.
      if (action === 'fps' && !e.repeat) {
        this.showFps = !this.showFps;
        this.settings.showFps = this.showFps;
        if (this.showFps) this.renderFpsBadge();
      else {
        this._fpsBadge?.remove();
        this._fpsBadge = null;
      }
      this.saveSettings();
      this.showToast(this.showFps ? '📊 Performance readout on.' : '📊 Performance readout off.');
      }
    });

    window.addEventListener('keyup', (e) => {
      // Always clear the key, even while typing, so a key held when the search
      // box was focused can never stay stuck down after it closes.
      this.input.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.shiftHeld = false;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      // e.target can be a text node / null in some embed contexts — a crash
      // here would kill ALL mouse input, so guard it.
      if ((e.target && e.target.closest && e.target.closest('.modal')) || this.paused) return;
      this.sound.init();
      if (e.button === 0) {
        this.input.mouseDown = true;
        this.handleLeftClick();
      } else if (e.button === 2) {
        this.input.mouseRightDown = true;
        this.handleRightClick();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.mouseDown = false;
      if (e.button === 2) this.input.mouseRightDown = false;
    });

    // Losing focus must release the mouse, otherwise the game keeps auto-firing.
    window.addEventListener('blur', () => {
      this.input.mouseDown = false;
      this.input.mouseRightDown = false;
      this.input.keys = {};
      this.shiftHeld = false;
    });

    // Mouse wheel hotbar select
    window.addEventListener('wheel', (e) => {
      if (this.paused || this.isModalOpen()) return;
      if (e.deltaY > 0) {
        this.player.selectedSlot = (this.player.selectedSlot + 1) % 9;
      } else {
        this.player.selectedSlot = (this.player.selectedSlot + 8) % 9;
      }
      this.updateHotbarUI();
    });

    // Prevent default context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Tag an element with the item tooltip it should raise on hover.
   *
   * This replaces the old `el.title = ...`. A native tooltip only appears
   * after a long delay, cannot be styled, and looks nothing like the rest of
   * the game. Reading data-tip lets ONE delegated listener drive a properly
   * styled tooltip across every item surface at once, and makes "no tooltip
   * here" (the hotbar) a plain absence instead of a special case.
   */
  tip(el, text) {
    el.dataset.tip = text;
    // title is gone, so keep the text announced to assistive tech.
    el.setAttribute('aria-label', text);
  }

  /**
   * One delegated hover handler covering every item tooltip in the game.
   *
   * The hotbar is excluded on purpose: its slots announce themselves through
   * #item-name-popup when the selection changes, and raising both at once is
   * exactly the double-tooltip noise this replaced.
   */
  setupItemTooltips() {
    const tooltip = document.getElementById('item-tooltip');
    const layer = document.getElementById('ui-layer');
    const hotbar = document.getElementById('hotbar');
    if (!tooltip || !layer) return;
    this._itemTooltip = tooltip;

    const tipTarget = (node) => {
      if (!node || node.nodeType !== 1 || !node.closest) return null;
      const el = node.closest('[data-tip]');
      if (!el) return null;
      if (hotbar && hotbar.contains(el)) return null;
      return el;
    };

    layer.addEventListener('mouseover', (event) => {
      if (this.tooltipsEnabled === false) return;
      const el = tipTarget(event.target);
      if (!el) return;
      tooltip.textContent = el.dataset.tip;
      tooltip.hidden = false;
      this.moveItemTooltip(event.clientX, event.clientY);
    });
    layer.addEventListener('mousemove', (event) => {
      if (tooltip.hidden || this.tooltipsEnabled === false) return;
      this.moveItemTooltip(event.clientX, event.clientY);
    });
    layer.addEventListener('mouseout', (event) => {
      const el = tipTarget(event.target);
      if (!el) return;
      // Sliding between children of the SAME slot must not flicker the tip.
      if (event.relatedTarget && el.contains(event.relatedTarget)) return;
      tooltip.hidden = true;
    });
    // A panel can close or re-render with the cursor sitting still on it,
    // stranding the tooltip over empty space. Any scroll invalidates it.
    window.addEventListener('scroll', () => { tooltip.hidden = true; }, true);
  }

  /** Keep the cursor tooltip inside the window, flipping near an edge. */
  moveItemTooltip(clientX, clientY) {
    const tooltip = this._itemTooltip;
    if (!tooltip) return;
    // Measured after it is un-hidden: a hidden element reports no size.
    const w = tooltip.offsetWidth || 160;
    const h = tooltip.offsetHeight || 26;
    const pad = 10;
    let x = clientX + 16;
    let y = clientY + 18;
    if (x + w + pad > window.innerWidth) x = Math.max(pad, clientX - w - 12);
    if (y + h + pad > window.innerHeight) y = Math.max(pad, clientY - h - 12);
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  /**
   * Minecraft-style: name the slot the player just switched to, floating above
   * the hotbar.
   *
   * This watches selectedSlot rather than hooking each input path, so number
   * keys, the scroll wheel, clicking a slot and equipping from the bag all
   * announce themselves without any of them knowing this exists.
   */
  watchHotbarSelection() {
    const slot = this.player.selectedSlot;
    if (this._lastHotbarSlot === slot) return;
    // The first reading is boot, not a switch - stay quiet for it.
    if (this._lastHotbarSlot === undefined) {
      this._lastHotbarSlot = slot;
      return;
    }
    this._lastHotbarSlot = slot;
    this.showItemNamePopup(this.inventory[slot]);
  }

  showItemNamePopup(slot) {
    const popup = document.getElementById('item-name-popup');
    if (!popup) return;
    // Turning item names off has to hide the popup too, not merely decline to
    // show the next one — otherwise a popup already on screen survives the
    // setting change and then animates away on its own timer.
    if (this.tooltipsEnabled === false) {
      popup.textContent = '';
      popup.classList.remove('show');
      return;
    }
    const data = slot && slot.id && slot.id !== 'empty' ? ITEMS[slot.id] : null;
    const text = data ? data.name + (slot.count > 1 ? ' x' + slot.count : '') : '';
    popup.textContent = text;
    if (!text) { popup.classList.remove('show'); return; }
    // Re-adding a class does not restart a running animation, so force a
    // reflow between removing and adding it.
    popup.classList.remove('show');
    void popup.offsetWidth;
    popup.classList.add('show');
  }

  initUI() {
    this.setupItemTooltips();
    const btnSettings = document.getElementById('btn-settings');
    const settingsClose = document.getElementById('settings-close');
    if (btnSettings) btnSettings.addEventListener('click', () => this.toggleSettings());
    settingsClose?.addEventListener('click', () => this.toggleSettings(false));
    document.getElementById('settings-modal')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.toggleSettings(false);
    });
    // The control scheme is NOT a game setting: it is a fact about the device,
    // so it persists under its own key and applies the moment it changes.
    document.getElementById('settings-controls')?.addEventListener('change', (event) => {
      this.setControlScheme(event.target.value);
    });
    document.getElementById('settings-keybinds')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-keybind]');
      if (button) this.captureKeybind(button.dataset.keybind);
    });
    document.getElementById('settings-ui-scale')?.addEventListener('change', (event) => {
      this.settings.uiScale = event.target.value;
      this.applyUiScale();
      this.saveSettings();
      this.showToast('🔍 HUD size: ' + this.settings.uiScale);
    });
    document.getElementById('settings-quality')?.addEventListener('change', (event) => {
      this.applyQualityMode(event.target.value);
      this.saveSettings();
    });
    document.getElementById('settings-effects')?.addEventListener('change', (event) => {
      this.settings.effects = event.target.value;
      this.particleScale = this.effectScale() * (this.quality.lowQuality ? 0.5 : 1);
      this.particles.setDensity(this.particleScale);
      this.particles.initAmbientLeaves(this.world.pixelWidth, this.world.pixelHeight);
      this.saveSettings();
      this.showToast(`✨ Effects density: ${event.target.value}`);
    });
    document.getElementById('settings-glow')?.addEventListener('change', (event) => {
      this.settings.glow = event.target.value;
      this.applyGlowMode();
      this.saveSettings();
    });
    document.getElementById('settings-fps')?.addEventListener('change', (event) => {
      this.settings.showFps = event.target.checked === true;
      this.showFps = this.settings.showFps;
      if (this.showFps) this.renderFpsBadge();
      else {
        this._fpsBadge?.remove();
        this._fpsBadge = null;
      }
      this.saveSettings();
    });

    // Autosave interval lives in settings; changing it re-arms the countdown.
    document.getElementById('settings-autosave')?.addEventListener('change', (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      this.settings.autosave = Math.max(15, Math.min(600, Math.round(value)));
      this.autosaveInterval = this.settings.autosave;
      // Re-arm from now, so a new interval takes effect immediately instead of
      // waiting out whatever was left of the old countdown.
      this.autosaveTimer = this.autosaveInterval;
      this.saveSettings();
      this.showToast(`💾 Autosave: every ${this.autosaveInterval}s`);
    });

    // ---- Audio --------------------------------------------------------
    // `input` rather than `change` so dragging the slider is audible live.
    document.getElementById('settings-volume')?.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      this.settings.volume = Math.max(0, Math.min(100, Math.round(value)));
      // No toast on every pixel of a drag; the readout beside it says it.
      this.applyVolume(false);
      this.saveSettings();
    });
    document.getElementById('settings-volume')?.addEventListener('change', () => {
      this.showToast(`🔊 Volume: ${this.settings.volume}%`);
    });
    document.getElementById('settings-music')?.addEventListener('change', (event) => {
      this.settings.music = event.target.checked === true;
      this.applyMusic();
      this.saveSettings();
    });

    // ---- Game feel ----------------------------------------------------
    document.getElementById('settings-shake')?.addEventListener('change', (event) => {
      this.settings.shake = event.target.value;
      this.applyShake();
      this.saveSettings();
    });
    document.getElementById('settings-hitstop')?.addEventListener('change', (event) => {
      this.settings.hitStop = event.target.checked === true;
      this.applyHitStop();
      this.saveSettings();
    });

    // ---- Display ------------------------------------------------------
    document.getElementById('settings-damagetext')?.addEventListener('change', (event) => {
      this.settings.damageText = event.target.checked === true;
      this.applyDamageText();
      this.saveSettings();
    });
    document.getElementById('settings-minimap')?.addEventListener('change', (event) => {
      this.settings.minimap = event.target.value;
      this.applyMinimap();
      this.saveSettings();
    });

    // ---- Interface ----------------------------------------------------
    document.getElementById('settings-tooltips')?.addEventListener('change', (event) => {
      this.settings.tooltips = event.target.checked === true;
      this.applyTooltips();
      this.saveSettings();
    });

    // Sound toggle button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.sound.init();
        const on = this.sound.toggle();
        btnSound.textContent = on ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
      });
    }

    // Guide Modal
    const btnHelp = document.getElementById('btn-help');
    const guideModal = document.getElementById('guide-modal');
    const guideClose = document.getElementById('guide-close');
    if (btnHelp && guideModal) {
      btnHelp.addEventListener('click', () => guideModal.classList.remove('hidden'));
      guideClose.addEventListener('click', () => guideModal.classList.add('hidden'));
    }

    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', () => this.saveGame());

    const btnLoad = document.getElementById('btn-load');
    if (btnLoad) btnLoad.addEventListener('click', () => this.loadGame());

    const btnSaves = document.getElementById('btn-saves');
    const saveManager = document.getElementById('save-manager');
    if (btnSaves && saveManager) {
      btnSaves.addEventListener('click', () => { this.renderSaveManager(); saveManager.classList.remove('hidden'); });
      document.getElementById('save-manager-close')?.addEventListener('click', () => saveManager.classList.add('hidden'));
    }

    const btnCrafting = document.getElementById('btn-crafting');
    if (btnCrafting) btnCrafting.addEventListener('click', () => this.toggleCraftingModal(true));

    // ---- back to the main menu ------------------------------------------
    // Reachable from the pause menu (ESC) and from Settings, so the player is
    // never more than one click from switching worlds. Both paths route through
    // returnToMainMenu(), which saves first.
    const goToMenu = (event) => { event?.stopPropagation?.(); this.returnToMainMenu(); };

    const btnMainMenu = document.getElementById('btn-mainmenu');
    if (btnMainMenu) btnMainMenu.addEventListener('click', goToMenu);

    const btnPauseResume = document.getElementById('btn-pause-resume');
    if (btnPauseResume) btnPauseResume.addEventListener('click', () => this.togglePause(false));

    const btnPauseSave = document.getElementById('btn-pause-save');
    if (btnPauseSave) btnPauseSave.addEventListener('click', () => this.saveGame());

    const btnPauseMenu = document.getElementById('btn-pause-menu');
    if (btnPauseMenu) btnPauseMenu.addEventListener('click', goToMenu);

    // Settings from the pause menu: hide the overlay first so the modal is not
    // left stacked underneath it when the player closes settings again.
    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) {
      btnPauseSettings.addEventListener('click', () => {
        this.togglePause(false);
        document.getElementById('settings-modal')?.classList.remove('hidden');
      });
    }

    const btnInventory = document.getElementById('btn-inventory');
    if (btnInventory) btnInventory.addEventListener('click', () => this.toggleInventoryModal(true));

    // Summon Boss button
    const btnSummon = document.getElementById('btn-summon');
    if (btnSummon) {
      btnSummon.addEventListener('click', () => {
        this.sound.init();
        this.summonBoss();
      });
    }

    // Creative menu button
    const btnCreative = document.getElementById('btn-creative');
    if (btnCreative) {
      btnCreative.addEventListener('click', () => this.toggleCreativeModal());
    }
    const creativeModal = document.getElementById('creative-modal');
    if (creativeModal) {
      document.getElementById('creative-close')?.addEventListener('click', () => this.toggleCreativeModal(false));
      // Clicking the dim backdrop closes it, like the other modals.
      creativeModal.addEventListener('click', (event) => {
        if (event.target === creativeModal) this.toggleCreativeModal(false);
      });
      const searchInput = document.getElementById('creative-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.renderCreativeMenu());
        searchInput.addEventListener('keydown', (event) => {
          // Enter grants the first match, so you can search-then-grab fast.
          if (event.key === 'Enter') {
            const first = document.querySelector('#creative-grid .creative-cell');
            if (first) first.click();
          }
          event.stopPropagation();
        });
      }
      const fillHotbar = document.getElementById('creative-fill-hotbar');
      if (fillHotbar) fillHotbar.addEventListener('change', () => this.renderCreativeMenu());
      // ADD 1 / ADD STACK / ADD 999 apply to every item currently listed.
      for (const btn of document.querySelectorAll('.creative-quick-btn')) {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.quick;
          const cells = [...document.querySelectorAll('#creative-grid .creative-cell')];
          if (!cells.length) return;
          let last = null;
          for (const cell of cells) {
            const id = cell.dataset.id;
            const stackMax = ITEMS[id]?.stackMax || 99;
            const count = mode === '1' ? 1 : mode === 'max' ? 999 : stackMax;
            this.giveCreativeItem(id, count);
            last = id;
          }
          // One summary toast instead of one per item (which would spam).
          this.showToast(`✨ Granted ${mode === '1' ? '1' : mode === 'max' ? '999' : 'a full stack'} of ${cells.length} item${cells.length === 1 ? '' : 's'}.`);
          void last;
        });
      }
    }

    const btnJournal = document.getElementById('btn-journal');
    if (btnJournal) {
      btnJournal.addEventListener('click', () => this.toggleJournal());
      document.getElementById('journal-close')?.addEventListener('click', () => this.toggleJournal(false));
      const jm = document.getElementById('journal-modal');
      if (jm) jm.addEventListener('click', (event) => { if (event.target === jm) this.toggleJournal(false); });
    }

    // Crafting and inventory close buttons
    const modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', () => this.toggleCraftingModal(false));
    const inventoryClose = document.getElementById('inventory-close');
    if (inventoryClose) inventoryClose.addEventListener('click', () => this.toggleInventoryModal(false));

    // Slot management: favourite / delete the Shift+click-selected bag slot.
    const slotFav = document.getElementById('slot-fav-btn');
    if (slotFav) slotFav.addEventListener('click', () => this.toggleSelectedFavorite());
    const slotDel = document.getElementById('slot-delete-btn');
    if (slotDel) slotDel.addEventListener('click', () => this.deleteSelectedSlot());
    const slotClr = document.getElementById('slot-clear-btn');
    if (slotClr) slotClr.addEventListener('click', () => this.clearSlotSelection());
    const slotSort = document.getElementById('slot-sort-btn');
    if (slotSort) slotSort.addEventListener('click', () => this.sortInventory());
    document.getElementById('crafting-modal')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.toggleCraftingModal(false);
    });
    document.getElementById('inventory-modal')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.toggleInventoryModal(false);
    });

    const closeChestModal = () => this.closeChestUI();
    document.getElementById('chest-close')?.addEventListener('click', closeChestModal);
    document.getElementById('chest-done')?.addEventListener('click', closeChestModal);
    document.getElementById('chest-modal')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) closeChestModal();
    });
    document.getElementById('chest-deposit-all')?.addEventListener('click', () => this.chestQuickDeposit());
    document.getElementById('chest-take-all')?.addEventListener('click', () => this.chestTakeAll());

    // Respawn button
    const btnRespawn = document.getElementById('btn-respawn');
    if (btnRespawn) {
      btnRespawn.addEventListener('click', () => this.respawnPlayer());
    }

    // Continue button
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        document.getElementById('victory-screen').classList.add('hidden');
      });
    }

    const shared = document.getElementById('shared-grid');
    if (shared) shared.appendChild(document.createElement('span'));

    this.renderHotbarUI();
    this.renderCraftingRecipes();
  }

  slotKey(slot) { return `terracraft-world-slot-${slot}`; }

  /**
   * The world seed for the slot this session is on.
   *
   * Slot 1 is the original world and is always seed 0: that is what guarantees
   * it never changes. Generating it needs no RNG at all — the unseeded path is
   * simply the world the game has always made.
   *
   * Slots 2 and 3 roll a fresh random seed, ONCE, and remember it in
   * localStorage. Rolling it per page load would be wrong: the terrain is saved
   * as tiles, so a re-roll would never actually change the world a player is
   * already in, and the first load before a save existed would disagree with
   * every load after it. Pinning the seed per slot is what makes the world a
   * stable fact about that save file rather than a lottery on refresh.
   */
  worldSeed() {
    const slot = Number(localStorage.getItem('terracraft-active-save') || 1);
    if (!(slot >= 2 && slot <= 3)) return 0;   // slot 1 and anything odd: original
    const key = `terracraft-world-seed-${slot}`;
    try {
      const stored = Number(localStorage.getItem(key));
      if (Number.isFinite(stored) && stored !== 0) return Math.floor(stored);
      // 1..0x7fffffff, and never 0 — 0 is reserved as "the original world".
      const rolled = 1 + Math.floor(Math.random() * 0x7ffffffe);
      localStorage.setItem(key, String(rolled));
      return rolled;
    } catch (_) {
      // No localStorage: fall back to an unseeded world rather than throwing.
      return 0;
    }
  }

  // ============================================================
  // BAG SIZE — the base 40 slots, plus whatever the best backpack adds
  // ============================================================

  /**
   * How many bag slots this player is entitled to: the 40-slot base plus the
   * bonus from the BEST backpack currently in the bag. Tiers do not stack —
   * carrying all three gives you the biggest one's 15, not 30 — so the ladder
   * stays a ladder instead of a "collect every backpack" checklist.
   */
  inventoryCapacity() {
    let bonus = 0;
    for (const id of ['backpack_small', 'backpack_mid', 'backpack_large']) {
      const item = ITEMS[id];
      if (item && this.countItem(id) > 0) bonus = Math.max(bonus, item.bonusSlots);
    }
    return 40 + bonus;
  }

  /**
   * Grow the bag to the size the player has earned.
   *
   * Deliberately GROW-ONLY. Shrinking would have to destroy whatever is sitting
   * in the slots a dropped or downgraded backpack had opened, and silently
   * deleting a player's items is far worse than a bag that stays roomy after
   * you take the backpack back out. The size is therefore the high-water mark
   * the player has reached this run.
   */
  syncInventorySlots() {
    const want = this.inventoryCapacity();
    while (this.inventory.length < want) this.inventory.push({ id: 'empty', count: 0 });
    return this.inventory.length;
  }

  // ============================================================
  // SHARED INVENTORY — one small bag that follows you everywhere
  // ============================================================

  /** Load the cross-world saved slots. Never throws on bad data. */
  loadSharedInventory() {
    try {
      const raw = localStorage.getItem('terracraft-shared-inventory');
      const parsed = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(parsed)) return false;
      this.savedInventory = [];
      for (const slot of parsed.slice(0, 18)) {
        if (!slot || !ITEMS[slot.id] || !Number.isFinite(slot.count) || slot.count <= 0) {
          this.savedInventory.push({ id: 'empty', count: 0 });
          continue;
        }
        let remaining = Math.floor(slot.count);
        while (remaining > 0) {
          const count = Math.min(ITEMS[slot.id].stackMax, remaining);
          this.savedInventory.push({ id: slot.id, count });
          remaining -= count;
        }
      }
      return true;
    } catch (error) {
      console.warn('Terracraft shared inventory: unreadable, starting empty.', error);
      this.savedInventory = [];
      return false;
    }
  }

  saveSharedInventory() {
    this.savedDirty = false;
    try {
      localStorage.setItem('terracraft-shared-inventory', JSON.stringify(this.savedInventory));
    } catch (error) {
      this.showToast('⚠️ Could not store that item.');
      console.error('Terracraft shared inventory save failed:', error);
    }
  }

  /**
   * Move one item from the bag into (or out of) the cross-world stash.
   *
   * Ctrl+click in the inventory grid is the whole interface: no drag target to
   * miss, and it works from the hotbar too. Stacks move one item at a time so
   * you can split a pile without a second menu.
   */
  moveToShared(index) {
    const slot = this.inventory[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;
    const item = ITEMS[slot.id];
    if (!item) return false;

    const stackMax = item.stackMax || 99;
    // Find a stash slot that already holds this item and has room.
    let target = this.savedInventory.find(s => s.id === slot.id && s.count < stackMax);
    if (!target) {
      if (this.savedInventory.filter(s => s.id === 'empty').length === 0 && this.savedInventory.length >= 18) {
        this.showToast('📦 The shared stash is full.');
        return false;
      }
      target = { id: slot.id, count: 0 };
      this.savedInventory.push(target);
    }

    // Shift+Ctrl moves the whole stack; plain Ctrl moves a single item.
    const moveCount = this.shiftHeld ? slot.count : 1;
    const room = stackMax - target.count;
    const moved = Math.min(moveCount, room, slot.count);
    target.count += moved;
    slot.count -= moved;
    if (slot.count <= 0) this.inventory[index] = { id: 'empty', count: 0 };

    this.savedDirty = true;
    this.sound.playPickup();
    this.showToast(`📦 Stored ${moved}× ${item.name} (shared across worlds).`);
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** Pull one item back out of the cross-world stash into the bag. */
  takeFromShared(index) {
    const slot = this.savedInventory[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;
    if (!this.canAddItem(slot.id, 1)) {
      this.showToast('🎒 Your bag is full.');
      return false;
    }
    this.addItem(slot.id, 1);
    slot.count -= 1;
    if (slot.count <= 0) slot.id = 'empty';
    this.savedDirty = true;
    this.sound.playPickup();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** A fresh 18-slot chest grid. Fixed length so renders and saves agree. */
  makeEmptyChestSlots() {
    const slots = [];
    for (let i = 0; i < 18; i++) slots.push({ id: 'empty', count: 0 });
    return slots;
  }

  /**
   * The storage grid of the chest sitting at (tileX, tileY). Creates the entry
   * on first access and sanitises every slot, so a hand-edited or pre-feature
   * save can never push a broken item id into the panel.
   */
  getChestSlots(tileX, tileY) {
    const key = `${tileX},${tileY}`;
    let slots = this.chestStorage[key];
    if (!Array.isArray(slots)) {
      slots = this.makeEmptyChestSlots();
      this.chestStorage[key] = slots;
    }
    slots.length = 18;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s || !ITEMS[s.id] || !Number.isFinite(s.count) || s.count <= 0) slots[i] = { id: 'empty', count: 0 };
    }
    return slots;
  }

  /**
   * Breaking a chest must not delete what was stored in it: every stack spills
   * into the world as a pickup, and the storage entry goes with the tile.
   */
  spillChestContents(tileX, tileY) {
    const key = `${tileX},${tileY}`;
    const slots = this.chestStorage[key];
    if (!Array.isArray(slots)) return;
    for (const slot of slots) {
      if (slot && ITEMS[slot.id] && slot.count > 0) {
        this.drops.push(new DropItem(tileX * TILE_SIZE + 5, tileY * TILE_SIZE + 5, slot.id, slot.count));
      }
    }
    delete this.chestStorage[key];
    // The chest itself is gone as far as the world is concerned — drop the
    // grid in every other session too, or the next chest placed at those
    // coordinates would inherit this one's leftovers.
    this.mp?.chestDeleted(tileX, tileY);
  }

  /**
   * Roll the contents of a sealed world chest. Depth pays: a chest at the
   * surface seeds the two stacks it always did, one more than twenty tiles
   * down seeds a third, and one more than forty tiles down seeds four draws
   * off the deep table — crystal, hellstone, obsidian and diamonds instead of
   * apples and wool. `rng` is injectable so QA can force a table instead of
   * waiting on luck; the game itself always uses Math.random.
   */
  rollChestLoot(tileX, tileY, rng = Math.random) {
    const surface = this.world.surfaceHeights[tileX] || 0;
    const depth = Math.max(0, tileY - surface);
    const shallowTable = [
      ['iron_ore', 4], ['gold_ore', 2], ['wool', 3], ['healing_potion', 2], ['arrow', 15], ['apple', 3]
    ];
    const deepTable = [
      ['diamond', 2], ['crystal', 3], ['hellstone', 3], ['obsidian_block', 8],
      ['fallen_star', 2], ['gold_ore', 6], ['iron_ore', 8]
    ];
    const table = depth >= 40 ? deepTable : shallowTable;
    const rolls = depth >= 40 ? 4 : depth >= 20 ? 3 : 2;
    const loot = [];
    for (let i = 0; i < rolls; i++) {
      const entry = table[Math.floor(rng() * table.length)];
      loot.push({ id: entry[0], count: entry[1] });
    }
    return loot;
  }

  /**
   * Open the storage panel for one chest. A world chest that has never been
   * opened is unsealed here: its loot is rolled (see rollChestLoot, which
   * scales with how deep the chest sits) and seeded INTO the chest slots so
   * the player takes what they want, and the first-chest bookkeeping still
   * fires. A chest the player placed pre-registered an empty grid on
   * placement, so crafted chests never roll free treasure.
   */
  openChestUI(tileX, tileY) {
    const key = `${tileX},${tileY}`;
    const wasClosed = this.world.getTile(tileX, tileY) === TILES.CHEST;
    if (!this.chestStorage[key]) {
      if (this.mp && this.mp.isClient) {
        // Sealed-chest loot is rolled by the HOST, so two players can never
        // open two different treasures out of one chest. The panel shows
        // empty for the few milliseconds it takes the real grid to arrive.
        this.chestStorage[key] = this.makeEmptyChestSlots();
        this.mp.requestChest(tileX, tileY);
      } else if (wasClosed) {
        const slots = this.makeEmptyChestSlots();
        const loot = this.rollChestLoot(tileX, tileY);
        for (let i = 0; i < loot.length; i++) slots[i] = loot[i];
        this.chestStorage[key] = slots;
        this.chestsOpened = (this.chestsOpened || 0) + 1;
        this.journey?.recordActivity('treasure', tileX * TILE_SIZE + 12, tileY * TILE_SIZE);
        this.logDiscovery('first_chest', '🧰 First Chest Opened!', 40);
      } else {
        // Opened by the pre-storage loot system (or a save that predates it):
        // that loot already went straight to the bag, so it comes back empty.
        this.chestStorage[key] = this.makeEmptyChestSlots();
      }
    }
    if (wasClosed) this.world.setTile(tileX, tileY, TILES.CHEST_OPEN);
    this.openChest = { x: tileX, y: tileY };
    const modal = document.getElementById('chest-modal');
    if (modal) modal.classList.remove('hidden');
    this.renderChestUI();
  }

  /** Shut the storage panel. Safe to call when nothing is open. */
  closeChestUI() {
    const modal = document.getElementById('chest-modal');
    if (modal) modal.classList.add('hidden');
    this.openChest = null;
  }

  /** Draw both grids of the chest panel: the chest slots and a bag mirror. */
  renderChestUI() {
    if (!this.openChest) return;
    const grid = document.getElementById('chest-grid');
    const invGrid = document.getElementById('chest-inv-grid');
    if (!grid || !invGrid) return;
    const slots = this.getChestSlots(this.openChest.x, this.openChest.y);

    grid.innerHTML = '';
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const filled = slot.id !== 'empty';
      const div = document.createElement('div');
      div.className = `inv-slot chest-slot ${filled ? 'filled' : ''}`;
      const data = filled ? ITEMS[slot.id] : null;
      this.tip(div, data
        ? `${data.name}${slot.count > 1 ? ` x${slot.count}` : ''} — click to take, Shift+click for one`
        : 'Empty chest slot');
      if (filled) {
        div.textContent = data ? data.icon : '📦';
        if (slot.count > 1) {
          const c = document.createElement('span');
          c.className = 'slot-count';
          c.textContent = slot.count;
          div.appendChild(c);
        }
        div.addEventListener('click', (event) => this.takeFromChest(i, !event.shiftKey));
      }
      grid.appendChild(div);
    }

    const used = slots.filter(s => s.id !== 'empty').length;
    const countEl = document.getElementById('chest-count');
    if (countEl) countEl.textContent = `${used} / 18 slots in use`;

    invGrid.innerHTML = '';
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      const filled = slot && slot.id !== 'empty';
      const div = document.createElement('div');
      div.className = `inv-slot chest-slot ${filled ? 'filled' : ''}`;
      const data = filled ? ITEMS[slot.id] : null;
      this.tip(div, data
        ? `${data.name}${slot.count > 1 ? ` x${slot.count}` : ''} — click to store, Shift+click for one`
        : 'Empty bag slot');
      if (filled) {
        div.textContent = data ? data.icon : '📦';
        if (slot.count > 1) {
          const c = document.createElement('span');
          c.className = 'slot-count';
          c.textContent = slot.count;
          div.appendChild(c);
        }
        div.addEventListener('click', (event) => this.moveToChest(i, !event.shiftKey));
      }
      invGrid.appendChild(div);
    }
    // The chest's 18 slots just changed. Single-player this is a no-op; in a
    // session the new grid is broadcast (host) or sent to the host (guest).
    this.mp?.chestChanged();
  }

  /**
   * Bag -> chest. Click moves the whole stack, Shift+click moves one, exactly
   * what the panel's hint line promises.
   */
  moveToChest(index, wholeStack = true) {
    if (!this.openChest) return false;
    if (!Number.isInteger(index) || index < 0 || index >= this.inventory.length) return false;
    const slot = this.inventory[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;
    const item = ITEMS[slot.id];
    if (!item) return false;
    const slots = this.getChestSlots(this.openChest.x, this.openChest.y);
    const stackMax = item.stackMax || 99;

    // Top up a stack of the same item first, then claim an empty slot.
    let target = slots.find(s => s.id === slot.id && s.count < stackMax);
    if (!target) {
      target = slots.find(s => s.id === 'empty');
      if (!target) {
        this.showToast('🧰 The chest is full.');
        return false;
      }
      target.id = slot.id;
      target.count = 0;
    }

    const moveCount = wholeStack ? slot.count : 1;
    const moved = Math.min(moveCount, stackMax - target.count, slot.count);
    target.count += moved;
    slot.count -= moved;
    if (slot.count <= 0) this.inventory[index] = { id: 'empty', count: 0 };

    this.sound.playPickup();
    this.showToast(`🧰 Stored ${moved}× ${item.name}.`);
    this.renderChestUI();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** Chest -> bag. Click takes the whole stack, Shift+click takes one. */
  takeFromChest(index, wholeStack = true) {
    if (!this.openChest) return false;
    const slots = this.getChestSlots(this.openChest.x, this.openChest.y);
    const slot = slots[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;
    const item = ITEMS[slot.id];
    if (!item) return false;
    const take = wholeStack ? slot.count : 1;
    if (!this.canAddItem(slot.id, take)) {
      this.showToast('🎒 Your bag is full.');
      return false;
    }
    this.addItem(slot.id, take);
    slot.count -= take;
    if (slot.count <= 0) slot.id = 'empty';
    this.sound.playPickup();
    this.showToast(`🧰 Took ${take}× ${item.name}.`);
    this.renderChestUI();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** One button that moves everything the bag holds into the chest. */
  chestQuickDeposit() {
    if (!this.openChest) return false;
    const slots = this.getChestSlots(this.openChest.x, this.openChest.y);
    let moved = 0;
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (!slot || slot.id === 'empty' || slot.count <= 0) continue;
      const stackMax = ITEMS[slot.id] ? (ITEMS[slot.id].stackMax || 99) : 99;
      // Existing stacks first, empty slots second — same order addItem uses.
      for (const target of slots) {
        if (target.id === slot.id && target.count < stackMax && slot.count > 0) {
          const m = Math.min(stackMax - target.count, slot.count);
          target.count += m;
          slot.count -= m;
          moved += m;
        }
      }
      for (const target of slots) {
        if (target.id === 'empty' && slot.count > 0) {
          const m = Math.min(stackMax, slot.count);
          target.id = slot.id;
          target.count = m;
          slot.count -= m;
          moved += m;
        }
      }
      if (slot.count <= 0) this.inventory[i] = { id: 'empty', count: 0 };
    }
    if (moved <= 0) {
      this.showToast('🧰 Nothing to deposit — the chest or your bag is empty.');
      return false;
    }
    this.sound.playPickup();
    this.showToast(`🧰 Deposited ${moved} item${moved === 1 ? '' : 's'}.`);
    this.renderChestUI();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** The other button: everything the chest holds walks back into the bag. */
  chestTakeAll() {
    if (!this.openChest) return false;
    const slots = this.getChestSlots(this.openChest.x, this.openChest.y);
    let moved = 0;
    let blocked = false;
    for (const slot of slots) {
      if (slot.id === 'empty' || slot.count <= 0) continue;
      if (!this.canAddItem(slot.id, slot.count)) {
        blocked = true;
        continue;
      }
      this.addItem(slot.id, slot.count);
      moved += slot.count;
      slot.id = 'empty';
      slot.count = 0;
    }
    if (moved <= 0) {
      this.showToast(blocked ? '🎒 Your bag is full.' : '🧰 The chest is empty.');
      return false;
    }
    this.sound.playPickup();
    this.showToast(`🎒 Took ${moved} item${moved === 1 ? '' : 's'} from the chest.`);
    if (blocked) this.showToast('🎒 Some items stayed behind — your bag is full.');
    this.renderChestUI();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  renderSaveManager() {
    const list = document.getElementById('save-slot-list');
    if (!list) return;
    list.innerHTML = '';
    for (let slot = 1; slot <= 3; slot++) {
      const key = this.slotKey(slot);
      let save = null;
      try { save = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
      const row = document.createElement('div');
      row.className = 'save-slot-card';
      const title = document.createElement('strong');
      title.textContent = save?.name || `World ${slot}`;
      const info = document.createElement('span');
      info.textContent = save ? `Day ${save.dayCount || 1}` : 'Empty world';
      const actions = document.createElement('div');
      actions.className = 'save-slot-actions';
      const load = document.createElement('button');
      load.className = 'ui-btn';
      load.textContent = key === this.saveKey ? 'CURRENT' : 'SWITCH';
      load.disabled = key === this.saveKey;
      load.onclick = () => { this.saveGame(true); localStorage.setItem('terracraft-active-save', String(slot)); location.reload(); };
      const rename = document.createElement('button');
      rename.className = 'ui-btn';
      rename.textContent = 'RENAME';
      rename.onclick = () => {
        const name = prompt('Name this save:', title.textContent);
        if (!name || !name.trim()) return;
        if (save) { save.name = name.trim(); localStorage.setItem(key, JSON.stringify(save)); }
        this.renderSaveManager();
      };
      const del = document.createElement('button');
      del.className = 'ui-btn danger';
      del.textContent = 'DELETE';
      del.onclick = () => {
        if (!confirm(`Delete ${title.textContent}? This cannot be undone.`)) return;
        localStorage.removeItem(key);
        this.renderSaveManager();
      };
      actions.append(load, rename, del);
      row.append(title, info, actions);
      list.appendChild(row);
    }
  }

  /**
   * Persistent player progression, kept separate from world geometry so old
   * worlds can migrate without discarding the characters' history.
   */
  progressToSave() {
    const safeNumber = value => Number.isFinite(value)
      ? Math.max(0, Math.min(1e12, Math.round(value * 100) / 100))
      : 0;
    const stats = {};
    for (const [key, value] of Object.entries(this.stats || {})) {
      if (typeof value === 'number') stats[key] = safeNumber(value);
    }
    const villagers = Array.isArray(this.villagersMet)
      ? this.villagersMet.filter(id => typeof id === 'string')
      : Object.keys(this.villagersMet || {}).filter(id => typeof id === 'string');

    return {
      stats,
      potionsUsed: safeNumber(this.potionsUsed),
      maxHpUpgrades: safeNumber(this.maxHpUpgrades),
      maxManaUpgrades: safeNumber(this.maxManaUpgrades),
      chestsOpened: safeNumber(this.chestsOpened),
      questsDone: safeNumber(this.questsDone),
      fishCaught: safeNumber(this.fishCaught),
      fishingSkill: safeNumber(this.fishingSkill),
      villagersMet: villagers.slice(0, 16),
      discoveryPoints: safeNumber(this.discoveryPoints),
      discoveries: this._discoveries ? [...this._discoveries].filter(id => typeof id === 'string').slice(0, 256) : [],
      discoveryLog: (this.discoveryLog || [])
        .filter(item => item && typeof item.id === 'string' && typeof item.label === 'string')
        .slice(0, 24)
        .map(item => ({ id: item.id.slice(0, 96), label: item.label.slice(0, 160), day: Math.max(1, Math.floor(item.day || 1)) })),
      bossKinds: Object.keys(this._bossKinds || {}).filter(key => key === 'forest' || key === 'knight' || key === 'demon'),
      journey: this.journey ? this.journey.toSave() : null
    };
  }

  /** Restore v10+ progression. Missing/invalid fields safely keep defaults. */
  restoreProgress(saved) {
    if (!saved || typeof saved !== 'object') return false;
    const safeNumber = (value, fallback = 0) => Number.isFinite(value)
      ? Math.max(0, Math.min(1e12, value))
      : fallback;
    for (const [key, value] of Object.entries(saved.stats || {})) {
      if (Object.prototype.hasOwnProperty.call(this.stats, key) && typeof value === 'number') {
        this.stats[key] = safeNumber(value);
      }
    }
    this.potionsUsed = safeNumber(saved.potionsUsed, this.potionsUsed);
    this.maxHpUpgrades = safeNumber(saved.maxHpUpgrades, this.maxHpUpgrades);
    this.maxManaUpgrades = safeNumber(saved.maxManaUpgrades, this.maxManaUpgrades);
    this.chestsOpened = safeNumber(saved.chestsOpened);
    this.questsDone = safeNumber(saved.questsDone);
    this.fishCaught = safeNumber(saved.fishCaught);
    this.fishingSkill = safeNumber(saved.fishingSkill, this.fishCaught);

    this.villagersMet = {};
    const validVillagers = new Set(['guide', 'prospector', 'scavenger']);
    if (Array.isArray(saved.villagersMet)) {
      for (const id of saved.villagersMet) if (validVillagers.has(id)) this.villagersMet[id] = true;
    }
    this.discoveryPoints = safeNumber(saved.discoveryPoints);
    this._discoveries = new Set(Array.isArray(saved.discoveries)
      ? saved.discoveries.filter(id => typeof id === 'string').slice(0, 256)
      : []);
    this.discoveryLog = (Array.isArray(saved.discoveryLog) ? saved.discoveryLog : [])
      .filter(item => item && typeof item.id === 'string' && typeof item.label === 'string')
      .slice(0, 24)
      .map(item => ({ id: item.id.slice(0, 96), label: item.label.slice(0, 160), day: safeNumber(item.day, 1) }));
    this._bossKinds = {};
    if (Array.isArray(saved.bossKinds)) {
      for (const key of saved.bossKinds) if (key === 'forest' || key === 'knight' || key === 'demon') this._bossKinds[key] = true;
    }
    this.journey?.fromSave(saved.journey);
    return true;
  }

  saveGame(silent = false) {
    // A guest never writes the world: the host owns the save, and on the
    // BroadcastChannel transport both tabs share one localStorage slot — a
    // guest autosave would overwrite the real world with a copy.
    if (this.mp && this.mp.isClient) {
      if (!silent) this.showToast('💾 The host saves this world — guests do not write it.');
      return;
    }
    let preferredName = `World ${this.saveKey.slice(-1)}`;
    try { preferredName = JSON.parse(localStorage.getItem(this.saveKey) || '{}').name || preferredName; } catch (_) {}
    // Autosave does not care that you are mid-fight, and the save file must
    // always describe the OVERWORLD: while the Ossuary owns the live buffers,
    // persistTiles/persistWalls hand back the stashed home copy. The clock and
    // the rainbow flag are stashed for the trip too, so they are read from the
    // same place. A player who logs out inside the rift comes back home, at the
    // spot the wormhole opened over, and arena loot is written from the stash.
    const inSpecialDimension = this.world.isInSpace() || this.world.isInOcean();
    const stashed = this.world.isInSpace() ? this.world.overworldStash
      : this.world.isInOcean() ? this.world.oceanStash : null;
    const pos = (inSpecialDimension && this.overworldReturnPos) ? this.overworldReturnPos : this.player;
    const savedDrops = (inSpecialDimension && this.dimensionStash) ? this.dimensionStash.drops : this.drops;
    const save = {
      name: preferredName,
      version: 17,
      timeOfDay: stashed ? stashed.timeOfDay : this.world.timeOfDay,
      dayCount: this.world.dayCount,
      tiles: Array.from(this.world.persistTiles()),
      walls: Array.from(this.world.persistWalls()),
      player: {
        x: pos.x,
        y: pos.y,
        hp: this.player.hp,
        mana: this.player.mana,
        stamina: this.player.stamina,
        hunger: this.player.hunger,
        equippedArmorId: this.equippedArmorId,
        equippedAccessoryId: this.equippedAccessoryId,
        selectedSlot: this.player.selectedSlot
      },
      inventory: this.inventory,
      cerberus: this.cerberus ? {
        x: (inSpace && this.overworldReturnPos ? this.overworldReturnPos.x : this.cerberus.x),
        y: (inSpace && this.overworldReturnPos ? this.overworldReturnPos.y : this.cerberus.y),
        tamed: this.cerberus.tamed,
        level: this.cerberus.level,
        hp: this.cerberus.hp,
        dead: this.cerberus.dead
      } : null,
      // Chest furniture: each chest's 18 slots, keyed by the tile it sits on.
      // Additive key — saves written before chests existed simply lack it and
      // load with no stored chest contents.
      chests: this.chestStorage,
      quests: this.npcs ? this.npcs.toSave() : null,
      underworld: (stashed ? stashed.underworld : this.world.underworld)
        ? { ...(stashed ? stashed.underworld : this.world.underworld) } : null,
      progress: this.progressToSave(),
      dungeon: (stashed ? stashed.dungeon : this.world.dungeon) || null,
      respawn: this.respawnPoint,
      bossDays: this.bossDaysDone,
      rainbowSeeded: (stashed ? stashed.rainbowSeeded : this.world.rainbowSeeded) === true,
      drops: savedDrops.map(drop => ({ id: drop.id, count: drop.count, x: drop.x, y: drop.y })),
      // Banked Sovereign HP: dying or retreating does not reset the fight, and
      // neither does closing the tab mid-fight — the live HP is what gets banked.
      dragonHP: (this.boss && this.boss.kind === 'dragon' && !this.boss.dead)
        ? Math.max(1, Math.round(this.boss.hp))
        : (Number.isFinite(this.dragonHP) ? this.dragonHP : null),
      leviathanHP: (this.boss && this.boss.kind === 'leviathan' && !this.boss.dead)
        ? Math.max(1, Math.round(this.boss.hp))
        : (Number.isFinite(this.leviathanHP) ? this.leviathanHP : null),
      leviathanSlain: this.leviathanSlain === true,
      // A pending charged re-entry is part of the promise ("it remembers you"),
      // so it survives a reload too — otherwise a player who quits during the
      // few seconds a rift takes to reopen loses the way back to their fight.
      riftReturnDelay: this.riftReturnDelay > 0 ? this.riftReturnDelay : null,
      // Whether the Sovereign has been killed. A dead dragon stays dead, so this
      // has to persist exactly as persistently as the banked HP does — a reload
      // must not re-arm a fight that was already won.
      dragonSlain: this.dragonSlain === true,
      // How many Rites of Waking this save has crafted. Zero means the first one
      // has not been made yet and it prices cheap; anything above zero prices it
      // as a repeat. Persisted, or a reload would hand the player a fresh cheap
      // rite every single time.
      ritesCrafted: this.ritesCrafted || 0,
      // How many Sovereigns this save has felled. Unlike dragonSlain this is
      // never cleared by waking a new one, so it can gate "first kill only" loot.
      dragonKills: this.dragonKills || 0,
      // A battle is never carried through a save: quitting or refreshing the page
      // ends the encounter (see loadGame), so there is no live boss left to write.
      // The key is kept so version-11 saves keep their exact shape.
      boss: null
    };

    try {
      localStorage.setItem(this.saveKey, JSON.stringify(save));
      if (!silent) this.showToast('💾 World saved.');
    } catch (error) {
      this.showToast('⚠️ Could not save this world.');
      console.error('Terracraft save failed:', error);
    }
  }

  loadGame(silent = false) {
    let save;
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return false;
      save = JSON.parse(raw);
    } catch (error) {
      this.showToast('⚠️ Save data is invalid.');
      console.error('Terracraft load failed:', error);
      return false;
    }

    const supportedVersion = save && Number.isInteger(save.version) && save.version >= 1 && save.version <= 17;
    if (!supportedVersion || !Array.isArray(save.tiles) || save.tiles.length !== this.world.tiles.length) {
      this.showToast('⚠️ Save data is incompatible.');
      return false;
    }

    this.world.timeOfDay = Number.isFinite(save.timeOfDay) ? save.timeOfDay : this.world.timeOfDay;
    this.world.dayCount = Number.isFinite(save.dayCount) ? save.dayCount : this.world.dayCount;
    this.world.tiles.set(save.tiles);
    if (save.version >= 12 && save.version <= 14) this.world.repairLegacyReef(save.version);
    if (save.version < 15) this.world.generateReef();
    this.leviathanHP = Number.isFinite(save.leviathanHP) ? Math.max(1, Math.min(110000, save.leviathanHP)) : null;
    this.leviathanSlain = save.leviathanSlain === true;
    this.cerberus = save.cerberus && typeof CerberusPet !== 'undefined'
      ? new CerberusPet(this.player.x, this.player.y, save.cerberus)
      : null;
    if (Array.isArray(save.walls) && save.walls.length === this.world.walls.length) {
      this.world.walls.set(save.walls);
    }
    if (save.version === 15) this.world.migrateLegacyReefTemple();
    if (save.version < 17) {
      this.world.migrateDistributedReefPearls();
      if (save.version !== 15) {
        const activePodiums = new Set(this.world.reefPodiums
          .map((podium, index) => this.world.getTile(podium.x, podium.y) === TILES.REEF_SHRINE_ACTIVE
            ? index : -1)
          .filter(index => index >= 0));
        this.world.buildReefTemple(activePodiums, true);
      }
    }
    // Both the static tile cache and the minimap's baked texture describe the
    // world that was just replaced; a warm cache would otherwise keep showing
    // the pre-load world until something happened to touch a tile.
    this.world._tileCacheDirty = true;
    if (this.minimap) this.minimap.markDirty();
    if (save.underworld && Number.isFinite(save.underworld.start) && Number.isFinite(save.underworld.castleX)) {
      this.world.underworld = { ...save.underworld };
    } else {
      this.world.ensureUnderworld(true);
    }
    this.world.dungeon = (save.dungeon && Number.isFinite(save.dungeon.altarX)) ? save.dungeon : null;
    if (!this.world.dungeon || this.world.dungeon.layoutVersion !== 2) {
      const oldDungeon = this.world.dungeon;
      this.world.migrateDungeon(oldDungeon);
    }
    if (save.version < 3) {
      this.world.landmarks = [];
      this.world.generateLandmarks();
    }

    // Progress first: it carries the permanent Life/Mana Crystal counts, and the
    // life/mana clamps below have to be evaluated against the upgraded caps —
    // clamping against the base 100/50 would shave the bonuses back off.
    this.restoreProgress(save.progress);
    this.applyPermanentUpgrades();

    if (save.player) {
      this.player.x = Number.isFinite(save.player.x) ? save.player.x : this.player.x;
      this.player.y = Number.isFinite(save.player.y) ? save.player.y : this.player.y;
      this.player.hp = Math.max(1, Math.min(this.player.maxHp, save.player.hp));
      this.player.mana = Math.max(0, Math.min(this.player.maxMana, save.player.mana));
      this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, save.player.stamina));
      this.player.hunger = Number.isFinite(save.player.hunger) ? Math.max(0, Math.min(this.player.maxHunger, save.player.hunger)) : this.player.maxHunger;
      this.equippedArmorId = ITEMS[save.player.equippedArmorId]?.type === 'armor' ? save.player.equippedArmorId : null;
      // Old saves predate the accessory slot: a missing field simply leaves it empty.
      this.equippedAccessoryId = ITEMS[save.player.equippedAccessoryId]?.type === 'accessory'
        ? save.player.equippedAccessoryId : null;
      this.player.selectedSlot = Math.max(0, Math.min(8, save.player.selectedSlot || 0));
    }

    if (Array.isArray(save.inventory)) {
      // Restore into however many slots the SAVE actually used, not however many
      // this session happens to have. Mapping over the current 40-slot array
      // silently threw away everything past slot 40 — which is exactly where a
      // backpack's extra slots live, so quitting with 55 slots came back to 40
      // with the tail of the bag missing.
      const wanted = Math.max(this.inventory.length, save.inventory.length);
      const restored = [];
      for (let i = 0; i < wanted; i++) {
        const slot = save.inventory[i];
        // A `creativeOnly` item (The Ban Hammer) has no legitimate presence in
        // a save: it can only ever have been granted by the creative menu, and
        // even then it does not survive a reload. Dropping it here means a
        // hand-edited or version-skewed save cannot smuggle one back in, which
        // is the whole point of the restriction. This restore path writes
        // straight into the array and so bypasses the addItem guard entirely —
        // the filter has to be explicit.
        const banned = slot && ITEMS[slot.id] && ITEMS[slot.id].creativeOnly;
        if (slot && ITEMS[slot.id] && Number.isFinite(slot.count) && !banned) {
          let remaining = Math.max(0, Math.floor(slot.count));
          if (remaining === 0) {
            restored.push({ id: 'empty', count: 0 });
            continue;
          }
          while (remaining > 0) {
            const count = Math.min(ITEMS[slot.id].stackMax, remaining);
            // Carry the favourite flag across every stack created while
            // upgrading older saves to the current stack limit.
            restored.push({ id: slot.id, count, fav: slot.fav === true });
            remaining -= count;
          }
          if (slot.count <= 0) restored.push({ id: 'empty', count: 0 });
        } else {
          restored.push({ id: 'empty', count: 0 });
        }
      }
      this.inventory = restored;
    }
    // A backpack in the bag means a bigger bag — on load exactly as on pickup.
    this.syncInventorySlots();
    if (save.version === 1) {
      if (this.countItem('arrow') === 0) this.addItem('arrow', 30);
      if (this.countItem('bomb') === 0) this.addItem('bomb', 2);
    }
    if (this.npcs) this.npcs.fromSave(save.quests);
    this.journey?.syncWorldFlags();

    // Sleep-bound respawn (only kept while the bed still exists).
    this.respawnPoint = (save.respawn && save.respawn.kind === 'bed' &&
      this.world.getTile(save.respawn.bedX, save.respawn.bedY) === TILES.BED)
      ? save.respawn : null;
    // Which prophesied nights the forest guardian has already visited.
    this.bossDaysDone = Array.isArray(save.bossDays) ? save.bossDays : [];
    // Older saves predate rainbow ore — seed the veins once.
    this.world.rainbowSeeded = save.rainbowSeeded === true;
    if (!this.world.rainbowSeeded) {
      this.world.seedRainbowOre(45);
      this.world.rainbowSeeded = true;
    }

    this.drops = Array.isArray(save.drops)
      ? save.drops.filter(drop => ITEMS[drop.id]).map(drop => new DropItem(drop.x, drop.y, drop.id, drop.count))
      : [];
    // Chest contents ride with the world. Saves that predate the feature start
    // with none, and the open panel is always shut first so a load can never
    // leave a chest UI pointing at coordinates the reloaded world replaced.
    this.closeChestUI();
    this.chestStorage = (save.chests && typeof save.chests === 'object' && !Array.isArray(save.chests))
      ? save.chests
      : {};
    this.monsters = [];
    this.projectiles = [];
    this.boss = null;
    // A save always describes the OVERWORLD, so whatever dimension the tab died
    // in, the player is put back home and the Ossuary is rebuilt from scratch on
    // the next trip. The Sovereign keeps the damage it had taken.
    if (this.world.isInSpace()) this.world.exitSpaceDimension();
    else if (this.world.isInOcean()) this.world.exitOceanDimension();
    this.wormhole = null;
    this.wormholeIntent = null;
    this.riftReturnDelay = 0;
    this.dimensionStash = null;
    this.sound.isBoss = false;
    this.dragonHP = Number.isFinite(save.dragonHP) ? save.dragonHP : null;
    // Killing the Sovereign is a fact about the world, not about the live boss,
    // so it survives the reload the same way the banked HP does. Without this,
    // refreshing the page after a kill re-armed the very fight the player won.
    this.dragonSlain = save.dragonSlain === true;
    this.ritesCrafted = Number.isFinite(save.ritesCrafted) && save.ritesCrafted > 0
      ? Math.floor(save.ritesCrafted) : 0;
    this.dragonKills = Number.isFinite(save.dragonKills) && save.dragonKills > 0
      ? Math.floor(save.dragonKills) : 0;
    // A reload describes the overworld: any death show still in the air — and
    // the victory screen it was holding back — both end here.
    this.dragonFinale = null;
    this.victoryDelay = 0;
    // Re-arm a re-entry that was still counting down when the tab died, but only
    // while there is actually a wounded Sovereign to go back to — and never after
    // the killing blow, because a slain dragon has nothing to return to.
    this.riftReturnDelay = (!this.dragonSlain && Number.isFinite(this.dragonHP) && Number.isFinite(save.riftReturnDelay))
      ? Math.max(1.5, save.riftReturnDelay) : 0;
    // Boss battles deliberately do NOT survive a reload. Re-instantiating the
    // saved boss used to drop it right back onto the player's saved position,
    // so refreshing (or loading) mid-fight resumed with the player already being
    // crushed — often killed before the first frame was even drawn. Loading a
    // world now always starts the fight over: the encounter is re-summonable
    // through [👁️ SUMMON BOSS] or whichever night/altar trigger started it.
    if (save.boss && !save.boss.dead &&
        Number.isFinite(save.boss.x) && Number.isFinite(save.boss.y)) {
      this.showToast('🛡️ You broke off the fight — the boss has fled.');
    }
    document.getElementById('boss-panel').classList.add('hidden');

    // A freshly loaded world also hands the player a moment of grace, so a
    // reload can never open with damage already ticking (lava, starvation, a
    // mob that spawned next to the saved position) before they can react.
    this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 2.5);

    // Saves that predate the secret dungeon get one retrofitted on load.
    if (!this.world.dungeon) this.world.generateSecretDungeon();
    this.renderHotbarUI();
    this.renderCraftingRecipes();
    this.renderInventoryGrid();
    this.journey?.renderHUD(true);
    if (!silent) this.showToast('↻ World loaded.');
    return true;
  }

  renderHotbarUI() {
    const hotbarEl = document.getElementById('hotbar');
    if (!hotbarEl) return;
    hotbarEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slot = this.inventory[i];
      const slotDiv = document.createElement('div');
      slotDiv.className = `hotbar-slot ${i === this.player.selectedSlot ? 'active' : ''}`;
      const itemData = slot && slot.id !== 'empty' ? ITEMS[slot.id] : null;
      // Deliberately aria-label and NOT this.tip(): hovering a hotbar slot must
      // never raise the cursor tooltip. The hotbar names the selected item
      // through #item-name-popup on switch instead.
      slotDiv.setAttribute('aria-label',
        itemData ? `${itemData.name}${slot.count > 1 ? ` x${slot.count}` : ''}` : `Hotbar slot ${i + 1}`);
      slotDiv.onclick = () => {
        this.player.selectedSlot = i;
        if (itemData?.type === 'armor') this.equipArmor(itemData.id);
        else if (itemData?.type === 'accessory') this.equipAccessory(itemData.id);
        this.updateHotbarUI();
      };

      const numSpan = document.createElement('span');
      numSpan.className = 'slot-num';
      numSpan.textContent = i + 1;
      slotDiv.appendChild(numSpan);

      if (slot && slot.id !== 'empty') {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'slot-icon';
        iconDiv.textContent = itemData ? itemData.icon : '📦';
        slotDiv.appendChild(iconDiv);

        if (slot.count > 1) {
          const countSpan = document.createElement('span');
          countSpan.className = 'slot-count';
          countSpan.textContent = slot.count;
          slotDiv.appendChild(countSpan);
        }
      }

      hotbarEl.appendChild(slotDiv);
    }
  }

  updateHotbarUI() {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((el, idx) => {
      if (idx === this.player.selectedSlot) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  toggleCraftingModal(force) {
    const modal = document.getElementById('crafting-modal');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    const show = force !== undefined ? force : isHidden;
    if (show) {
      this.closeChestUI();
      document.getElementById('inventory-modal')?.classList.add('hidden');
      modal.classList.remove('hidden');
      this.renderCraftingRecipes();
    } else {
      modal.classList.add('hidden');
    }
  }

  toggleInventoryModal(force) {
    const modal = document.getElementById('inventory-modal');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    const show = force !== undefined ? force : isHidden;
    if (show) {
      this.closeChestUI();
      document.getElementById('crafting-modal')?.classList.add('hidden');
      modal.classList.remove('hidden');
      this.renderInventoryGrid();
    } else {
      modal.classList.add('hidden');
    }
  }

  /**
   * Creative menu: hand yourself any item or block in the game.
   * Items are shown newest-category-first, filterable by a text search and a
   * category chip row, and clickable to add a stack straight to the bag.
   */
  toggleCreativeModal(force) {
    const modal = document.getElementById('creative-modal');
    if (!modal) return;
    const show = force !== undefined ? force : modal.classList.contains('hidden');
    if (show) {
      modal.classList.remove('hidden');
      if (this.creativeCategory === undefined) this.creativeCategory = 'all';
      this.renderCreativeMenu();
      // Focus the search box so you can just start typing.
      setTimeout(() => document.getElementById('creative-search')?.focus(), 30);
    } else {
      modal.classList.add('hidden');
    }
  }

  /** Which category chip an item belongs to, for the filter row. */
  creativeCategoryOf(item) {
    if (!item) return 'misc';
    if (item.type === 'tile') return 'blocks';
    if (item.type === 'weapon') return 'weapons';
    if (item.type === 'tool') return 'tools';
    if (item.type === 'armor') return 'armor';
    // Accessories ride along with armour in the ARMOR chip — there is no
    // separate bag category for a single item class.
    if (item.type === 'accessory') return 'armor';
    if (item.type === 'consumable') return 'consumables';
    if (item.type === 'ammo') return 'ammo';
    if (item.type === 'material') return 'materials';
    return 'misc';
  }

  renderCreativeMenu() {
    const grid = document.getElementById('creative-grid');
    if (!grid) return;

    const search = (document.getElementById('creative-search')?.value || '').trim().toLowerCase();
    const cat = this.creativeCategory || 'all';

    // Category chips, built once from whatever categories actually exist.
    const chips = document.getElementById('creative-categories');
    if (chips && !chips.dataset.built) {
      const order = ['all', 'blocks', 'weapons', 'tools', 'armor', 'consumables', 'ammo', 'materials', 'misc'];
      const labels = {
        all: 'ALL', blocks: 'BLOCKS', weapons: 'WEAPONS', tools: 'TOOLS',
        armor: 'ARMOR', consumables: 'POTIONS', ammo: 'AMMO', materials: 'MATERIALS', misc: 'MISC'
      };
      const present = new Set(Object.values(ITEMS).map(i => this.creativeCategoryOf(i)));
      chips.innerHTML = '';
      for (const key of order) {
        if (key !== 'all' && !present.has(key)) continue;
        const btn = document.createElement('button');
        btn.className = `creative-cat-btn ${key === cat ? 'active' : ''}`;
        btn.dataset.cat = key;
        btn.textContent = labels[key];
        btn.addEventListener('click', () => {
          this.creativeCategory = key;
          this.renderCreativeMenu();
        });
        chips.appendChild(btn);
      }
      chips.dataset.built = '1';
    } else if (chips) {
      for (const btn of chips.querySelectorAll('.creative-cat-btn')) {
        btn.classList.toggle('active', btn.dataset.cat === cat);
      }
    }

    // Filter the item table. Blocks are matched by name and id so both
    // "stone" and "brick" find what you expect.
    const matches = Object.values(ITEMS).filter(item => {
      if (cat !== 'all' && this.creativeCategoryOf(item) !== cat) return false;
      if (!search) return true;
      return item.name.toLowerCase().includes(search) || item.id.includes(search);
    });

    const countEl = document.getElementById('creative-count');
    if (countEl) {
      countEl.textContent = `${matches.length} item${matches.length === 1 ? '' : 's'}` +
        (search ? ` matching "${search}"` : '') + ' — click to add';
    }

    grid.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'creative-empty';
      empty.textContent = 'No items match that search.';
      grid.appendChild(empty);
      return;
    }

    const amount = document.getElementById('creative-fill-hotbar')?.checked ? 999 : null;

    for (const item of matches) {
      const cell = document.createElement('div');
      cell.className = 'creative-cell';
      cell.dataset.id = item.id;
      const stack = amount || item.stackMax || 99;
      this.tip(cell, `${item.name} (max ${item.stackMax || 99}) — click to add ${stack}`);

      const icon = document.createElement('span');
      icon.className = 'creative-cell-icon';
      icon.textContent = item.icon || '📦';
      cell.appendChild(icon);

      const badge = document.createElement('span');
      badge.className = 'creative-cell-count';
      badge.textContent = stack;
      cell.appendChild(badge);

      cell.addEventListener('click', () => {
        this.giveCreativeItem(item.id, stack);
        // Green flash so a click always visibly lands.
        cell.classList.add('flash');
        setTimeout(() => cell.classList.remove('flash'), 180);
      });

      grid.appendChild(cell);
    }
  }

  /** Add `count` of an item, reporting honestly when the bag cannot hold it. */
  giveCreativeItem(id, count) {
    const item = ITEMS[id];
    if (!item) return false;
    const wanted = Math.max(1, Math.floor(count || 1));
    const room = this.creativeCapacityFor(id);
    if (room <= 0) {
      this.showToast('🎒 Your bag is completely full.');
      return false;
    }
    const added = Math.min(wanted, room);
    this.addItem(id, added, true);
    this.renderInventoryGrid();
    this.sound.playPickup();
    // Same lookup the hotbar uses, so the twice-given item counts too.
    this.showToast(`${item.icon} ＋${added} ${item.name}${added < wanted ? ' (bag full)' : ''}`);
    return true;
  }

  /** How many more of `id` the inventory could physically accept. */
  creativeCapacityFor(id) {
    const stackMax = ITEMS[id]?.stackMax || 99;
    let capacity = 0;
    for (const slot of this.inventory) {
      if (slot.id === id) capacity += Math.max(0, stackMax - slot.count);
      else if (slot.id === 'empty') capacity += stackMax;
    }
    return capacity;
  }

  renderCraftingRecipes() {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = '';

    const categories = new Map([
      ['weapon', 'Weapons'],
      ['tool', 'Tools'],
      ['armor', 'Armor'],
      ['accessory', 'Accessories'],
      ['ammo', 'Ammunition'],
      ['backpack', 'Backpacks'],
      ['consumable', 'Potions & Food'],
      ['tile', 'Blocks & Furniture'],
      ['material', 'Materials']
    ]);
    const grouped = new Map();
    for (const recipe of RECIPES) {
      const result = ITEMS[recipe.result.id];
      const category = categories.get(result ? result.type : '') || 'Other';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(recipe);
    }

    for (const [category, recipes] of grouped) {
      const section = document.createElement('section');
      section.className = 'recipe-category';
      const heading = document.createElement('h4');
      heading.className = 'recipe-category-title';
      heading.textContent = category;
      section.appendChild(heading);

      const cards = document.createElement('div');
      cards.className = 'recipe-category-grid';
      for (const r of recipes) {
        const resItem = ITEMS[r.result.id];
        const canCraft = this.canCraftRecipe(r);
        const card = document.createElement('div');
        card.className = `recipe-card ${canCraft ? 'craftable' : ''}`;

        const info = document.createElement('div');
        info.className = 'recipe-info';
        const icon = document.createElement('div');
        icon.className = 'recipe-icon';
        icon.textContent = resItem ? resItem.icon : '🛠️';

        const details = document.createElement('div');
        details.className = 'recipe-details';
        const name = document.createElement('h5');
        name.textContent = r.dynamicRite ? this.riteOfWakingName(this.ritesCrafted > 0) : r.name;
        const reqs = document.createElement('div');
        reqs.className = 'recipe-reqs';
        reqs.textContent = this.recipeMaterials(r)
          .map(m => `${ITEMS[m.id].name}: ${this.countItem(m.id)}/${m.count}`).join(', ');
        details.appendChild(name);
        details.appendChild(reqs);
        info.appendChild(icon);
        info.appendChild(details);

        const btn = document.createElement('button');
        btn.className = 'craft-btn';
        btn.textContent = 'CRAFT';
        btn.disabled = !canCraft;
        btn.onclick = () => this.craftRecipe(r);
        card.appendChild(info);
        card.appendChild(btn);
        cards.appendChild(card);
      }
      section.appendChild(cards);
      list.appendChild(section);
    }
  }

  renderInventoryGrid() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // ---- Cross-world shared stash (Ctrl+click to store, click to take back) ----
    const shared = document.getElementById('shared-grid');
    if (shared) {
      shared.innerHTML = '';
      for (let i = 0; i < 18; i++) {
        const slot = this.savedInventory[i] || { id: 'empty', count: 0 };
        const div = document.createElement('div');
        const filled = slot.id !== 'empty';
        div.className = `inv-slot shared-slot ${filled ? 'filled' : ''}`;
        const data = filled ? ITEMS[slot.id] : null;
        this.tip(div, data
          ? `${data.name}${slot.count > 1 ? ` x${slot.count}` : ''} — click to take one back`
          : 'Empty shared slot');
        if (filled) {
          div.textContent = data ? data.icon : '📦';
          if (slot.count > 1) {
            const c = document.createElement('span');
            c.className = 'slot-count';
            c.textContent = slot.count;
            div.appendChild(c);
          }
          div.addEventListener('click', () => this.takeFromShared(i));
        }
        shared.appendChild(div);
      }
      const countEl = document.getElementById('shared-count');
      if (countEl) {
        const used = this.savedInventory.filter(s => s.id !== 'empty').length;
        countEl.textContent = `${used} / 18 in use`;
      }
    }

    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      const filled = slot && slot.id !== 'empty';
      const div = document.createElement('div');
      const fav = this.isFavorited(slot);
      const selected = this.selectedSlotIndex === i;
      div.className = `inv-slot ${filled ? 'filled' : ''}${fav ? ' favorited' : ''}${selected ? ' selected' : ''}`;
      const itemData = filled ? ITEMS[slot.id] : null;
      this.tip(div, itemData
        ? `${itemData.name}${slot.count > 1 ? ` x${slot.count}` : ''}` +
          (fav ? ' — ⭐ favourited (cannot be deleted or dropped)' : '') +
          (selected ? '\nShift+click again to deselect' : '\nShift+click to select')
        : (i < 9 ? `Hotbar slot ${i + 1}` : 'Empty inventory slot'));
      div.draggable = filled;
      div.addEventListener('click', (event) => {
        // Ctrl+click stashes the item in the cross-world bag instead of the
        // usual equip / select behaviour.
        if (event.ctrlKey) { event.preventDefault(); this.moveToShared(i); return; }
        // Shift+click selects the slot for the favourite/delete controls. It has
        // to be checked BEFORE the hotbar behaviour below, or selecting a
        // hotbar slot would also re-equip it.
        if (event.shiftKey) { event.preventDefault(); this.selectInventorySlot(i); return; }
        this.handleInventorySlotClick(i);
      });
      div.addEventListener('contextmenu', (event) => {
        // Right-click also stashes — quicker than reaching for Ctrl.
        if (!filled) return;
        event.preventDefault();
        this.moveToShared(i);
      });
      div.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(i));
        event.dataTransfer.effectAllowed = 'move';
        div.classList.add('dragging');
        // Remember the source ourselves. The HTML5 drag data store is put into
        // PROTECTED MODE once the drag ends, so getData() inside dragend returns
        // "" — reading it there made Number("") === 0, and every drag-out dropped
        // whatever was in slot 0 instead of the slot you actually grabbed.
        this.dragSourceIndex = i;
      });
      div.addEventListener('dragend', (event) => {
        div.classList.remove('dragging');
        const sourceIndex = this.dragSourceIndex;
        this.dragSourceIndex = null;
        // Dragging outside any inventory slot drops the stack into the world.
        if (!document.elementFromPoint(event.clientX, event.clientY)?.closest('#inventory-grid')) {
          this.dropInventoryStack(sourceIndex);
        }
      });
      div.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        div.classList.add('drag-over');
      });
      div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
      div.addEventListener('drop', (event) => {
        event.preventDefault();
        div.classList.remove('drag-over');
        const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
        this.moveInventoryItem(sourceIndex, i);
      });
      if (slot && slot.id !== 'empty') {
        const item = ITEMS[slot.id];
        div.textContent = item ? item.icon : '📦';
        if (slot.count > 1) {
          const count = document.createElement('span');
          count.className = 'slot-count';
          count.textContent = slot.count;
          div.appendChild(count);
        }
        if (fav) {
          const star = document.createElement('span');
          star.className = 'slot-star';
          star.textContent = '⭐';
          div.appendChild(star);
        }
      }
      grid.appendChild(div);
    }
    this.renderSlotManager();
  }

  /**
   * Is this bag slot favourited?
   *
   * A favourite is a promise to the player that the stack cannot be thrown away
   * by accident. It is stored ON THE SLOT (`fav: true`) rather than as a set of
   * item ids, because two stacks of the same item are separate objects and the
   * player may well only want to protect one of them.
   */
  isFavorited(slot) {
    return !!(slot && slot.fav);
  }

  /** Does any slot in the bag hold a FAVOURITED stack of this item id? */
  hasFavoritedStack(id) {
    return this.inventory.some(s => s && s.id === id && this.isFavorited(s));
  }

  /** Refuse an action that would destroy a favourited stack. Returns false if blocked. */
  guardFavorite(slot, action) {
    if (!this.isFavorited(slot)) return true;
    const data = ITEMS[slot.id];
    this.showToast(`⭐ ${data ? data.name : slot.id} is favourited — unfavourite it to ${action}.`);
    if (this.sound && typeof this.sound.playPlayerHurt === 'function') this.sound.playPlayerHurt();
    return false;
  }

  /** Select a bag slot for the favourite/delete controls. */
  selectInventorySlot(index) {
    const slot = this.inventory[index];
    if (!slot || slot.id === 'empty') {
      this.selectedSlotIndex = null;
    } else {
      // Clicking the already-selected slot clears the selection.
      this.selectedSlotIndex = this.selectedSlotIndex === index ? null : index;
    }
    this.renderSlotManager();
    this.renderInventoryGrid();
  }

  clearSlotSelection() {
    this.selectedSlotIndex = null;
    this.renderSlotManager();
    this.renderInventoryGrid();
  }

  /**
   * The Sort button: tidy the whole bag in one press. Identical stacks merge
   * first (up to each item's stackMax), then everything is ordered by kind and
   * name, with the empty slots collected at the end. A merged stack stays
   * favourited when any part of it was, so sorting can never strip the delete
   * guard - and the selection is cleared, because the slot it pointed at is
   * about to hold something else.
   */
  sortInventory() {
    const total = this.inventory.length;
    const list = [];
    const merged = new Map();
    for (const slot of this.inventory) {
      if (!slot || slot.id === 'empty' || !(slot.count > 0)) continue;
      const data = ITEMS[slot.id];
      if (!data) {
        // An id the registry does not know survives untouched rather than
        // being silently deleted by a tidying pass.
        list.push({ id: slot.id, count: slot.count, fav: slot.fav === true });
        continue;
      }
      let heap = merged.get(slot.id);
      if (!heap) {
        heap = { id: slot.id, count: 0, fav: false, stackMax: Math.max(1, data.stackMax || 1) };
        merged.set(slot.id, heap);
      }
      heap.count += slot.count;
      heap.fav = heap.fav || slot.fav === true;
    }
    if (!list.length && !merged.size) {
      this.showToast('🎒 Nothing to sort.');
      return false;
    }
    // Merging only ever frees slots, so this can never overflow the bag.
    for (const heap of merged.values()) {
      let rest = heap.count;
      while (rest > 0) {
        const take = Math.min(heap.stackMax, rest);
        list.push({ id: heap.id, count: take, fav: heap.fav });
        rest -= take;
      }
    }
    const rank = { weapon: 0, tool: 1, armor: 2, ammo: 3, consumable: 4, tile: 5, material: 6 };
    const rankOf = (id) => {
      const data = ITEMS[id];
      return data && Number.isFinite(rank[data.type]) ? rank[data.type] : 9;
    };
    const nameOf = (id) => (ITEMS[id] && ITEMS[id].name) || id;
    list.sort((a, b) => {
      const ra = rankOf(a.id);
      const rb = rankOf(b.id);
      if (ra !== rb) return ra - rb;
      return nameOf(a.id).localeCompare(nameOf(b.id));
    });
    for (let i = 0; i < total; i++) this.inventory[i] = list[i] || { id: 'empty', count: 0 };
    this.selectedSlotIndex = null;
    this.renderSlotManager();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    this.showToast('🎒 Bag sorted.');
    return true;
  }

  /** Toggle the favourite flag on the selected slot. */
  toggleSelectedFavorite() {
    const i = this.selectedSlotIndex;
    const slot = i == null ? null : this.inventory[i];
    if (!slot || slot.id === 'empty') return false;
    slot.fav = !slot.fav;
    this.sound.playPickup();
    this.showToast(slot.fav
      ? `⭐ ${ITEMS[slot.id].name} favourited — it can't be deleted or dropped.`
      : `${ITEMS[slot.id].name} unfavourited.`);
    this.renderSlotManager();
    this.renderInventoryGrid();
    return true;
  }

  /**
   * Delete the selected stack outright (no world drop, no recovery).
   * This is the destructive one, so a favourite blocks it too — un-favouriting
   * first is the deliberate act of saying "yes, really throw this away".
   */
  deleteSelectedSlot() {
    const i = this.selectedSlotIndex;
    const slot = i == null ? null : this.inventory[i];
    if (!slot || slot.id === 'empty') return false;
    if (!this.guardFavorite(slot, 'delete it')) return false;
    const data = ITEMS[slot.id];
    this.inventory[i] = { id: 'empty', count: 0 };
    this.selectedSlotIndex = null;
    this.particles.bloodBurst(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2, '#7f1d1d', 14);
    this.showToast(`🗑️ Deleted ${data ? data.name : slot.id}.`);
    this.renderSlotManager();
    this.renderInventoryGrid();
    this.renderHotbarUI();
    return true;
  }

  /** Refresh the label + button states for the slot-manager row. */
  renderSlotManager() {
    const label = document.getElementById('slot-selected-label');
    const favBtn = document.getElementById('slot-fav-btn');
    const delBtn = document.getElementById('slot-delete-btn');
    const clrBtn = document.getElementById('slot-clear-btn');
    if (!label || !favBtn || !delBtn || !clrBtn) return;
    const slot = this.selectedSlotIndex == null ? null : this.inventory[this.selectedSlotIndex];
    const filled = !!(slot && slot.id !== 'empty');
    const fav = this.isFavorited(slot);
    const data = filled ? ITEMS[slot.id] : null;
    label.textContent = filled
      ? `${data ? data.icon + ' ' + data.name : slot.id}${slot.count > 1 ? ' x' + slot.count : ''}${fav ? '  ⭐' : ''}`
      : 'No slot selected';
    favBtn.disabled = !filled;
    delBtn.disabled = !filled;
    clrBtn.disabled = !filled;
    favBtn.classList.toggle('is-on', fav);
    favBtn.textContent = fav ? '★ UNFAVOURITE' : '☆ FAVOURITE';
    delBtn.textContent = fav ? '🗑 DELETE (locked)' : '🗑 DELETE';
  }

  /**
   * Throw the selected hotbar stack on the floor, the way Minecraft's Q does.
   *
   * `amount` is how many to drop; Infinity drops the whole stack. Shift+G drops
   * a single item, which is the part people actually use — feeding one ore to a
   * furnace, or nudging a stack out from behind something.
   *
   * This routes through dropInventoryStack so there is exactly ONE definition
   * of "throwing something on the floor". That matters: the favourite guard,
   * the throw velocity, the pickup delay and the toast all live there, and a
   * second copy of any of them is a second place for them to be wrong.
   */
  dropSelectedStack(amount = Infinity) {
    const index = this.player.selectedSlot;
    const slot = this.inventory[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;

    return this.dropInventoryStack(index, amount);
  }

  dropInventoryStack(index, amount = Infinity) {
    const slot = this.inventory[index];
    if (!slot || slot.id === 'empty' || slot.count <= 0) return false;
    // A favourited stack cannot be thrown on the floor. This is the guard the
    // drag-out path lands in, so it covers every way of dropping from the bag —
    // and the G key as well, since that routes through here too.
    if (!this.guardFavorite(slot, 'drop it')) return false;
    const count = Number.isFinite(amount)
      ? Math.max(1, Math.min(slot.count, Math.floor(amount)))
      : slot.count;
    const facing = this.player.facing < 0 ? -1 : 1;
    const drop = new DropItem(
      Math.max(0, Math.min(
        this.world.pixelWidth - 14,
        this.player.x + this.player.width / 2 + facing * TILE_SIZE * 4 - 7
      )),
      this.player.y + this.player.height / 2 - 7,
      slot.id,
      count
    );
    // Spawn four tiles ahead and leave a generous pickup grace period. Repeated
    // drops therefore cannot be vacuumed back into the bag before the player
    // can move away or inspect the stack.
    drop.vx = facing * 2.5;
    drop.vy = -4.5;
    drop.life = 90;
    drop.pickupDelay = 2.5;
    this.drops.push(drop);
    slot.count -= count;
    if (slot.count <= 0) this.inventory[index] = { id: 'empty', count: 0 };
    this.renderInventoryGrid();
    this.updateHotbarUI();
    this.showToast(`Dropped ${count} ${ITEMS[slot.id]?.name || slot.id}.`);
    return true;
  }

  handleInventorySlotClick(index) {
    const item = ITEMS[this.inventory[index]?.id];
    if (item?.type === 'armor') {
      this.equipArmor(item.id);
      return;
    }
    if (item?.type === 'accessory') {
      this.equipAccessory(item.id);
      return;
    }
    if (index < 9) {
      this.player.selectedSlot = index;
      this.updateHotbarUI();
      this.renderInventoryGrid();
    }
  }

  equipArmor(id) {
    if (!ITEMS[id] || ITEMS[id].type !== 'armor' || this.countItem(id) <= 0) return;
    this.equippedArmorId = id;
    this.player.activeArmor = ITEMS[id];
    this.showToast(`🛡️ Equipped ${ITEMS[id].name}`);
    this.renderHotbarUI();
    this.renderInventoryGrid();
  }

  /** Accessory slot (wings). Deliberately separate from the plate. */
  equipAccessory(id) {
    if (!ITEMS[id] || ITEMS[id].type !== 'accessory' || this.countItem(id) <= 0) return;
    this.equippedAccessoryId = id;
    // setWings sizes the flight tank and the cooldown off the item and hands
    // back a full tank for the new pair, so swapping Angel -> Dragon never
    // leaves you holding an empty tank you did not spend.
    this.player.setWings(ITEMS[id]);
    const wing = ITEMS[id];
    const detail = wing.grantsFlight
      ? ` — ${Math.round(wing.flightTime || 0)}s of flight, then ${Math.round(wing.flightCooldown || 0)}s to recharge`
      : '';
    this.showToast(`🪽 Equipped ${wing.name}${detail}`);
    this.renderHotbarUI();
    this.renderInventoryGrid();
  }

  moveInventoryItem(sourceIndex, targetIndex) {
    if (!Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex)) return;
    if (sourceIndex < 0 || sourceIndex >= this.inventory.length || targetIndex < 0 || targetIndex >= this.inventory.length) return;
    if (sourceIndex === targetIndex || this.inventory[sourceIndex].id === 'empty') return;

    const source = this.inventory[sourceIndex];
    const target = this.inventory[targetIndex];
    const item = ITEMS[source.id];
    if (target.id === source.id && item && item.stackMax > 1) {
      const room = Math.max(0, item.stackMax - target.count);
      const moved = Math.min(room, source.count);
      if (moved > 0) {
        target.count += moved;
        target.fav = target.fav === true || source.fav === true;
        source.count -= moved;
        if (source.count <= 0) this.inventory[sourceIndex] = { id: 'empty', count: 0 };
        if (targetIndex < 9) this.player.selectedSlot = targetIndex;
        this.updateHotbarUI();
        this.renderHotbarUI();
        this.renderInventoryGrid();
        this.showToast(`🎒 Combined ${moved} ${item.name}.`);
        return;
      }
    }

    [this.inventory[sourceIndex], this.inventory[targetIndex]] = [this.inventory[targetIndex], this.inventory[sourceIndex]];
    if (targetIndex < 9) this.player.selectedSlot = targetIndex;
    this.updateHotbarUI();
    this.renderHotbarUI();
    this.renderInventoryGrid();
    this.showToast(`🎒 Moved ${ITEMS[this.inventory[targetIndex].id]?.name || this.inventory[targetIndex].id}`);
  }

  // ---- THE RITE OF WAKING ------------------------------------------------
  // There is only one rite in the game. It is deliberately cheap the FIRST time
  // and sharply more expensive every time after: the first Sovereign is meant to
  // be a prepared expedition, not a wall, and once you have proven you can do it
  // the arena should cost you something real. `repeat` is true from the second
  // craft onwards, so the displayed cost can never disagree with what
  // canCraftRecipe/craftRecipe actually charge.
  riteOfWakingCost(repeat) {
    return repeat
      ? [
        { id: 'dragonbone', count: 34 },
        { id: 'meteor_shard', count: 26 },
        { id: 'nebula_crystal', count: 18 },
        { id: 'demon_soul', count: 6 },
        { id: 'crystal', count: 20 },
        { id: 'life_crystal', count: 2 }
      ]
      : [
        { id: 'dragonbone', count: 10 },
        { id: 'meteor_shard', count: 8 },
        { id: 'nebula_crystal', count: 4 }
      ];
  }

  riteOfWakingName(repeat) {
    return repeat
      ? 'Rite of Waking (wakes another Sovereign — the Ossuary has been claimed)'
      : 'Rite of Waking (wakes the first Sovereign in the Ossuary)';
  }

  canCraftRecipe(recipe) {
    // The rite is priced at craft time rather than baked into RECIPES, so the
    // card the player is reading and the cost charged are the same list.
    const materials = this.recipeMaterials(recipe);
    for (const m of materials) {
      if (this.countItem(m.id) < m.count) return false;
    }
    return true;
  }

  /** The live cost of a recipe, resolving the rite's first-vs-repeat pricing. */
  recipeMaterials(recipe) {
    if (recipe && recipe.dynamicRite) return this.riteOfWakingCost(this.ritesCrafted > 0);
    return recipe.materials;
  }

  craftRecipe(recipe) {
    if (!this.canCraftRecipe(recipe) || !this.canAddItem(recipe.result.id, recipe.result.count)) {
      this.showToast('🎒 Not enough inventory space.');
      return;
    }
    const materials = this.recipeMaterials(recipe);
    // A favourited stack is consumed by crafting just as surely as by dropping
    // it, so it blocks here too. The player is being explicit (they picked the
    // recipe and the cost is on screen), but silently eating something they
    // marked "don't throw this away" is exactly the accident a favourite is
    // meant to prevent — so ask first, and say how to undo it.
    for (const m of materials) {
      if (this.hasFavoritedStack(m.id)) {
        const data = ITEMS[m.id];
        this.showToast(`⭐ ${data ? data.name : m.id} is favourited — unfavourite it to craft this.`);
        return;
      }
    }
    for (const m of materials) {
      this.removeItem(m.id, m.count);
    }
    this.addItem(recipe.result.id, recipe.result.count);
    // Counted here, not on the card: the FIRST rite is the cheap one, and this
    // runs exactly once per craft so the next craft prices as a repeat.
    if (recipe.dynamicRite) this.ritesCrafted = (this.ritesCrafted || 0) + 1;
    this.stats.itemsCrafted += 1;
    this.journey?.recordActivity('craft', this.player.x + this.player.width / 2, this.player.y);
    this.sound.playCraft();
    this.showToast(`✨ Crafted ${ITEMS[recipe.result.id].name}!`);
    this.renderCraftingRecipes();
    this.renderInventoryGrid();
    this.renderHotbarUI();
  }

  /**
   * Put up to `count` of `id` in the bag and return HOW MANY actually fit.
   *
   * This is the honest version of the operation. `addItem` used to answer this
   * with a boolean while quietly adding whatever fitted and discarding the rest
   * of the answer — so "false" meant "partly done", which is exactly the kind
   * of thing a caller cannot see. The magnet pickup branched on that boolean and
   * left the whole dropped stack on the floor, then re-added the part that fit
   * on every following frame: a full bag plus one drop minted items forever.
   *
   * Callers that need the truth (anything where a partial result would lose or
   * duplicate items) use this and consume exactly what came back.
   */
  addItemUpTo(id, count = 1, creative = false) {
    const item = ITEMS[id];
    const stackMax = item ? item.stackMax : 256;
    if (item && item.creativeOnly && !creative) return 0;

    let remaining = count;
    if (!Number.isFinite(remaining)) return 0;
    remaining = Math.max(0, Math.floor(remaining));
    if (remaining === 0) return 0;

    // A backpack enlarges the bag, so the room it needs has to exist before we
    // try to put it IN the bag — otherwise a full bag can never pick up the very
    // thing that would have made room.
    if (item && item.type === 'backpack') this.syncInventorySlots();

    // 1. Fill existing stacks without exceeding their maximum.
    for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
      if (this.inventory[i].id === id && this.inventory[i].count < stackMax) {
        const added = Math.min(stackMax - this.inventory[i].count, remaining);
        this.inventory[i].count += added;
        remaining -= added;
      }
    }

    // 2. Fill empty slots as needed.
    for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
      if (this.inventory[i].id === 'empty') {
        const added = Math.min(stackMax, remaining);
        this.inventory[i] = { id, count: added };
        remaining -= added;
      }
    }

    this.renderHotbarUI();
    return count - remaining;
  }

  /** True only if the WHOLE count fitted. See addItemUpTo for the partial case. */
  addItem(id, count = 1, creative = false) {
    const item = ITEMS[id];
    // `creativeOnly` items (The Ban Hammer) exist to be had from the creative
    // menu and nowhere else. Enforcing it HERE rather than by simply not
    // wiring a recipe or drop table means every route into the bag is covered
    // at once: crafting, mining, fishing, chest and boss loot, hotkeyed item
    // pickup, and a hand-edited or version-skewed save that tries to restore
    // one. Only the creative menu passes `creative = true`.
    if (item && item.creativeOnly && !creative) return false;
    return this.addItemUpTo(id, count, creative) >= (Number.isFinite(count) ? count : 0);
  }

  canAddItem(id, count = 1) {
    const item = ITEMS[id];
    // A creativeOnly item can never legitimately arrive through this path, so
    // reporting "yes, there is room" would invite every caller (crafting, the
    // saved-inventory restore, stack consolidation, quest rewards) to hand one
    // out and rely on addItem to refuse it late. Answer no here as well, so the
    // refusal happens before anything is spent or consumed.
    if (item && item.creativeOnly) return false;
    const stackMax = item ? item.stackMax : 256;
    let capacity = 0;
    for (const slot of this.inventory) {
      if (slot.id === id) capacity += Math.max(0, stackMax - slot.count);
      if (slot.id === 'empty') capacity += stackMax;
    }
    return capacity >= count;
  }

  removeItem(id, count = 1) {
    let remaining = count;
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].id === id) {
        if (this.inventory[i].count > remaining) {
          this.inventory[i].count -= remaining;
          remaining = 0;
          break;
        } else {
          remaining -= this.inventory[i].count;
          this.inventory[i] = { id: 'empty', count: 0 };
        }
      }
    }
    this.renderHotbarUI();
    return remaining === 0;
  }

  countItem(id) {
    let sum = 0;
    for (const slot of this.inventory) {
      if (slot.id === id) sum += slot.count;
    }
    return sum;
  }

  /**
   * Attack timing gate. Returns false while the previous use is still cooling
   * down, otherwise arms the cooldown and returns true.
   */
  canAttackNow(itemData) {
    if (this.attackCooldown > 0) return false;
    const haste = this.buffs.multiplier('haste') || 1;
    this.attackCooldown = ((itemData && itemData.useTime) || 0.25) / haste;
    return true;
  }

  /**
   * Spark burst thrown off the blade where it connects.
   *
   * Every melee weapon used to land identically. This tints the spray by the
   * weapon the player is actually holding and throws the shards out along the
   * swing, so a hit reads as that weapon hitting rather than a generic thud.
   * Kept to a handful of particles so a fast weapon cannot flood the screen.
   */
  spawnWeaponImpact(x, y, weaponId, angle, isCrit) {
    // Palette per weapon family. Falls back to neutral steel.
    const palette = weaponId === 'aurora_blade' ? ['#22d3ee', '#a855f7', '#f472b6', '#facc15']
      : weaponId === 'prismatic_saber' ? ['#f472b6', '#facc15', '#22d3ee']
      : weaponId === 'hellstone_greatblade' || weaponId === 'inferno_brand' ? ['#fb923c', '#f97316', '#fef3c7', '#7f1d1d']
      : weaponId === 'soulfire_repeater' ? ['#fb7185', '#f43f5e', '#fed7aa']
      : weaponId === 'abyssal_staff' ? ['#e879f9', '#a855f7', '#f5d0fe']
      : weaponId === 'diamond_blade' ? ['#67e8f9', '#e0f2fe', '#a5f3fc']
      : weaponId === 'cursed_edge' ? ['#a855f7', '#f0abfc', '#c7d2fe']
      : weaponId === 'crystal_spear' ? ['#c4b5fd', '#ede9fe', '#a5b4fc']
      : ['#fef3c7', '#fde68a', '#e2e8f0'];

    const count = isCrit ? 14 : 8;
    const spread = isCrit ? 2.4 : 1.6;
    // Debris flies forward along the swing and scatters around it.
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const spd = 1.5 + Math.random() * (isCrit ? 5 : 3.2);
      this.particles.addParticle(
        x, y,
        Math.cos(a) * spd, Math.sin(a) * spd - 0.8,
        i === 0 ? '#ffffff' : palette[i % palette.length],
        (isCrit ? 2.5 : 1.8) + Math.random() * 2.2,
        0.2 + Math.random() * 0.22,
        0.12, true
      );
    }
    // One bright core flash right on the contact point.
    this.particles.addParticle(x, y, 0, 0, '#ffffff', isCrit ? 7 : 5, 0.14, 0, true);
  }

  /**
   * Roll final damage: base x damage buffs, plus a crit chance built from the
   * weapon's own bonus (on top of the 20% baseline) and any crit buffs.
   */
  rollDamage(baseDamage, itemData) {
    const critChance = 0.2 + ((itemData && itemData.critBonus) || 0) + this.buffs.bonus('crit');
    const crit = Math.random() < critChance;
    let damage = baseDamage * (this.buffs.multiplier('damage') || 1);
    if (crit) damage *= 1.8;
    return { damage: Math.max(1, Math.round(damage)), crit };
  }

  /**
   * Ceiling on how much a single NON-BOSS contact hit may cost the player.
   *
   * Reported as "a normal spawning mob hits like a boss, even in OP armour".
   * The armour ladder was never the whole story: raw natural-spawn bites top
   * out around 28-46, elites multiplied that by 1.35, and Player.takeDamage
   * only subtracts a percentage plus a weighted flat slice — so with the best
   * plate in the game a trash mob could still take a large bite out of a 100 HP
   * bar, and several of them landing together was lethal.
   *
   * The fix is a hard ceiling expressed as a fraction of the player's own max
   * HP, applied BEFORE armour. It scales with progression (so a fully-healed
   * endgame player is not protected by an absolute number) and it cannot make
   * a hit free — the armour ladder and the 1 HP minimum still apply on top.
   * Bosses bypass this entirely via `isBoss`, since a boss is *meant* to be
   * the thing that can hurt you.
   */
  trashDamageCeiling(raw, isBoss) {
    if (isBoss) return raw;
    const cap = Math.max(8, Math.ceil((this.player.maxHp || 100) * 0.14));
    return Math.min(raw, cap);
  }

  /**
   * Route every hit on the player through here so the vignette, screen shake
   * and death cause are always consistent.
   *
   * `sourceY` is optional and only used by multiplayer: a source point that
   * includes its height lets the host decide WHICH character the hit belongs
   * to (its own player or a guest standing closer to whatever swung). Hit
   * points with no source (lava, starvation) always stay on the host.
   */
  damagePlayer(amount, sourceX, cause, isBoss = false, sourceY = null) {
    if (this.mp && this.mp.routeDamage(amount, sourceX, sourceY, cause, isBoss)) return 0;
    const capped = this.trashDamageCeiling(amount, isBoss);
    const taken = this.player.takeDamage(capped, this.sound, this.particles, sourceX);
    if (taken <= 0) return 0;
    // Any hit interrupts regeneration for four seconds. See updatePlayer.
    this.regenLock = 4;
    this.stats.damageTaken += taken;
    this.feel.hurt(Math.min(0.85, 0.32 + taken / 60));
    this.feel.shake(0.22 + Math.min(0.3, taken / 90));
    if (cause) this.deathCause = cause;
    if (this.player.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.onPlayerDeath();
    }
    return taken;
  }

  /**
   * Re-derive the player's life/mana caps from the permanent crystal counts.
   *
   * The save file persists how many Life/Mana Crystals were ever drunk
   * (progress.maxHpUpgrades / maxManaUpgrades), NOT the resulting caps. A fresh
   * Player starts at the base 100/50, so loadGame has to replay those counts or
   * every reload silently strips the permanent upgrades. Drinking a crystal
   * goes through here too, which keeps the two paths from drifting apart.
   */
  applyPermanentUpgrades() {
    const p = this.player;
    p.maxHp = p.baseMaxHp + this.maxHpUpgrades * (ITEMS.life_crystal.maxHpBonus || 0);
    p.maxMana = p.baseMaxMana + this.maxManaUpgrades * (ITEMS.mana_crystal.maxManaBonus || 0);
    p.hp = Math.min(p.hp, p.maxHp);
    p.mana = Math.min(p.mana, p.maxMana);
  }

  /** Death bookkeeping: stats, buffs, screens. */
  onPlayerDeath() {
    this.stats.deaths += 1;
    this.buffs.clear();
    this.feel.reset();
    const causeEl = document.getElementById('death-cause');
    if (causeEl) causeEl.textContent = this.deathCause;
    const statsEl = document.getElementById('death-stats');
    if (statsEl) statsEl.textContent = this.describeRun();
    document.getElementById('death-screen')?.classList.remove('hidden');
  }

  /** One tiny keypress handler that is not a game action: the fishing bite. */
  onFishingKey() {
    const f = this.fishing;
    if (!f || !f.active) return false;
    if (f.hooked) {
      this.reelIn();
      return true;
    }
    // Reeling before the bite just aborts the cast — a small cost, no reward.
    this.stopFishing('You reeled in too early.');
    return true;
  }

  /**
   * Start fishing.
   *
   * The rod is a tool, so it otherwise swings at whatever the mouse points at.
   * Right-clicking water with it casts instead, which keeps the control scheme
   * exactly as-is: left click is still "use the thing in my hand".
   */
  castFishingLine(tileX, tileY) {
    const rod = this.inventory[this.player.selectedSlot];
    if (!rod || rod.id !== 'fishing_rod' || this.countItem('fishing_rod') <= 0) return false;
    if (this.fishing && this.fishing.active) {
      this.showToast('🎣 You already have a line in the water.');
      return true;
    }
    if (this.world.getTile(tileX, tileY) !== TILES.WATER) return false;

    const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    if (Math.hypot(tileX - pTileX, tileY - pTileY) > 7.5) {
      this.showToast('🎣 That water is out of reach.');
      return true;
    }

    // Better rods and calmer water bite sooner; the spread keeps it from
    // feeling like a menu bar filling up on a schedule.
    const base = 2.6 - Math.min(1.5, (this.fishingSkill || 0) * 0.12);
    const wait = Math.max(0.7, base + Math.random() * 2.4);
    this.fishing = {
      active: true, hooked: false, wait, hookedFor: 0,
      bobX: tileX * TILE_SIZE + TILE_SIZE / 2,
      bobY: tileY * TILE_SIZE + 6,
      castAt: this.stats.playTime
    };
    this.sound.playPlace();
    this.particles.addParticle(this.fishing.bobX, this.fishing.bobY, 0, -0.4, '#bae6fd', 3, 0.5, 0, true);
    this.showToast('🎣 Line cast… wait for the bite, then press A/D again.');
    return true;
  }

  /** Run the fishing timer. Called once per frame from update(). */
  updateFishing(dt) {
    const f = this.fishing;
    if (!f || !f.active) return;

    // Casting is cancelled by a stale rod, by moving away, or by the water
    // freezing over / draining away.
    const rod = this.inventory[this.player.selectedSlot];
    const stillHolding = rod && rod.id === 'fishing_rod' && this.countItem('fishing_rod') > 0;
    const movedTooFar = Math.hypot(
      f.bobX - (this.player.x + this.player.width / 2),
      f.bobY - (this.player.y + this.player.height / 2)
    ) > 15 * TILE_SIZE;
    if (!stillHolding || movedTooFar) {
      this.stopFishing(stillHolding ? 'The fish stopped biting.' : 'You put the rod away.');
      return;
    }

    // A gentle bob in the water, so a cast is always visibly alive.
    if (Math.random() < 0.25) {
      this.particles.addParticle(f.bobX + (Math.random() - 0.5) * 6, f.bobY, 0, -0.3, 'rgba(186,230,253,0.7)', 2, 0.4, 0, true);
    }

    if (!f.hooked) {
      f.wait -= dt;
      if (f.wait <= 0) {
        f.hooked = true;
        // The window scales gently with skill — a reward for fishing a lot.
        f.hookedFor = 1.0 + Math.min(1.2, (this.fishingSkill || 0) * 0.08);
        this.sound.playPickup();
        this.showAnnouncement('🎣 SOMETHING IS BITING!');
        this.particles.magicSparkle(f.bobX, f.bobY, '#bae6fd', 14);
      }
      return;
    }

    // Gobble time. Press A/D in this window or the catch escapes.
    f.hookedFor -= dt;
    if (Math.random() < 0.5) {
      this.particles.addParticle(
        f.bobX + (Math.random() - 0.5) * 10, f.bobY - 2,
        (Math.random() - 0.5) * 1.4, -1.2 - Math.random() * 1.2,
        '#7dd3fc', 2 + Math.random() * 2, 0.45, 0.02, true
      );
    }
    if (f.hookedFor <= 0) this.stopFishing('🐟 It slipped off the hook.');
  }

  /** Resolve a successful catch. */
  reelIn() {
    const f = this.fishing;
    if (!f || !f.active || !f.hooked) return;
    const night = this.world.isNight();

    // Weighted table, night-shifted, with the rare koi as the long-term hook.
    let table = [
      ['fish_minnow', 46], ['fish_bass', 26], ['sunken_boot', 14],
      ['gold_ore', 6], ['fish_koi', 4], ['crystal', 3], ['diamond', 1]
    ];
    if (this.world.isReefAtX(f.bobX / TILE_SIZE) || this.world.isInOcean()) {
      table = [
        ['fish_clownfish', 28], ['fish_parrotfish', 22], ['fish_lionfish', 17],
        ['fish_turtle', 13], ['fish_manta', 10], ['fish_angler', 7], ['coral_fragment', 3]
      ];
    }
    if (night) {
      table = this.world.isReefAtX(f.bobX / TILE_SIZE) || this.world.isInOcean()
        ? [
          ['fish_clownfish', 18], ['fish_parrotfish', 17], ['fish_lionfish', 20],
          ['fish_turtle', 10], ['fish_manta', 14], ['fish_angler', 16], ['coral_fragment', 5]
        ] : [
        ['fish_minnow', 34], ['fish_bass', 30], ['sunken_boot', 10],
        ['crystal', 12], ['fish_koi', 7], ['diamond', 4], ['fallen_star', 3]
      ];
    }
    let roll = Math.random() * table.reduce((sum, t) => sum + t[1], 0);
    let caught = table[0][0];
    for (const [id, weight] of table) {
      roll -= weight;
      if (roll <= 0) { caught = id; break; }
    }

    const count = caught === 'sunken_boot' ? 1 : 1 + (Math.random() < 0.25 ? 1 : 0);
    this.fishingSkill = (this.fishingSkill || 0) + 1;
    this.fishCaught = (this.fishCaught || 0) + 1;

    const reward = ITEMS[caught];
    this.addItem(caught, count);
    this.sound.playCraft();
    this.particles.magicSparkle(f.bobX, f.bobY, '#fde047', 20);
    this.journey?.recordActivity('fish', f.bobX, f.bobY);
    this.showToast(`🎣 Caught ${count}× ${reward ? reward.name : caught}! (Angler level ${this.fishingSkill})`);

    if (this.fishingSkill === 1) {
      this.logDiscovery('first_fish', '🎣 First Fish Caught!', 40);
    } else if (this.fishingSkill % 10 === 0) {
      this.showAnnouncement(`🎣 Angler level ${this.fishingSkill}!`);
    }
    if (caught === 'fish_koi') this.logDiscovery('first_koi', '🎏 Golden Koi — a rare catch!', 120);

    this.renderHotbarUI();
    this.fishing = null;
  }

  stopFishing(message) {
    const f = this.fishing;
    if (f) this.particles.addParticle(f.bobX, f.bobY, 0, -0.5, 'rgba(186,230,253,0.6)', 3, 0.5, 0, true);
    this.fishing = null;
    if (message) this.showToast(message);
  }

  /** One-line summary of the current run, used on death and victory screens. */
  describeRun() {
    const minutes = Math.floor(this.stats.playTime / 60);
    return `Day ${this.world.dayCount} · ${minutes}m played · ${this.stats.kills} kills · ${this.stats.blocksMined} blocks mined · ${this.potionsUsed} potions`;
  }

  // ============================================================
  // SETTLEMENT SCORE — a Journal of things you have accomplished
  // ============================================================

  /**
   * A loose "how far have I got" score, deliberately weighted toward doing a
   * bit of everything rather than grinding one activity. Every entry is already
   * tracked, so this adds no bookkeeping to the hot path.
   */
  scoreBreakdown() {
    const s = this.stats;
    const memories = this._bossKinds ? Object.keys(this._bossKinds).length : 0;
    const villagers = Object.keys(this.villagersMet || {}).length;
    const biomes = this.journey ? this.journey.biomes.size : 0;
    const journeyGoals = this.journey ? this.journey.completed.size : 0;
    const discoveries = this._discoveries ? this._discoveries.size : 0;
    const rows = [
      ['Days survived', this.world.dayCount - 1, 30],
      ['Monsters slain', s.kills, 10],
      ['Elite kills', s.eliteKills, 25],
      ['Bosses defeated', s.bossKills, 250],
      ['Different bosses', memories, 400],
      ['Items crafted', s.itemsCrafted || 0, 20],
      ['Wood gathered', s.woodCollected || 0, 3],
      ['Blocks mined', s.blocksMined, 1],
      ['Blocks placed', s.blocksPlaced, 1],
      ['Damage dealt', Math.round(s.damageDealt), 0.2],
      ['Treasure chests opened', this.chestsOpened || 0, 20],
      ['Quests completed', this.questsDone || 0, 60],
      ['Villagers befriended', villagers, 40],
      ['Fish caught', this.fishCaught || 0, 15],
      ['Biomes discovered', biomes, 100],
      ['Deepest descent', this.journey ? this.journey.maxDepth : 0, 15],
      ['Discoveries logged', discoveries, 35],
      ['Journey goals completed', journeyGoals, 250]
    ];
    let total = 0;
    const out = [];
    for (const [label, value, weight] of rows) {
      if (!value) continue;
      const points = Math.round(value * weight);
      total += points;
      out.push({ label, value, points });
    }
    out.sort((a, b) => b.points - a.points);
    return { total, rows: out };
  }

  /**
   * Record something the player has never done in this world before.
   *
   * This is what makes a long session keep giving: the first time you open a
   * chest, finish a quest or meet a villager, the moment is named and scored
   * instead of silently blending into the rest of the run. Duplicates are free
   * to call — the set lookup is O(1) and returns immediately.
   */
  logDiscovery(id, label, points = 0) {
    if (!this._discoveries) this._discoveries = new Set();
    if (this._discoveries.has(id)) return false;
    this._discoveries.add(id);
    this.discoveryPoints = (this.discoveryPoints || 0) + points;
    this.discoveryLog = this.discoveryLog || [];
    this.discoveryLog.unshift({ id, label, day: this.world.dayCount });
    if (this.discoveryLog.length > 24) this.discoveryLog.length = 24;
    this.showAnnouncement(label);
    this.feel.heal(0.22);
    if (points) this.showToast(`✨ Discovery logged: ${label} (+${points})`);
    else this.showToast(`✨ Discovery logged: ${label}`);
    this.journey?.noteDiscovery();
    return true;
  }

  /** Render the journal modal. Recomputed on open — it is a static snapshot. */
  renderJournal() {
    const body = document.getElementById('journal-body');
    if (!body) return;
    const { total, rows } = this.scoreBreakdown();
    const discoveries = this._discoveries ? this._discoveries.size : 0;

    const rankInfo = this.journey
      ? JOURNEY_RANKS[this.journey.rankIndex()]
      : { name: 'Wandering Sprout' };
    const rank = rankInfo.name;
    const journeyHTML = this.journey ? this.journey.getJournalHTML() : '';

    const breakdown = rows.map(r =>
      `<div class="journal-row"><span>${r.label}</span>` +
      `<span class="journal-value">${r.value.toLocaleString()}</span>` +
      `<strong>${r.points.toLocaleString()}</strong></div>`
    ).join('');

    const log = (this.discoveryLog || []).map(d =>
      `<li><span class="journal-day">Day ${d.day}</span> ${d.label}</li>`
    ).join('') || '<li class="journal-empty">Nothing recorded yet — go and explore.</li>';

    body.innerHTML =
      `<div class="journal-score">
         <div class="journal-total">${total.toLocaleString()}</div>
         <div class="journal-meta">
           <span class="journal-rank">${rank}</span>
           <span>${discoveries} discover${discoveries === 1 ? 'y' : 'ies'} · Day ${this.world.dayCount}</span>
         </div>
       </div>
       <h4>JOURNEY CHECKLIST</h4>
        ${journeyHTML}
        <h4>POINT BREAKDOWN</h4>
       <div class="journal-table">${breakdown || '<p class="journal-empty">Play a little and this fills up.</p>'}</div>
       <h4>DISCOVERY LOG</h4>
       <ul class="journal-log">${log}</ul>`;
  }

  toggleJournal(force) {
    const modal = document.getElementById('journal-modal');
    if (!modal) return;
    const show = typeof force === 'boolean' ? force : modal.classList.contains('hidden');
    if (show) {
      this.renderJournal();
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  /** True while any modal (crafting, chest, guide) is covering the screen. */
  isModalOpen() {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    return !!(modals && modals.length);
  }

  /** Pause / resume the simulation (ESC or P). */
  togglePause(force) {
    this.paused = typeof force === 'boolean' ? force : !this.paused;
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
      if (this.paused) overlay.classList.remove('hidden');
      else overlay.classList.add('hidden');
    }
    if (this.paused) {
      this.input.mouseDown = false;
      this.input.mouseRightDown = false;
      this.input.keys = {};
    }
    return this.paused;
  }

  /**
   * Apply one potion straight from the bag. Handles healing, buffs, permanent
   * life/mana upgrades. Potions can be used consecutively without a cooldown.
   */
  consumePotion(itemData) {
    if (!itemData) return false;
    const isPermanent = !!(itemData.maxHpBonus || itemData.maxManaBonus);
    if (!isPermanent && itemData.heal && this.player.hp >= this.player.maxHp) {
      this.showToast('❤️ Life is already full.');
      return false;
    }
    if (!this.removeItem(itemData.id, 1)) return false;

    this.potionsUsed += 1;
    const parts = [];
    let permanent = '';

    if (itemData.maxHpBonus) {
      this.maxHpUpgrades += 1;
      const before = this.player.maxHp;
      this.applyPermanentUpgrades();
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.player.maxHp - before));
      permanent = `❤️ Max life increased to ${this.player.maxHp}!`;
    }
    if (itemData.maxManaBonus) {
      this.maxManaUpgrades += 1;
      const before = this.player.maxMana;
      this.applyPermanentUpgrades();
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + (this.player.maxMana - before));
      permanent = `✨ Max mana increased to ${this.player.maxMana}!`;
    }
    if (itemData.heal) {
      const restored = this.player.heal(itemData.heal, this.particles);
      if (restored > 0) {
        this.feel.heal(0.3);
        parts.push(`+${restored} life`);
      }
    }
    if (itemData.hunger) {
      this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + itemData.hunger);
      parts.push(`+${itemData.hunger} hunger`);
    }
    if (itemData.mana) {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + itemData.mana);
      parts.push(`+${itemData.mana} mana`);
    }
    if (itemData.buff) {
      this.buffs.add(itemData.buff, itemData.buffTime || 180);
      const def = BUFF_DEFS[itemData.buff];
      if (def) parts.push(`${def.icon} ${def.name}`);
    }

    this.sound.playPickup();
    if (permanent) {
      this.showAnnouncement(permanent);
      this.particles.magicSparkle(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        '#f472b6', 30
      );
    } else if (parts.length) {
      this.showToast(`${itemData.icon} ${parts.join(' · ')}`);
    }
    this.buffs.renderHUD(document);
    return true;
  }

  /** Drink the most impactful buff potion currently in the bag (Q key). */
  quickBuff() {
    const order = ['wrath_potion', 'ironskin_potion', 'swiftness_potion', 'regeneration_potion', 'miners_potion'];
    const drinkable = order.filter(id => this.countItem(id) > 0);
    if (!drinkable.length) {
      this.showToast('🎒 No buff potions in the bag.');
      return false;
    }
    // Prefer something that is not already active.
    const pick = drinkable.find(id => !this.buffs.has(ITEMS[id].buff)) || drinkable[0];
    return this.consumePotion(ITEMS[pick]);
  }

  quickHeal() {
    if (this.player.hp >= this.player.maxHp) {
      this.showToast('❤️ Life is already full.');
      return false;
    }
    if (this.countItem('healing_potion') <= 0) {
      this.showToast('🧪 No healing potions in the bag.');
      return false;
    }
    return this.consumePotion(ITEMS.healing_potion);
  }

  useConsumable(itemData) {
    if (!itemData) return false;
    // Buff potions, Life Crystals and Mana Crystals share the potion pipeline.
    if (itemData.buff || itemData.maxHpBonus || itemData.maxManaBonus || itemData.id === 'healing_potion') {
      return this.consumePotion(itemData);
    }
    if (itemData.heal && !itemData.hunger && this.player.hp >= this.player.maxHp) {
      this.showToast('❤️ Life is already full.');
      return;
    }
    if (itemData.hunger && this.player.hp >= this.player.maxHp && this.player.hunger >= this.player.maxHunger) {
      this.showToast('🍖 You are already well fed.');
      return;
    }
    if (itemData.mana && this.player.mana >= this.player.maxMana) {
      this.showToast('✨ Mana is already full.');
      return;
    }

    const held = this.inventory[this.player.selectedSlot];
    if (!this.removeItem(held.id, 1)) return;
    if (itemData.heal) {
      const restored = this.player.heal(itemData.heal, this.particles);
      this.showToast(`${itemData.icon} Restored ${restored} Life!`);
    }
    if (itemData.hunger) {
      this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + itemData.hunger);
      // A good meal grants the Well Fed buff instead of a bare number bump.
      this.buffs.add('well_fed', 420);
      this.showToast(`${itemData.icon} Well fed! +${itemData.hunger} hunger`);
    }
    if (itemData.mana) {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + itemData.mana);
      this.particles.magicSparkle(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#60a5fa', 16);
      this.showToast(`${itemData.icon} Restored ${itemData.mana} Mana!`);
    }
    this.sound.playPickup();
    this.buffs.renderHUD(document);
  }

  useBomb() {
    const held = this.inventory[this.player.selectedSlot];
    const centerX = this.input.mouseX + this.camera.x;
    const centerY = this.input.mouseY + this.camera.y;
    this.removeItem(held.id, 1);
    this.particles.bloodBurst(centerX, centerY, '#f97316', 28);

    for (const monster of this.monsters) {
      if (Math.hypot(monster.x + monster.width / 2 - centerX, monster.y + monster.height / 2 - centerY) <= 105) {
        monster.takeDamage(45, this.sound, this.particles, true);
      }
    }
    if (this.boss && !this.boss.dead) {
      // A bomb is a wide blast, so it is allowed to catch the spine too — and
      // whatever it catches pays that part's own price. The blast does NOT go
      // through solid rock: the thrower must see the boss, same as melee.
      const struck = typeof this.boss.nearestHitTarget === 'function'
        ? this.boss.nearestHitTarget(centerX, centerY, 105)
        : (Math.hypot(this.boss.x + this.boss.width / 2 - centerX,
                      this.boss.y + this.boss.height / 2 - centerY) <= 105
            ? { x: this.boss.x + this.boss.width / 2, y: this.boss.y + this.boss.height / 2, head: true }
            : null);
      const seen = struck && this.bossLineOfSight(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        struck.x, struck.y) ? struck : null;
      if (seen) {
        this.boss.takeDamage(
          typeof this.boss.scaleDamageFor === 'function'
            ? this.boss.scaleDamageFor(seen, 45) : 45,
          this.sound, this.particles, true);
      }
    }
    this.sound.playDig(true);
    this.showToast('💥 Bomb detonated!');
  }

  showToast(text) {
    const cont = document.getElementById('toast-container');
    if (!cont) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    cont.appendChild(toast);
    setTimeout(() => { try { if (typeof toast.remove === 'function') toast.remove(); else if (cont.removeChild) cont.removeChild(toast); } catch (_) {} }, 2500);
  }

  showAnnouncement(text) {
    const banner = document.getElementById('announcement-banner');
    const bannerText = document.getElementById('announcement-text');
    if (!banner || !bannerText) return;
    bannerText.textContent = text;
    banner.classList.remove('hidden');
    // Reset animation
    banner.style.animation = 'none';
    banner.offsetHeight; // trigger reflow
    banner.style.animation = null;
    setTimeout(() => banner.classList.add('hidden'), 3500);
  }

  interactWithSpecialTile(tileX, tileY) {
    const tile = this.world.getTile(tileX, tileY);
    if (tile === TILES.REEF_SHRINE || tile === TILES.REEF_SHRINE_ACTIVE) {
      const playerX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const playerY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      if (Math.hypot(tileX - playerX, tileY - playerY) > 7) return false;
      if (tile === TILES.REEF_SHRINE_ACTIVE) {
        this.showToast('🪸 This podium is already glowing. Offer a pearl at each of the four podiums.');
        return true;
      }
      if (!this.removeItem('sacred_pearl', 1)) {
        this.showToast('🫧 This temple podium needs a Sacred Pearl from the deep reef.');
        return true;
      }
      this.world.setTile(tileX, tileY, TILES.REEF_SHRINE_ACTIVE);
      this.sound.playHit();
      this.particles.magicSparkle((tileX + 0.5) * TILE_SIZE, (tileY + 0.5) * TILE_SIZE, '#67e8f9', 30);
      const podiums = this.world.reefPodiums || this.world.reefShrines;
      const remaining = podiums.filter(podium =>
        this.world.getTile(podium.x, podium.y) !== TILES.REEF_SHRINE_ACTIVE).length;
      if (remaining === 0) {
        const portal = this.world.reefPortal;
        this.world.setTile(portal.x, portal.y, TILES.OCEAN_PORTAL);
        this.showAnnouncement('🌊 THE FOUR PEARLS AWAKEN THE TIDAL GATE!');
        this.showToast('The portal between the temple podiums is open. Prepare your diving gear before entering.');
        this.logDiscovery('reef_portal', '🌊 The Four Pearls Awakened the Tidal Gate', 500);
      } else {
        this.showToast(`🪸 Pearl placed. ${remaining} more offering${remaining === 1 ? '' : 's'} needed to light the Tide Gate.`);
      }
      this.saveGame(true);
      return true;
    }
    if (tile === TILES.OCEAN_PORTAL || tile === TILES.DORMANT_OCEAN_PORTAL) {
      const playerX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const playerY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      if (Math.hypot(tileX - playerX, tileY - playerY) > 7) return false;
      if (this.world.isInOcean()) {
        if (this.mp && this.mp.status !== 'idle') {
          this.showToast('📡 Leave the multiplayer session before travelling between dimensions.');
          return true;
        }
        this.openWormhole('overworld', (tileX + 0.5) * TILE_SIZE, (tileY - 1) * TILE_SIZE, true);
        return true;
      }
      const podiums = this.world.reefPodiums || this.world.reefShrines;
      const allAwake = podiums &&
        podiums.every(podium => this.world.getTile(podium.x, podium.y) === TILES.REEF_SHRINE_ACTIVE);
      if (!allAwake || tile !== TILES.OCEAN_PORTAL) {
        this.showToast('🫧 The Tide Gate is dormant. Offer one Sacred Pearl at each of the four temple podiums.');
        return true;
      }
      if (this.mp && this.mp.status !== 'idle') {
        this.showToast('📡 The ocean dimension is solo-only for now. Leave the multiplayer session to enter.');
        return true;
      }
      if (this.boss && !this.boss.dead) {
        this.showToast('⚠️ Finish your current boss battle before entering the Tide Gate.');
        return true;
      }
      this.openWormhole('ocean', (tileX + 0.5) * TILE_SIZE, (tileY - 1) * TILE_SIZE);
      return true;
    }
    // (CHEST_OPEN is no longer a dead end here — both chest states fall
    // through to the shared chest branch further down and open the panel.)
    // The drowned chapel oath-seal. Its ward must be defeated before the way opens.
    if (tile === TILES.DUNGEON_GATE) {
      const d = this.world.dungeon;
      if (d && !d.gateDefeated) {
        if (this.boss && !this.boss.dead) { this.showToast('⚠️ Finish your current battle first.'); return true; }
        if (!this.monsters.some(m => m.dungeonGatekeeper && !m.dead)) {
          if (this.mp && this.mp.isClient) {
            // The host owns the warden; it arrives down the snapshot lane.
            this.mp.requestGate(tileX, tileY);
            this.showToast('Defeat the Hollow Warden to break the oath-seal.');
            return true;
          }
          const gate = new Monster(tileX * TILE_SIZE, (tileY - 1) * TILE_SIZE - 2, 'cave_spider');
          gate.makeElite();
          gate.hp = gate.maxHp = 850;
          gate.damage = 30;
          gate.dungeonGatekeeper = true;
          this.monsters.push(gate);
          this.sound.playBossRoar();
          this.showAnnouncement('🕷️ THE HOLLOW WARDEN AWAKENS');
          this.showToast('Defeat the Hollow Warden to break the oath-seal.');
        }
        return true;
      }
      this.world.setTile(tileX, tileY, TILES.AIR);
      this.showToast('🔓 The oath-seal breaks. The stairway is open.');
      return true;
    }
    // The infernal gate seals the demon castle until the player reaches it.
    if (tile === TILES.DEMON_GATE) {
      const castle = this.world.underworld;
      if (!castle) return true;
      this.world.setTile(tileX, tileY, TILES.AIR);
      castle.active = true;
      this.journey?.discoverUnderworld();
      this.logDiscovery('demon_castle', '🔥 DISCOVERED THE HELLBOUND CASTLE!', 300);
      this.showAnnouncement('🔥 THE HELLBOUND CASTLE OPENS!');
      this.showToast('The gate is open. Find the demon altar inside.');
      return true;
    }
    if (tile === TILES.DEMON_ALTAR) {
      const aTx = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const aTy = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      if (Math.hypot(tileX - aTx, tileY - aTy) > 7.5) return false;
      this.summonDemonBoss();
      return true;
    }
    // ---- The rift gate: the only hand-built doorway back to the overworld.
    // The Ossuary has no bed, so this is the retreat for a player who wants to
    // leave with the Sovereign still alive — the fight resumes at the same
    // damage when they come back. ----
    if (tile === TILES.RIFT_PORTAL) {
      if (!this.world.isInSpace()) {
        this.showToast('🕳️ The gate is a hole cut in the sky. It only answers from the far side.');
        return true;
      }
      const gTx = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const gTy = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      if (Math.hypot(tileX - gTx, tileY - gTy) > 6.5) return false;
      if (this.wormhole) {
        this.showToast('🌀 A wormhole is already tearing open…');
        return true;
      }
      // The whole frame is consumed by the passage it opens: one gate builds one
      // trip home, so a deliberate retreat always costs building a second one.
      for (let gx = tileX - 2; gx <= tileX + 2; gx++) {
        for (let gy = tileY - 4; gy <= tileY + 1; gy++) {
          if (this.world.getTile(gx, gy) === TILES.RIFT_PORTAL) this.world.setTile(gx, gy, TILES.AIR);
        }
      }
      this.openWormhole('overworld',
        (tileX + 0.5) * TILE_SIZE,
        (tileY - 1.5) * TILE_SIZE,
        this.riftUses > 1);
      return true;
    }
    // The Cursed Knight's pedestal: click it (any item, in reach) to wake him.
    if (tile === TILES.ALTAR) {
      const aTx = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const aTy = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      if (Math.hypot(tileX - aTx, tileY - aTy) > 6.5) return false;
      this.summonCursedKnight();
      return true;
    }
    if (tile !== TILES.CHEST && tile !== TILES.CHEST_OPEN && tile !== TILES.BED) return false;

    const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    if (Math.hypot(tileX - pTileX, tileY - pTileY) > 6.5) return false;

    if (tile === TILES.CHEST || tile === TILES.CHEST_OPEN) {
      // Swinging a pickaxe (any tool) at a chest mines it instead of opening
      // it — otherwise the interaction would eat the swing and a placed chest
      // could never be picked back up. Same rule as the bed below.
      const heldForChest = this.inventory[this.player.selectedSlot];
      const heldChestData = heldForChest && ITEMS[heldForChest.id];
      if (heldChestData && heldChestData.type === 'tool') return false;
      this.openChestUI(tileX, tileY);
      return true;
    }

    // Swinging a pickaxe at the bed mines it (drops the bed item) instead of
    // sleeping — otherwise the sleep interaction would eat the click forever.
    const heldForBed = this.inventory[this.player.selectedSlot];
    const heldBedData = heldForBed && ITEMS[heldForBed.id];
    if (heldBedData && heldBedData.type === 'tool') return false;

    // Daytime naps are not allowed, and a short cooldown stops
    // players holding click on the bed to skip hundreds of days.
    // interactWithSpecialTile is called every frame while the mouse is held,
    // so denied attempts share one throttled toast instead of spamming.
    const nagReady = !this.bedNagTimer || this.bedNagTimer <= 0;
    const nag = (text) => { if (nagReady) { this.showToast(text); this.bedNagTimer = 2; } };
    if (!this.world.isNight()) {
      nag('🛏️ You can only sleep at night.');
      return true;
    }
    if (this.bedCooldown > 0) {
      nag(`🛏️ The bed needs rest too (${Math.ceil(this.bedCooldown)}s).`);
      return true;
    }
    if (this.boss && !this.boss.dead) {
      nag('🛏️ You cannot sleep while the Guardian hunts you!');
      return true;
    }

    this.bedCooldown = 90; // ~one skip per (longer) in-game day, decremented in update()
    this.world.timeOfDay = 0.15;
    this.world.dayCount++;
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;
    this.monsters.length = 0;
    // Sleeping binds your respawn to this bed until it is broken.
    let bedSide = 1;
    if (this.world.getTile(tileX - 1, tileY) === TILES.AIR) bedSide = -1;
    this.respawnPoint = {
      kind: 'bed',
      bedX: tileX,
      bedY: tileY,
      x: (tileX + bedSide) * TILE_SIZE + 3,
      y: (tileY + 1) * TILE_SIZE - this.player.height
    };
    this.showToast('🛏️ Respawn set beside your bed.');
    this.showAnnouncement('🌅 A new day begins at your bed.');
    return true;
  }

  /**
   * Can a hit travel from (x0,y0) to (x1,y1) without a wall in the way?
   *
   * Bosses used to be hittable straight through solid rock: the melee arc and
   * the projectile loop both tested DISTANCE and angle but never asked what was
   * between the two points, so a player standing on the far side of a wall (or
   * an arrow fired into one) still dealt damage. Sampling the line tile by tile
   * and refusing the hit when a solid block sits on it makes cover actually
   * work — you now have to break through, dig around, or fight in the open.
   *
   * Platforms are deliberately NOT cover: you shoot and swing through the
   * walk-through wooden floors the same way you walk through them. The two
   * endpoints are excluded from the probe so a boss standing flush against the
   * wall it is leaning on can still be hit from the open side.
   */
  bossLineOfSight(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < TILE_SIZE) return true;
    // ~8px sampling: fine enough that a one-tile wall is never skipped over,
    // coarse enough to stay cheap when it runs on every melee swing.
    const steps = Math.ceil(dist / 8);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tx = Math.floor((x0 + (x1 - x0) * t) / TILE_SIZE);
      const ty = Math.floor((y0 + (y1 - y0) * t) / TILE_SIZE);
      const tile = this.world.getTile(tx, ty);
      if (!tile) continue;
      const props = TILE_PROPERTIES[tile];
      if (props && props.solid && !props.isPlatform) return false;
    }
    return true;
  }

  handleLeftClick() {
    const held = this.inventory[this.player.selectedSlot];
    const itemData = ITEMS[held.id];
    const mouseWorldX = this.input.mouseX + this.camera.x;
    const mouseWorldY = this.input.mouseY + this.camera.y;
    const targetTileX = Math.floor(mouseWorldX / TILE_SIZE);
    const targetTileY = Math.floor(mouseWorldY / TILE_SIZE);

    if (this.interactWithSpecialTile(targetTileX, targetTileY)) return;

    // Weapon rhythm: every weapon/tool has its own use time, so nothing is a
    // frame-perfect mash any more. Mining and placing use a separate, faster gate.
    // useArmed records that canAttackNow() just armed the shared cooldown, so the
    // mining branch below won't block on the very cooldown the pickaxe itself set.
    let useArmed = false;
    if (itemData && (itemData.type === 'weapon' || itemData.type === 'tool')) {
      if (!this.canAttackNow(itemData)) return;
      useArmed = true;
    }

    this.player.startSwing(itemData && itemData.useTime ? itemData.useTime * 0.9 : 0.22);

    // 1. Melee Weapon Swing — a real swing ARC instead of a 360° damage aura.
    if (itemData && itemData.type === 'weapon' && itemData.weaponType === 'melee') {
      // A `hitsAll` weapon has its own impact sound that fires on contact, so
      // it skips the generic swing whoosh — otherwise every landed hammer hit
      // plays a whiff-swoosh layered under the ban sting.
      if (!itemData.hitsAll) this.sound.playSwing();
      const pMidX = this.player.x + this.player.width / 2;
      const pMidY = this.player.y + this.player.height / 2;
      const angle = Math.atan2(mouseWorldY - pMidY, mouseWorldX - pMidX);

      const slashColor = held.id === 'hellstone_greatblade' || held.id === 'inferno_brand' ? '#fb923c'
        : held.id === 'abyssal_staff' ? '#e879f9' : '#60a5fa';
      this.particles.addSlash(pMidX + Math.cos(angle) * 20, pMidY + Math.sin(angle) * 20, angle, itemData.range, slashColor);
      if (held.id === 'aurora_blade' || held.id === 'prismatic_saber') {
        const palette = held.id === 'aurora_blade'
          ? ['#22d3ee', '#a855f7', '#f472b6', '#facc15']
          : ['#f472b6', '#facc15', '#22d3ee', '#a855f7'];
        for (let i = 0; i < 18; i++) {
          const a = angle + (Math.random() - 0.5) * 1.9;
          const r = Math.random() * itemData.range * 0.85;
          this.particles.addParticle(
            pMidX + Math.cos(a) * r, pMidY + Math.sin(a) * r,
            Math.cos(a + Math.PI / 2) * (Math.random() - 0.5) * 4,
            Math.sin(a + Math.PI / 2) * (Math.random() - 0.5) * 4,
            palette[i % palette.length], 3 + Math.random() * 3, 0.35 + Math.random() * 0.25, 0, true
          );
        }
        this.feel.shake(0.12);
      }

      // Half-width of the swing cone (radians). Longer weapons sweep wider.
      const arcHalf = Math.max(0.55, Math.min(1.15, itemData.range / 80));
      // THE BAN HAMMER: `hitsAll` replaces the cone with an instant ban-radius
      // around the player, so one swing connects with every monster, the boss
      // and every critter standing in it no matter which way the mouse points.
      // The arc still draws — the swing is real feedback, it just no longer
      // decides who gets hit.
      const banReach = itemData.hitsAll ? (itemData.banRadius || itemData.range) : 0;
      // Every downstream gate below tests distance with `itemData.range` BEFORE
      // consulting inArc, so widening the arc alone would still leave the ban
      // radius clipped to the short `range`. `reach` is the real reach of this
      // swing and every distance check uses it instead.
      const reach = Math.max(itemData.range, banReach);
      const inArc = (tMidX, tMidY) => {
        if (banReach && Math.hypot(tMidX - pMidX, tMidY - pMidY) <= banReach) return true;
        const diff = Math.atan2(tMidY - pMidY, tMidX - pMidX) - angle;
        const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
        return Math.abs(wrapped) <= arcHalf;
      };

      let totalDealt = 0;
      let hitAnything = false;
      let anyCrit = false;

      // Monsters
      for (const m of this.monsters) {
        const mMidX = m.x + m.width / 2;
        const mMidY = m.y + m.height / 2;
        if (Math.hypot(mMidX - pMidX, mMidY - pMidY) > reach + m.width / 2) continue;
        if (!inArc(mMidX, mMidY)) continue;
        const roll = this.rollDamage(itemData.damage, itemData);
        const dealt = m.takeDamage(roll.damage, this.sound, this.particles, roll.crit, {
          kbDir: mMidX >= pMidX ? 1 : -1,
          kbForce: 3.4
        }) || 0;
        // Report the swing to the host (no-op unless this machine is a guest).
        this.mp?.sendMobHit(m, roll.damage, roll.crit);
        if (dealt > 0) {
          totalDealt += dealt;
          hitAnything = true;
          anyCrit = anyCrit || roll.crit;
          // The mark lands ON the victim at the point of contact, so a room full
          // of mobs reads as a room full of banned mobs.
          if (itemData.hitsAll) this.particles.addBanStamp(mMidX, mMidY);
          // Hellstone Greatblade: 40% of landed hits inflict poison. Rolled per
          // target, so one swing can poison a whole group independently.
          // Guests skip it: status on shared mobs is host-owned.
          if (itemData.poisonChance && !(this.mp && this.mp.isClient) &&
              Math.random() < itemData.poisonChance) {
            m.applyPoison(itemData.poisonDuration, itemData.poisonDps, this.particles);
            this.stats.poisonProcs = (this.stats.poisonProcs || 0) + 1;
          }
        }
      }

      // Boss
      if (this.boss && !this.boss.dead) {
        const bMidX = this.boss.x + this.boss.width / 2;
        const bMidY = this.boss.y + this.boss.height / 2;
        // The Sovereign is four hundred pixels of spine behind one skull, and
        // this used to test the skull only — every swing that visibly passed
        // through the body did nothing at all. Route the arc through the boss's
        // hittable points instead, and let the spine pay the 8% body tax.
        // Bosses without that API (Guardian, Knight, Demon) keep the old
        // centre test untouched.
        let struck = null;
        if (typeof this.boss.nearestHitTarget === 'function') {
          const target = this.boss.nearestHitTarget(pMidX, pMidY, reach);
          if (target && inArc(target.x, target.y)) struck = target;
        } else if (Math.hypot(bMidX - pMidX, bMidY - pMidY) <= reach + this.boss.width / 2 &&
                   inArc(bMidX, bMidY)) {
          struck = { x: bMidX, y: bMidY, head: true };
        }
        // Cover: a confirmed swing still has to reach its target through open
        // air. Without this the arc ignored the wall and a boss could be beaten
        // to death from the safe side of solid stone.
        if (struck && !this.bossLineOfSight(pMidX, pMidY, struck.x, struck.y)) struck = null;
        if (struck) {
          const roll = this.rollDamage(itemData.damage, itemData);
          const scaled = typeof this.boss.scaleDamageFor === 'function'
            ? this.boss.scaleDamageFor(struck, roll.damage) : roll.damage;
          const dealt = this.boss.takeDamage(scaled, this.sound, this.particles, roll.crit) || 0;
          this.mp?.sendBossHit(scaled, roll.crit);
          if (dealt > 0) {
            totalDealt += dealt;
            hitAnything = true;
            anyCrit = anyCrit || roll.crit;
            if (itemData.hitsAll) this.particles.addBanStamp(struck.x, struck.y);
            // Bosses take the same 40% venom proc. UnderworldMonster extends
            // Monster and inherits applyPoison; DemonBoss is standalone, so the
            // capability is feature-detected rather than assumed. Guests skip
            // it: status on shared bosses is host-owned.
            if (itemData.poisonChance && !(this.mp && this.mp.isClient) &&
                typeof this.boss.applyPoison === 'function' &&
                Math.random() < itemData.poisonChance) {
              this.boss.applyPoison(itemData.poisonDuration, itemData.poisonDps, this.particles);
              this.stats.poisonProcs = (this.stats.poisonProcs || 0) + 1;
            }
          }
        }
      }

      // Wildlife can be hunted for food and wool.
      for (const critter of this.critters) {
        const cMidX = critter.x + critter.width / 2;
        const cMidY = critter.y + critter.height / 2;
        if (Math.hypot(cMidX - pMidX, cMidY - pMidY) > reach + critter.width / 2) continue;
        if (!inArc(cMidX, cMidY)) continue;
        critter.takeDamage(itemData.damage, this.sound, this.particles);
        hitAnything = true;
        if (itemData.hitsAll) this.particles.addBanStamp(cMidX, cMidY);
      }

      // Impact feedback: brief hit-stop + a punch of screen shake.
      // A critical gets a noticeably longer freeze and a harder camera kick, so
      // rolling a crit is something you can feel as well as read off the number.
      if (hitAnything) {
        this.stats.damageDealt += totalDealt;
        this.feel.stop(anyCrit ? 0.105 : 0.05, 0.07);
        this.feel.shake(anyCrit ? 0.42 : 0.16);

        // ── THE BAN HAMMER ──────────────────────────────────────────────
        // Per-victim "!!BANNED!!" stamps are added at the point of contact
        // above, so the mark belongs to each mob rather than to the screen.
        // What is left here is the room-scale punctuation: its own layered SFX
        // instead of the plain swing whoosh, a heavier freeze and kick than any
        // other weapon gets, and a red particle blast off the player. This
        // fires once per SWING, not once per victim.
        if (itemData.hitsAll) {
          this.sound.playBanHammer();
          this.feel.stop(0.13, 0.04);
          this.feel.shake(0.62);
          for (let i = 0; i < 26; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 7;
            this.particles.addParticle(
              pMidX, pMidY,
              Math.cos(a) * sp, Math.sin(a) * sp,
              i % 3 === 0 ? '#ff1a1a' : '#7f1d1d', 3 + Math.random() * 4,
              0.3 + Math.random() * 0.35, 0, true
            );
          }
        }
        // Weapon-flavoured spark burst at the point of contact, so a silver
        // saber and a diamond blade do not read identically.
        this.spawnWeaponImpact(pMidX + Math.cos(angle) * (itemData.range * 0.62),
          pMidY + Math.sin(angle) * (itemData.range * 0.62), held.id, angle, anyCrit);
        // Weapon life steal (Aurora Blade): siphon a slice of every wound.
        if (itemData.lifesteal && totalDealt > 0) {
          const siphon = Math.max(1, Math.round(totalDealt * itemData.lifesteal));
          if (this.player.heal(siphon, this.particles) > 0) this.feel.heal(0.1);
        }
      }
      return;
    }

    // 2. Ranged Bow
    if (itemData && itemData.type === 'weapon' && itemData.weaponType === 'ranged') {
      const needsAmmo = itemData.usesAmmo !== false;
      if (needsAmmo && this.countItem('arrow') <= 0) {
        this.showToast('🏹 Out of arrows. Craft more at the forge.');
        return;
      }
      if (needsAmmo) this.removeItem('arrow', 1);
      this.sound.playBow();
      const pMidX = this.player.x + this.player.width / 2;
      const pMidY = this.player.y + this.player.height / 2;
      const angle = Math.atan2(mouseWorldY - pMidY, mouseWorldX - pMidX);
      // Bowstring release: a quick fan of sparks off the bow, tinted per bow.
      const bowTint = held.id === 'soulfire_repeater' ? '#fb7185' : held.id === 'ember_bow' ? '#fb923c' : '#bae6fd';
      for (let i = 0; i < 7; i++) {
        const a = angle + (Math.random() - 0.5) * 0.9;
        const spd = 1.5 + Math.random() * 3;
        this.particles.addParticle(
          pMidX + Math.cos(angle) * 10, pMidY + Math.sin(angle) * 10,
          Math.cos(a) * spd, Math.sin(a) * spd,
          i === 0 ? '#ffffff' : bowTint, 1.6 + Math.random() * 2, 0.16, 0, true
        );
      }
      const arrow = new Projectile(
        pMidX, pMidY,
        Math.cos(angle) * itemData.speed,
        Math.sin(angle) * itemData.speed,
        'arrow',
        itemData.damage,
        false,
        3.0
      );
      // Ember and Soulfire arrows leave a themed trail rather than plain air.
      arrow.arrowTint = held.id === 'soulfire_repeater' ? '#fb7185' : held.id === 'ember_bow' ? '#fb923c' : '#93c5fd';
      arrow.lightRadius = held.id === 'soulfire_repeater' ? 90 : 0;
      this.projectiles.push(arrow);
      return;
    }

    // 3. Magic Wand
    if (itemData && itemData.type === 'weapon' && itemData.weaponType === 'magic') {
      if (this.player.mana >= itemData.manaCost) {
        this.player.mana -= itemData.manaCost;
        this.sound.playMagic();
        const pMidX = this.player.x + this.player.width / 2;
        const pMidY = this.player.y + this.player.height / 2;
        const angle = Math.atan2(mouseWorldY - pMidY, mouseWorldX - pMidX);
        // Moon Staff casts cold light, Forest Wand green, and the Abyssal Staff
        // burns with a violet soul flame — spells remain distinguishable in a fight.
        const isMoon = held.id === 'moon_staff';
        const isAbyssal = held.id === 'abyssal_staff';
        const spell = isMoon ? '#c4b5fd' : isAbyssal ? '#e879f9' : '#86efac';

        // Casting sigil: a ring of runes snapping out in front of the wand.
        for (let i = 0; i < 10; i++) {
          const a = angle + (i / 10) * Math.PI * 2;
          this.particles.addParticle(
            pMidX + Math.cos(a) * 12, pMidY + Math.sin(a) * 12,
            Math.cos(a) * 2.1, Math.sin(a) * 2.1,
            i % 2 ? spell : '#ffffff', 2 + Math.random() * 1.8, 0.24, 0, true
          );
        }
        const bolt = new Projectile(
          pMidX, pMidY,
          Math.cos(angle) * itemData.speed,
          Math.sin(angle) * itemData.speed,
          'magic_bolt',
          itemData.damage,
          false,
          3.5,
          110
        );
        bolt.boltTint = spell;
        this.projectiles.push(bolt);
      }
      return;
    }

    // 4. Mining / Digging Tiles
    const tileX = Math.floor(mouseWorldX / TILE_SIZE);
    const tileY = Math.floor(mouseWorldY / TILE_SIZE);
    const tile = this.world.getTile(tileX, tileY);

    if (tile !== TILES.AIR && tile !== TILES.WATER) {
      // Mining speed comes from the pickaxe and the Miner's Focus buff.
      // If a tool/weapon already armed the cooldown this click (useArmed), mine
      // immediately at its use speed; only unarmed clicks hit this gate.
      // (Without this, the pickaxe blocked forever on the cooldown it just set.)
      const miningMult = this.buffs.multiplier('mining') || 1;
      if (!useArmed && this.attackCooldown > 0) return;
      if (!useArmed) this.attackCooldown = 0.18 / miningMult;

      const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      const dist = Math.hypot(tileX - pTileX, tileY - pTileY);

      if (dist <= 6.5) { // Reach range
        // Rune brick frames the Ossuary arena and the rift gate is bolted into
        // it: both are the fight's furniture, not loot. (The same reason the
        // altars are intercepted before mining ever runs.)
        if (tile === TILES.SPACE_RUNE || tile === TILES.RIFT_PORTAL) {
          this.showToast(tile === TILES.SPACE_RUNE
            ? '🟪 The rune brick hums. It will not break.'
            : '🕳️ The gate is the way home. Do not chip at it.');
          return;
        }
        if (tile === TILES.REEF_SHRINE || tile === TILES.REEF_SHRINE_ACTIVE ||
            tile === TILES.OCEAN_PORTAL || tile === TILES.DORMANT_OCEAN_PORTAL) {
          this.showToast('🪸 The Tide Temple offerings and gate cannot be broken.');
          return;
        }
        const prop = TILE_PROPERTIES[tile];
        this.sound.playDig(tile === TILES.STONE || tile === TILES.IRON_ORE || tile === TILES.GOLD_ORE);
        this.particles.tileBreak(tileX, tileY, prop ? prop.color : '#854d0e');

        // Drop item
        if (prop && prop.drops) {
          this.drops.push(new DropItem(
            tileX * TILE_SIZE + 5,
            tileY * TILE_SIZE + 5,
            prop.drops.id,
            prop.drops.count
          ));
        }

        // A chest carries its own storage grid: breaking one spills the
        // contents into the world instead of deleting them with the tile.
        if (tile === TILES.CHEST || tile === TILES.CHEST_OPEN) this.spillChestContents(tileX, tileY);

        this.world.setTile(tileX, tileY, TILES.AIR);
        this.stats.blocksMined += 1;
        this.journey?.recordActivity('mine', tileX * TILE_SIZE + 12, tileY * TILE_SIZE);
        this.minimap.markDirty();
        this.feel.shake(0.035);
        // Breaking the bed you respawn at sends you back to the first campfire.
        if (tile === TILES.BED && this.respawnPoint && this.respawnPoint.kind === 'bed' &&
            this.respawnPoint.bedX === tileX && this.respawnPoint.bedY === tileY) {
          this.respawnPoint = null;
          this.showToast('🛏️ Bed broken — respawn returned to the first campfire.');
        }
      }
    }
  }

  handleRightClick() {
    const held = this.inventory[this.player.selectedSlot];
    const itemData = ITEMS[held.id];
    const mouseWorldX = this.input.mouseX + this.camera.x;
    const mouseWorldY = this.input.mouseY + this.camera.y;

    if (this.tryCerberusInteraction(mouseWorldX, mouseWorldY, held)) return;

    if (this.interactWithSpecialTile(
      Math.floor(mouseWorldX / TILE_SIZE), Math.floor(mouseWorldY / TILE_SIZE)
    )) return;

    // Fishing rod: right-click water to cast (left click still swings it).
    if (this.castFishingLine(Math.floor(mouseWorldX / TILE_SIZE), Math.floor(mouseWorldY / TILE_SIZE))) {
      return;
    }

    // Void Rift Beacon: tears a wormhole open toward the Ossuary. Handled
    // ahead of the generic consumable branch because it is a consumable that
    // must never fall into the potion/healing pipeline.
    if (itemData && itemData.riftBeacon) {
      this.useVoidRiftBeacon();
      return;
    }

    // The Rite of Waking: same reason — a consumable that has nothing to do with
    // healing, and the only thing in the game that can start a Sovereign fight.
    if (itemData && itemData.dragonRite) {
      this.performBoneRite();
      return;
    }

    // Consumable Potion
    if (itemData && itemData.type === 'consumable') {
      if (itemData.id === 'bomb') {
        this.useBomb();
      } else {
        this.useConsumable(itemData);
      }
      return;
    }

    // Block Placement
    if (itemData && itemData.type === 'tile') {
      const tileX = Math.floor(mouseWorldX / TILE_SIZE);
      const tileY = Math.floor(mouseWorldY / TILE_SIZE);

      const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
      const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
      const dist = Math.hypot(tileX - pTileX, tileY - pTileY);

      if (dist <= 7.0 && this.world.getTile(tileX, tileY) === TILES.AIR) {
        // Prevent suffocating player inside solid block
        const pLeft = Math.floor(this.player.x / TILE_SIZE);
        const pRight = Math.floor((this.player.x + this.player.width) / TILE_SIZE);
        const pTop = Math.floor(this.player.y / TILE_SIZE);
        const pBot = Math.floor((this.player.y + this.player.height) / TILE_SIZE);

        if (TILE_PROPERTIES[itemData.tile].solid && !TILE_PROPERTIES[itemData.tile].isPlatform) {
          if (tileX >= pLeft && tileX <= pRight && tileY >= pTop && tileY <= pBot) {
            return;
          }
        }

        this.world.setTile(tileX, tileY, itemData.tile);
        this.sound.playPlace();
        this.removeItem(held.id, 1);
        // A chest the player places starts with an empty, pre-registered grid:
        // only a sealed WORLD chest rolls loot on first open (see openChestUI).
        if (itemData.tile === TILES.CHEST) {
          this.chestStorage[`${tileX},${tileY}`] = this.makeEmptyChestSlots();
        }
        this.stats.blocksPlaced += 1;
        this.journey?.recordActivity('build', tileX * TILE_SIZE + 12, tileY * TILE_SIZE);
        this.minimap.markDirty();
        if (itemData.tile === TILES.TORCH) this.particles.addTorchEmber(tileX * TILE_SIZE + 12, tileY * TILE_SIZE + 10);
        if (itemData.tile === TILES.LANTERN) {
          this.particles.magicSparkle(tileX * TILE_SIZE + 12, tileY * TILE_SIZE + 12, '#fbbf24', 12);
        }
      }
    }
  }

  tryCerberusInteraction(worldX, worldY, held) {
    const pet = this.cerberus;
    if (!pet || !this.world.isUnderworldAtY(this.player.y / TILE_SIZE) ||
        !pet.isNear(worldX, worldY)) return false;
    if (held?.id !== 'bone') {
      this.showToast(pet.dead
        ? '🦴 Select bones and right-click Cerberus to revive it.'
        : pet.tamed
          ? `🦴 Select bones to upgrade Cerberus (level ${pet.level}/10).`
          : '🦴 Select bones to tame Cerberus.');
      return true;
    }
    pet.interact(this);
    return true;
  }

  summonBoss(awakened = false) {
    // Guests ask the host instead: the boss, its AI and its loot bag are all
    // host-owned, and the 10Hz snapshot carries it to the guest's screen.
    if (this.mp && this.mp.isClient) {
      this.showToast('📡 The summon went to the host.');
      this.mp.requestBossSummon();
      return;
    }
    if (this.boss && !this.boss.dead) {
      this.showToast('⚠️ The Guardian is already here!');
      return;
    }
    const bSpawnX = this.player.x + (Math.random() > 0.5 ? 350 : -350);
    const bSpawnY = this.player.y - 200;
    this.boss = new ForestGuardianBoss(bSpawnX, bSpawnY, this);
    if (awakened) {
      // Day-20 variant: 60% more health, permanently enraged haste.
      this.boss.maxHp = Math.round(this.boss.maxHp * 1.6);
      this.boss.hp = this.boss.maxHp;
      this.boss.name = 'AWAKENED FOREST GUARDIAN';
      this.boss.enraged = true;
      this.boss.lightRadius = 320;
    }
    this.sound.playBossRoar();
    this.bossEntrance(bSpawnX + 32, bSpawnY + 32,
      awakened ? '#fde047' : '#4ade80', awakened ? '#f472b6' : '#86efac');
    this.showAnnouncement(awakened
      ? '🌙 DAY 20 — THE GUARDIAN HAS AWAKENED!'
      : '👁️ THE ANCIENT FOREST GUARDIAN HAS AWOKEN!');
    document.getElementById('boss-panel').classList.remove('hidden');
  }

  summonDemonBoss() {
    // Same rule as summonBoss: a guest asks, the host raises it.
    if (this.mp && this.mp.isClient) {
      this.showToast('📡 The altar rang — the host owns the fight.');
      this.mp.requestBossSummon('demon');
      return false;
    }
    if (this.boss && !this.boss.dead) {
      this.showToast('⚠️ The Hellbound Demon already hunts you!');
      return false;
    }
    const castle = this.world.underworld;
    let x = castle ? (castle.altarX + 0.5) * TILE_SIZE - 36 : this.player.x;
    const y = castle ? (castle.altarY + 1) * TILE_SIZE - 82 : this.player.y - 180;
    // The altar tile is solid and sits exactly where the boss would otherwise
    // appear, so the Demon used to materialise *inside* its own altar. Walk the
    // spawn sideways until the tile under the boss's chest is clear. The arena
    // floor is flat now, so the first candidate is essentially always free and
    // the boss still walks to the player on its first stalk.
    if (castle) {
      // Probe the boss's mid-body tile, which is where a solid block would trap
      // it. The altar is one tile wide at cx, so a 2-tile step clears it.
      const bodyY = Math.floor((y + 41) / TILE_SIZE);
      const step = 2 * TILE_SIZE;
      for (let i = 1; i <= 4; i++) {
        for (const dir of [1, -1]) {
          const cx = x + dir * i * step;
          if (!this.world.isSolid(Math.floor((cx + 36) / TILE_SIZE), bodyY)) {
            x = cx;
            i = 99;
            break;
          }
        }
      }
    }
    this.boss = new DemonBoss(x, y, this);
    this.sound.playBossRoar();
    this.bossEntrance(x + 36, y + 41, '#fb923c', '#f43f5e');
    this.showAnnouncement('🔥 THE HELLBOUND DEMON RISES!');
    this.showToast('Three phases. One infernal king. Good luck.');
    document.getElementById('boss-panel')?.classList.remove('hidden');
    return true;
  }

  /** Shared dramatic entrance for any boss: freeze-frame, slow-mo, shake, particle nova. */
  bossEntrance(x, y, colorA, colorB) {
    this.feel.stop(0.15, 0.04);
    this.feel.slow(1.5, 0.28);
    this.feel.shake(1.0);
    this.particles.magicSparkle(x, y, colorA, 90);
    this.particles.bloodBurst(x, y, colorB, 50);
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const spd = 4.5 + Math.random() * 3.5;
      this.particles.addParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        i % 2 ? colorA : colorB, 4, 1.0, 0.05);
    }
  }

  /** Wake the Cursed Knight by clicking the statue pedestal in the secret dungeon. */
  summonCursedKnight() {
    // Guests cannot raise the Knight either; the host's copy is the real one.
    if (this.mp && this.mp.isClient) {
      this.showToast('📡 The statue stirred — the host owns the fight.');
      this.mp.requestBossSummon('knight');
      return false;
    }
    const d = this.world.dungeon;
    if (!d) return;
    if (this.boss && !this.boss.dead) {
      if (this.altarNagTimer <= 0) {
        this.showToast('⚠️ A boss already hunts you!');
        this.altarNagTimer = 2;
      }
      return;
    }
    const bx = (d.altarX - 4) * TILE_SIZE;
    const by = d.roomFloor * TILE_SIZE - 56;
    const ax = (d.altarX + 0.5) * TILE_SIZE;
    const ay = (d.altarY + 0.5) * TILE_SIZE - 24;
    this.boss = new CursedKnightBoss(bx, by, this);
    this.sound.playBossRoar();
    this.bossEntrance(ax, ay, '#a5b4fc', '#a855f7');

    // The chapel itself wakes first: the statue exhales a column of grave-light,
    // then the floor cracks and the knight's own rune-circle ignites beneath him.
    const bcx = bx + this.boss.width / 2;
    const bcy = by + this.boss.height / 2;
    for (let i = 0; i < 3; i++) {
      this.particles.addParticle(ax, ay - i * 8, 0, 0,
        i === 0 ? '#ffffff' : (i === 1 ? '#c7d2fe' : '#818cf8'),
        16 - i * 4, 0.5 + i * 0.1, 0, true);
    }
    for (let i = 0; i < 26; i++) {
      this.particles.addParticle(
        ax + (Math.random() - 0.5) * 34, ay + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 1.2, -1.6 - Math.random() * 2.6,
        Math.random() < 0.5 ? '#a5b4fc' : '#e0e7ff',
        2 + Math.random() * 3, 0.9, -0.03, true
      );
    }
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2;
      this.particles.addParticle(bcx, by + this.boss.height, Math.cos(a) * 3.4, Math.sin(a) * 1.1,
        i % 2 ? '#a5b4fc' : '#94a3b8', 3.4, 0.85, 0.16, false);
    }
    if (this.feel) {
      this.feel.stop(0.22, 0.03);
      this.feel.slow(1.7, 0.26);
      this.feel.shake(1.15);
    }
    this.showAnnouncement('⚔️ THE CURSED KNIGHT AWAKENS!');
    document.getElementById('boss-panel').classList.remove('hidden');
  }

  // ══════════════════════════════════════════════════════════════════════
  // THE VOID RIFT — the Space Dimension and the Ossuary Sovereign
  //
  // Every dimension jump in the game — beacon, rift gate, death — funnels
  // through openWormhole() and then updateWormhole(), so the world only ever
  // changes in one place: the exact frame the wormhole collapses, hidden behind
  // its own white-out. The overworld is stashed by reference (see space.js), so
  // a return trip is an exact restoration, and the save file always describes
  // home rather than the arena.
  // ══════════════════════════════════════════════════════════════════════

  /** Tear a wormhole open at a world-pixel position. */
  openWormhole(intent, x, y, charged = false) {
    // Remember where home is while the player is still standing in it. By the
    // frame the rift collapses they have been dragged a hundred pixels into the
    // sky, and the way back has to set them down on the ground they left.
    if ((intent === 'space' || intent === 'ocean') &&
        !this.world.isInSpace() && !this.world.isInOcean()) {
      this.overworldReturnPos = { x: this.player.x, y: this.player.y };
    }
    this.riftUses++;
    this.wormholeIntent = intent;
    this.wormhole = new WormholeFX(x, y, {
      charged,
      // Opening a rift toward the arena is the loud, cinematic one; the way
      // home is a smaller, quieter tear, because you walk into it.
      maxRadius: intent === 'space' ? 205 : intent === 'ocean' ? 190 : 170
    });
    this.showAnnouncement(intent === 'space'
      ? '🌀 THE SKY TEARS OPEN — THE OSSUARY WAITS.'
      : intent === 'ocean'
        ? '🌊 THE TIDE GATE OPENS — THE LEVIATHAN STIRS.'
        : '🕳️ THE WAY HOME OPENS.');
  }

  /**
   * Advance the live wormhole. Returns true while the rift owns the player, in
   * which case update() suspends the player's own physics so nothing fights
   * the pull.
   */
  updateWormhole(dt) {
    if (!this.wormhole) {
      // Dying in the Ossuary banks the fight, then the rift comes back for you:
      // the retry is instant and the Sovereign resumes at the damage it had
      // already taken, so a death is a setback rather than a reset.
      //
      // Once the Sovereign has been killed there is nothing to go back to, and
      // the auto-rift is the thing that used to yank a victorious player out of
      // their own house the moment they died standing over the bones. The pull is
      // banked off entirely — the arena only reopens on a beacon, and only
      // re-arms a dragon on a rite.
      if (this.dragonSlain && !Number.isFinite(this.dragonHP)) {
        this.riftReturnDelay = 0;
        return false;
      }
      if (this.riftReturnDelay > 0) {
        if (this.isDead || this.world.isInSpace() || this.world.isInOcean() || this.boss) return false;
        this.riftReturnDelay -= dt;
        if (this.riftReturnDelay <= 0) {
          this.riftReturnDelay = 0;
          this.openWormhole('space',
            this.player.x + this.player.width / 2,
            this.player.y - 26, true);
        }
      }
      return false;
    }
    // Helpless while the sky is eating you: keep the i-frames topped up.
    this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 0.4);
    if (this.wormhole.update(dt, this.player, this.particles) === 'done') {
      const intent = this.wormholeIntent;
      this.wormhole = null;
      this.wormholeIntent = null;
      if (intent === 'space') this.enterSpaceDimension();
      else if (intent === 'ocean') this.enterOceanDimension();
      else if (intent === 'overworld') this.returnToOverworld();
    }
    return true;
  }

  /**
   * Right-click with a Void Rift Beacon: open a rift toward the Ossuary.
   * Returns true when the sky starts tearing — which is also when the beacon is
   * spent. A refused beacon is never consumed.
   */
  useVoidRiftBeacon() {
    // The Ossuary is host-only during a session: guests keep the overworld
    // while the host is away (see multiplayer.js _setDim).
    if (this.mp && this.mp.denyForClient('🌀 Only the host can tear a rift open — guests stay in the overworld.')) {
      return false;
    }
    if (this.world.isInSpace()) {
      this.showToast('🌀 You are already in the Ossuary. Walk into the 🕳️ Rift Gate on the west wall to go home.');
      return false;
    }
    if (this.world.isInOcean()) {
      this.showToast('🌊 The Tide Gate is the only safe route back from this ocean world.');
      return false;
    }
    if (this.wormhole) {
      this.showToast('🌀 The sky is still tearing open…');
      return false;
    }
    if (this.boss && !this.boss.dead) {
      this.showToast('🚫 No wormhole will open while a fight is already raging.');
      return false;
    }
    const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    const groundY = this.world.surfaceHeights[Math.max(0, Math.min(this.world.width - 1, pTileX))];
    // A hole punched in the sky is the only shape this door can take. The honest
    // test is skylight: run a ray straight up from the player and if any solid
    // tile blocks it, they are in a cave and the beacon refuses. (Comparing
    // against surfaceHeights alone is not enough — a hill you stand under has a
    // surface row above your head, and an inverted comparison silently turns
    // the whole check inside out.) Platforms are walk-through, so they let the
    // sky through.
    let skylight = true;
    for (let ty = pTileY; ty >= 0; ty--) {
      const above = this.world.getTile(pTileX, ty);
      const props = above !== TILES.AIR && TILE_PROPERTIES[above];
      if (props && props.solid && !props.isPlatform) { skylight = false; break; }
    }
    if (!skylight) {
      this.showToast('🚫 The beacon needs open sky above you. Climb out of the caves.');
      return false;
    }
    // While a wounded Sovereign is waiting, the beacon is a tether rather than a
    // ticket: it reopens the same rift for free, so the fight cannot be reset by
    // leaving. It is only spent when a fresh dragon is being woken.
    if (!Number.isFinite(this.dragonHP) && !this.removeItem('void_rift_beacon', 1)) {
      this.showToast('🌀 You need a Void Rift Beacon for that.');
      return false;
    }
    this.openWormhole('space',
      (pTileX + 0.5) * TILE_SIZE,
      Math.max(2, groundY - 10) * TILE_SIZE,
      Number.isFinite(this.dragonHP));
    return true;
  }

  /**
   * Right-click a rite inside the Ossuary: the harvested bones burn and a whole
   * Sovereign rises out of the ground.
   *
   * This is the only door into the fight — the first time AND every time after.
   * The arena never re-arms itself, a beacon never summons anything, and
   * neither does a reload, a death or a return trip: the player has to stand in
   * the Ossuary, with bones they mined, and decide they want this fight. There is
   * one rite and it opens the same grave every time — cheap for the first
   * Sovereign, ruinous for every one after (see riteOfWakingCost). Returns true
   * when the rite was read, which is also when the bones are spent.
   */
  performBoneRite() {
    // Same reason as the beacon: the arena belongs to the host mid-session.
    if (this.mp && this.mp.denyForClient('🦴 Only the host may read the Rite of Waking during a session.')) {
      return false;
    }
    if (!this.world.isInSpace()) {
      this.showToast('🦴 The rite has to be read where the bones are. Tear the Ossuary open first.');
      return false;
    }
    if (this.wormhole) {
      this.showToast('🌀 Wait for the rift to finish tearing.');
      return false;
    }
    if (this.boss && !this.boss.dead) {
      this.showToast('🦴 A Sovereign is already awake in the arena.');
      return false;
    }
    const arena = this.world.spaceArena;
    if (!arena) {
      this.showToast('🦴 There is no arena here to hold a rite.');
      return false;
    }
    // A banked fight is a fight in progress, not a finished one. dragonHP is the
    // wound the Sovereign walked away with; reading a rite over it used to delete
    // that wound, stand a whole 88,000 HP dragon back up and burn the bones for
    // the privilege. The rite is for raising a *new* Sovereign over a corpse, so
    // an unfinished one is refused and the player keeps both the bones and the
    // ground they already took. Checked before removeItem: a refused rite is
    // never spent.
    if (Number.isFinite(this.dragonHP)) {
      this.showToast('🦴 The old one is not finished — its wound is still waiting. Kill it before you burn bones.');
      return false;
    }
    // Which rite opens the grave. There is only one rite in the game now, and it
    // reads the same way the first time and every time after: burn it in the
    // arena and a Sovereign stands up. What changes between the first rite and
    // every later one is the price of CRAFTING it, not what it does — the first
    // is a scouting trip, the rest are deliberately expensive.
    const rite = this.countItem('rite_of_waking') > 0 ? 'rite_of_waking' : null;
    if (!rite) {
      this.showToast('🕯️ The grave is sealed. Craft a Rite of Waking and right-click it here.');
      return false;
    }
    if (!this.removeItem(rite, 1)) {
      this.showToast('🦴 The rite will not read without its bones.');
      return false;
    }
    this.showAnnouncement('🕯️ THE CANDLE CATCHES — THE GRAVE ANSWERS.');
    this.sound.playBossRoar?.();
    this.particles.magicSparkle(this.player.x, this.player.y, '#fbcfe8', 60);
    this.dragonHP = null;
    return this.wakeSovereign(arena, null) !== null;
  }

  /**
   * Swap the world buffers for the arena, drop the player onto its floor and
   * wake the Sovereign. Called by updateWormhole at the moment of collapse.
   */
  enterSpaceDimension() {
    const arena = this.world.enterSpaceDimension();
    // Whatever was alive at home waits there for the way back.
    this.dimensionStash = {
      monsters: this.monsters,
      critters: this.critters,
      drops: this.drops
    };
    this.overworldReturnPos = { x: this.player.x, y: this.player.y };
    this.monsters = [];
    this.critters = [];
    this.drops = [];
    this.projectiles = [];
    // The minimap's texture, its explored mask and its landmark pins all describe
    // the overworld; the arena is a different world, so rebuild all of it.
    if (this.minimap) this.minimap.markDirty();
    // Normally already captured by openWormhole; kept as a fallback so the
    // dimension can never be left without a way home.
    if (!this.overworldReturnPos) this.overworldReturnPos = { x: this.player.x, y: this.player.y };
    this.player.x = arena.spawnX;
    this.player.y = arena.spawnY;
    this.player.vx = 0;
    this.player.vy = 0;

    // ---- The Sovereign is never implicit ----
    // Walking in does not start the fight. The Ossuary stays a sealed grave
    // until a rite is read inside it, so the first time here is a scouting trip
    // through a mine rather than an ambush at the end of a cutscene. A banked
    // wound is the one thing that resumes on its own — you cannot lose a fight
    // to a loading screen.
    if (Number.isFinite(this.dragonHP)) {
      this.wakeSovereign(arena);
    } else if (this.dragonSlain) {
      this.showToast('🕳️ Quiet as a church. The Sovereign you killed stays killed — craft a 🕯️ Rite of Waking and read it here to wake another.');
    } else {
      this.showToast('🕯️ Nothing stirs. The Sovereign is sealed under the bone-dust until a rite is read here — mine the seams and the deep, craft a Rite of Waking, and right-click it in the arena.');
    }
    this.showToast('🌌 The only way home is the 🕳️ Rift Gate on the west wall.');
    this.particles.magicSparkle(this.player.x, this.player.y, '#c4b5fd', 40);
  }

  enterOceanDimension() {
    const arena = this.world.enterOceanDimension();
    this.dimensionStash = { monsters: this.monsters, critters: this.critters, drops: this.drops };
    this.overworldReturnPos = this.overworldReturnPos || { x: this.player.x, y: this.player.y };
    this.monsters = [];
    this.critters = [];
    this.drops = [];
    this.projectiles = [];
    this.minimap?.markDirty();
    this.player.x = arena.spawnX;
    this.player.y = arena.spawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.oxygen = this.oxygenMax;
    if (this.mp && this.mp.status !== 'idle') {
      this.showToast('This ocean-world expedition is solo-only.');
    }
    if (!this.leviathanSlain && typeof OceanLeviathan === 'function') {
      const hp = Number.isFinite(this.leviathanHP) ? this.leviathanHP : 110000;
      this.boss = new OceanLeviathan(arena.bossX, arena.bossY, this);
      this.boss.hp = Math.max(1, Math.min(this.boss.maxHp, hp));
      this.leviathanHP = null;
      this.sound.isBoss = true;
      document.getElementById('boss-panel')?.classList.remove('hidden');
      this.showAnnouncement('🐉 THE THREE-HEADED SEA LEVIATHAN RISES!');
    } else {
      this.boss = null;
      this.showToast('🌊 The ocean planet is quiet. The Leviathan you defeated remains gone.');
    }
    this.showToast('🫧 Keep your diving gear close. The Tide Gate behind you returns home.');
  }

  /**
   * Stand a Sovereign up in the arena. `resumeHP` is the banked HP of a fight the
   * player walked out on; pass null (or leave it banked-empty) for a whole one.
   *
   * Waking is never implicit. The only two callers are performBoneRite (a rite
   * was read, bones were burned) and the re-entry branch of
   * enterSpaceDimension, which resumes a wound the player already has rather
   * than starting anything new. Nothing else in the game may call this: not a
   * beacon, not a reload, not arriving in a cleared arena.
   */
  wakeSovereign(arena, resumeHP = this.dragonHP) {
    if (!arena) return null;
    // Guests cannot raise the Sovereign: the arena is host-owned during a
    // session, and both callers are already gated for guests. Belt and braces,
    // because a client-side Sovereign would be a second, invisible simulation.
    if (this.mp && this.mp.isClient) {
      this.showToast('📡 The bones burn for the host.');
      this.mp.requestBossSummon('dragon');
      return null;
    }
    this.boss = new SkeletonDragonBoss(arena.cx * TILE_SIZE, (arena.floorY - 16) * TILE_SIZE, this);
    if (Number.isFinite(resumeHP)) {
      this.boss.hp = Math.max(1, Math.min(this.boss.maxHp, resumeHP));
      this.showToast('🦴 It remembers you.');
    }
    this.dragonHP = null;
    this.dragonSlain = false;
    this.sound.isBoss = true;
    const panel = document.getElementById('boss-panel');
    if (panel) panel.classList.remove('hidden');
    this.showAnnouncement('🦴 THE OSSUARY SOVEREIGN AWAKENS!');
    return this.boss;
  }

  /**
   * Put the overworld back exactly as it was and set the player down where they
   * stepped into the sky. Driven by updateWormhole, and by respawnPlayer when
   * the player dies inside the arena.
   */
  returnToOverworld() {
    // An unfinished fight is banked, not forgotten.
    const fromOcean = this.world.isInOcean();
    if (this.boss && !this.boss.dead && this.boss.kind === 'dragon') this.dragonHP = this.boss.hp;
    if (this.boss && !this.boss.dead && this.boss.kind === 'leviathan') this.leviathanHP = this.boss.hp;
    this.boss = null;
    // The death show belongs to the arena: leaving (or being dragged out by
    // death) ends it. The held victory screen keeps its own timer — the kill
    // still deserves its curtain wherever the player ends up.
    this.dragonFinale = null;
    this.sound.isBoss = false;
    const panel = document.getElementById('boss-panel');
    if (panel) panel.classList.add('hidden');
    this.projectiles = [];
    this.monsters = [];
    this.critters = [];
    this.drops = [];
    if (fromOcean) this.world.exitOceanDimension();
    else this.world.exitSpaceDimension();
    // …and the minimap has to forget the arena and redraw the world it knows.
    if (this.minimap) this.minimap.markDirty();
    const stash = this.dimensionStash;
    if (stash) {
      this.monsters = stash.monsters;
      this.critters = stash.critters;
      this.drops = stash.drops;
      this.dimensionStash = null;
    }
    const home = this.overworldReturnPos;
    if (home) {
      this.player.x = home.x;
      this.player.y = home.y;
      // Spent: the next trip has to capture a fresh doorstep, never reuse this
      // one (a re-used position could be inside a wall the player has since built).
      this.overworldReturnPos = null;
    }
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 2.5);
    // Land the camera on the player instead of gliding there from the arena.
    this.camera.x = Math.max(0, Math.min(this.world.pixelWidth - this.camera.viewportWidth,
      this.player.x + this.player.width / 2 - this.camera.viewportWidth / 2));
    this.camera.y = Math.max(0, Math.min(this.world.pixelHeight - this.camera.viewportHeight,
      this.player.y + this.player.height / 2 - this.camera.viewportHeight / 2));
    this.showToast(fromOcean
      ? (Number.isFinite(this.leviathanHP)
        ? '🌊 Back at the reef. The Leviathan remembers the damage it took.'
        : '🌊 Back at the reef, with the Tide Gate still behind you.')
      : Number.isFinite(this.dragonHP)
        ? '🕳️ The rift closes. It is still in there, and it remembers every hit.'
        : '🌲 Back under the sky of home.');
    this.particles.magicSparkle(this.player.x, this.player.y, '#a5f3fc', 40);
    // Leaving the Sovereign alive is allowed, losing your way back to it is not:
    // a wounded dragon re-tears the sky a few seconds after the retreat, so a
    // deliberate withdrawal is a pause rather than a forfeit. respawnPlayer
    // overwrites this with its own shorter delay after the bed maths. A slain
    // dragon is the opposite case — there is nothing left to be pulled back to.
    if (!this.dragonSlain && Number.isFinite(this.dragonHP)) this.riftReturnDelay = Math.max(this.riftReturnDelay, 5.0);
    this.saveGame(true);
  }

  /**
   * Called the frame the Sovereign is felled. The loot itself comes out of the
   * shared boss-bag path; what is special here is that the arena does NOT
   * eject the player — the rift gate stays standing so they can mine the
   * meteor seams and bone piles before deciding to leave.
   */
  onDragonDefeated() {
    this.dragonHP = null;
    // The kill is permanent until a rite says otherwise. Clearing the pending
    // re-entry here is what keeps the sky from tearing open over the player's own
    // base a few seconds after they have already won, and the flag is what keeps
    // every later trip quiet.
    this.dragonSlain = true;
    // Bumped here, once per felled Sovereign, and never cleared — this is the
    // counter the "first kill only" loot gate reads.
    this.dragonKills = (this.dragonKills || 0) + 1;
    this.riftReturnDelay = 0;
    this.showToast('🦴 Mine the 🟠 meteor seams and bone piles before you leave — the Ossuary stays yours now.');
    this.showToast('🕯️ The Sovereign stays dead. Craft another 🕯️ Rite of Waking — the price is far higher now — and read it in the Ossuary to wake another.');
  }

  respawnPlayer() {
    // Dying inside the Ossuary cannot strand you. The fight is banked, the
    // overworld is restored first (so the bed/campfire maths below read the
    // real surface profile), and updateWormhole then reopens a charged rift a
    // few seconds later to drag you straight back in for the retry.
    const diedInSpace = this.world.isInSpace();
    if (diedInSpace || this.world.isInOcean()) {
      this.returnToOverworld();
      // Only a Sovereign that is still standing — or banked with damage on it —
      // pulls you back in. Dying in a quiet Ossuary opens nothing: before the
      // first rite is read there is no fight to be pulled into, and a player
      // scouting the mine for ore must be free to die and simply come back.
      if (diedInSpace && (Number.isFinite(this.dragonHP) || (this.boss && !this.boss.dead))) {
        this.riftReturnDelay = 3.2;
      }
    }
    const spawnX = Math.floor(this.world.width / 2) * TILE_SIZE;
    const spawnY = (this.world.surfaceHeights[Math.floor(this.world.width / 2)] - 3) * TILE_SIZE;
    let rx = spawnX;
    let ry = spawnY;
    let respawnLabel = 'the first campfire';
    const rp = this.respawnPoint;
    if (rp && rp.kind === 'bed' && this.world.getTile(rp.bedX, rp.bedY) === TILES.BED) {
      // Sleep-bound respawn: wake up beside your bed...
      rx = rp.x;
      ry = rp.y;
      respawnLabel = 'your bed';
    } else if (rp) {
      // ...unless the bed has since been broken.
      this.respawnPoint = null;
    }
    this.player.x = rx;
    this.player.y = ry;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;
    // Death also resets the wings and the regen lockout: you should never
    // respawn into a cooldown you did not spend in this life.
    this.player.wingsUsed = null;
    this.player.setWings(this.equippedAccessoryId ? ITEMS[this.equippedAccessoryId] : null);
    this._wingsLocked = false;
    this.regenLock = 0;
    this.player.stamina = this.player.maxStamina;
    this.isDead = false;
this.player.invulnerableTime = 1.0;
this.player.isDodgeRolling = false;
this.player.dodgeTime = 0;
    // Persist the respawn immediately. Combined with the exit hooks this means
    // a world survives both "closed the tab" and "died and closed the tab".
    this.saveGame(true);
    document.getElementById('death-screen').classList.add('hidden');
    this.showToast(`🔥 Respawned at ${respawnLabel}.`);
  }

  /**
   * Best armour the player currently owns. Reads ARMOR_TIERS so every
   * tier stays in the running — this used to list only four of the six.
   */
  /**
   * Find a spawn position near (x, y) that a monster can actually stand in.
   *
   * A monster needs its body tiles open AND something solid directly
   * underneath to stand on. This is the fix for "mobs spawn inside blocks and
   * stay stuck": the spawner picked a Y from the heightmap (surface) or from a
   * fixed offset to the player (underground/underworld) and never checked
   * whether that tile was open, while Monster.update only probes the tile in
   * FRONT of a walking monster -- so one that materialised inside a cave wall
   * had no way to path out of it and simply sat there forever.
   *
   * Searches a widening box around the wanted point, nearest displacement
   * first, and returns null when there is genuinely nowhere open nearby (solid
   * rock) so the caller can skip that roll instead of embedding a mob.
   */
  findOpenSpawn(x, y, reach = 72) {
    const world = this.world;
    const fits = (px, py) => {
      const tx = Math.floor(px / TILE_SIZE);
      const tyTop = Math.floor(py / TILE_SIZE);
      const tyBottom = Math.floor((py + 30) / TILE_SIZE);
      // Body tiles must be open...
      if (world.isSolid(tx, tyTop) || world.isSolid(tx, tyBottom)) return false;
      // ...and there must be a floor to land on. Lava is not a floor either, so
      // a mob never materialises inside it.
      const floorY = Math.floor((py + 34) / TILE_SIZE);
      if (!world.isSolid(tx, floorY)) return false;
      return world.getTile(tx, floorY) !== TILES.LAVA;
    };
    if (fits(x, y)) return { x, y };

    for (let r = TILE_SIZE; r <= reach; r += TILE_SIZE) {
      // Ring order: up, down, left, right, then the diagonals. Nearest-first so
      // a spawn that can be nudged slightly is nudged, not relocated wildly.
      const offsets = [
        [0, -r], [0, r], [-r, 0], [r, 0],
        [-r, -r], [r, -r], [-r, r], [r, r]
      ];
      for (const [dx, dy] of offsets) {
        if (fits(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
    return null;
  }

  findOpenReefSwimSpawn(x, y, reach = 384) {
    const world = this.world;
    const fits = (px, py) => {
      const left = Math.floor(px / TILE_SIZE);
      const right = Math.floor((px + 52) / TILE_SIZE);
      const top = Math.floor(py / TILE_SIZE);
      const bottom = Math.floor((py + 27) / TILE_SIZE);
      if (!world.reefBounds || left < world.reefBounds.left ||
          right >= world.reefBounds.mainRight) return false;
      let water = false;
      for (let tx = left; tx <= right; tx++) {
        for (let ty = top; ty <= bottom; ty++) {
          if (world.isSolid(tx, ty)) return false;
          if (world.getTile(tx, ty) === TILES.WATER) water = true;
        }
      }
      return water && py / TILE_SIZE > world.reefBounds.seaY;
    };
    if (fits(x, y)) return { x, y };
    for (let r = TILE_SIZE; r <= reach; r += TILE_SIZE) {
      for (const [dx, dy] of [[0, -r], [0, r], [-r, 0], [r, 0],
        [-r, -r], [r, -r], [-r, r], [r, r]]) {
        if (fits(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
    return null;
  }

  getBestArmor() {
    return bestOwnedArmor(this);
  }

  updateCerberus(dt) {
    const inUnderworld = !this.world.isInSpace() && !this.world.isInOcean() &&
      this.world.isUnderworldAtY(this.player.y / TILE_SIZE);
    if (!this.cerberus && inUnderworld && typeof CerberusPet !== 'undefined') {
      this.cerberus = new CerberusPet(
        this.player.x + 96,
        this.player.y + this.player.height - 42
      );
      this.showToast('🔥 A wild Cerberus is nearby. Offer it 5 bones to tame it.');
    }
    if (this.cerberus && !this.cerberus.tamed && !inUnderworld) {
      this.cerberus = null;
    }
    if (this.cerberus && !(this.mp && this.mp.isClient)) {
      this.cerberus.update(dt, this);
    }
  }

  updateOceanSystems(dt) {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    const inTemple = this.world.isInsideReefTemple(
      Math.floor(px / TILE_SIZE), Math.floor((this.player.y + 4) / TILE_SIZE));
    const inWater = [
      [px, py], [px - 6, py], [px + 6, py],
      [px, this.player.y + this.player.height - 3]
    ].some(([x, y]) =>
      this.world.getTile(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)) === TILES.WATER);
    const underwater = this.world.getTile(Math.floor(px / TILE_SIZE),
      Math.floor((this.player.y + 4) / TILE_SIZE)) === TILES.WATER;
    this.player.swimming = inWater;

    const gear = this.countItem('diving_gear_3') ? ITEMS.diving_gear_3
      : this.countItem('diving_gear_2') ? ITEMS.diving_gear_2
        : this.countItem('diving_gear_1') ? ITEMS.diving_gear_1 : null;
    const fins = this.countItem('swim_fins_3') ? ITEMS.swim_fins_3
      : this.countItem('swim_fins_2') ? ITEMS.swim_fins_2
        : this.countItem('swim_fins_1') ? ITEMS.swim_fins_1 : null;
    this.player.swimSpeedMultiplier = fins ? fins.swimSpeed : 1;
    this.oxygenMax = gear ? gear.oxygen : 8;
    if (inTemple) {
      this.oxygen = this.oxygenMax;
      this.oxygenDamageTimer = 0;
    } else if (underwater) {
      this.oxygen = Math.max(0, Math.min(this.oxygen, this.oxygenMax) - dt);
      if (this.oxygen <= 0) {
        this.oxygenDamageTimer += dt;
        if (this.oxygenDamageTimer >= 1) {
          this.oxygenDamageTimer -= 1;
          this.damagePlayer(7, null, 'You are drowning! Find air or equip diving gear.');
        }
      } else {
        this.oxygenDamageTimer = 0;
      }
    } else {
      this.oxygen = Math.min(this.oxygenMax, this.oxygen + dt * 12);
      this.oxygenDamageTimer = 0;
    }

    const panel = document.getElementById('oxygen-panel');
    const bar = document.getElementById('oxygen-bar');
    const text = document.getElementById('oxygen-text');
    if (panel) panel.classList.toggle('hidden', !underwater || inTemple);
    if (bar) {
      bar.style.width = `${this.oxygenMax > 0 ? (this.oxygen / this.oxygenMax) * 100 : 0}%`;
      bar.style.background = this.oxygen < this.oxygenMax * 0.25
        ? 'linear-gradient(90deg,#ef4444,#fca5a5)'
        : 'linear-gradient(90deg,#22d3ee,#a5f3fc)';
    }
    if (text) text.textContent = `${Math.ceil(this.oxygen)}s`;
  }

  updateOceanFish(dt) {
    const cx = (this.player.x + this.player.width / 2) / TILE_SIZE;
    const active = this.world.isInOcean() || this.world.isReefAtX(cx);
    if (!active || typeof OceanFish === 'undefined') {
      this.reefFish.length = 0;
      return;
    }
    this.reefFishSpawnTimer += dt;
    const maxFish = this.world.isInOcean() ? 24 : 16;
    const reefRight = this.world.reefBounds ? this.world.reefBounds.right : this.world.width * 0.32;
    while (this.reefFish.length < maxFish && this.reefFishSpawnTimer >= 0.08) {
      this.reefFishSpawnTimer -= 0.08;
      const fishX = this.world.isInOcean()
        ? Math.random() * this.world.pixelWidth
        : Math.max(3, Math.min(reefRight - 3, cx + (Math.random() - 0.5) * 75)) * TILE_SIZE;
      const minY = this.world.isInOcean()
        ? this.world.oceanArena.seaY + 2
        : (this.world.reefBounds ? this.world.reefBounds.seaY + 2 : 42);
      let fishY = minY * TILE_SIZE;
      for (let tries = 0; tries < 24; tries++) {
        const candidate = (minY + Math.floor(Math.random() * Math.max(2, this.world.height - minY - 10))) * TILE_SIZE;
        if (this.world.getTile(Math.floor(fishX / TILE_SIZE), Math.floor(candidate / TILE_SIZE)) === TILES.WATER) {
          fishY = candidate;
          break;
        }
      }
      this.reefFish.push(new OceanFish(fishX, fishY, Math.floor(Math.random() * 8)));
    }
    for (const fish of this.reefFish) fish.update(dt, this.world);
  }

  update(dt) {
    // Networking runs before the pause guard: a hosted room must keep its
    // heartbeat and welcome handshake alive while the title screen is up.
    if (this.mp) this.mp.tick(dt);
    if (this.paused) return;

    // Touch aim gets its fingertip-forgiveness nudge before anything reads the
    // aim point, so handleLeftClick (below, and in the held-button branch near
    // the end) always sees the nudged position.
    if (this.platform === 'touch') this.snapTouchAim();

    // Announce a hotbar switch. This sits after the pause guard so the title
    // screen never flashes an item name over the menu.
    this.watchHotbarSelection();

    this.stats.playTime += dt;
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.autosaveTimer > 0) this.autosaveTimer -= dt;

    // Timed buffs / debuffs tick down with the simulation.
    this.buffs.update(dt);
    // Screen shake / hit-stop / flash decay.
    this.feel.update(dt);
    this.feel.renderOverlay(document);

    // 1. World & Time of Day
    this.world.update(dt);
    // Cooldown so holding click on a bed cannot chain-skip days.
    if (this.bedCooldown > 0) this.bedCooldown = Math.max(0, this.bedCooldown - dt);
    if (this.altarNagTimer > 0) this.altarNagTimer -= dt;
    if (this.bedNagTimer > 0) this.bedNagTimer = Math.max(0, this.bedNagTimer - dt);
    this.sound.isNight = this.world.isNight();
    this.sound.isBoss = !!(this.boss && !this.boss.dead);

    // Extreme weather (rain, storms, blizzards, sandstorms, fog).
    // Frozen solid while the player is inside the Ossuary: there is no sky up
    // there to rain from, and the storm waiting at home keeps the exact state
    // it had the moment they were swallowed.
    if (this.weather && !this.world.isInSpace() && !this.world.isInOcean()) this.weather.update(dt, this);

    // Night announcements & Midnight boss awakening
    if (this.world.isNight() && !this.nightAnnounced) {
      this.nightAnnounced = true;
      this.showAnnouncement('🌑 THE NIGHT HAS FALLEN... BEWARE!');
    } else if (!this.world.isNight()) {
      this.nightAnnounced = false;
    }

    // Prophied encounters: the Guardian is guaranteed to appear on night 7;
    // the awakened variant remains a separate night-20 encounter. Check the
    // whole night window rather than one exact midnight tick so a frame hitch
    // or a sleeping player can never skip the event.
    if (this.world.isNight() && (!this.boss || this.boss.dead)) {
      const day7Pending = this.world.dayCount === 7 && !this.bossDaysDone.includes(7);
      const day20Pending = this.world.dayCount === 20 && !this.bossDaysDone.includes(20);
      if (day7Pending || day20Pending) {
        const autoDay = day20Pending ? 20 : 7;
        this.bossDaysDone.push(autoDay);
        this.summonBoss(autoDay === 20);
        if (autoDay === 7) this.showToast('The ancient forest has chosen this night. The Guardian is coming.');
      }
    }

    // 2. Player Update
    // Armour stats come from the piece actually WORN, not the best piece in
    // the bag. This used to take a Math.max() across every armour the player
    // merely owned, so gold on your back still granted Fallen Star defence
    // and swapping tiers did nothing at all.
    if (!this.equippedArmorId || this.countItem(this.equippedArmorId) <= 0) {
      // Nothing valid equipped (new save, or the plate was dropped/sold):
      // fall back to the best owned so existing saves keep their protection.
      const fallback = bestOwnedArmor(this);
      this.equippedArmorId = fallback ? fallback.id : null;
    }
    const wornArmor = this.equippedArmorId ? ITEMS[this.equippedArmorId] : null;
    this.player.activeArmor = wornArmor;

    // The accessory slot is validated the same way as the plate, minus the
    // "best owned" fallback — if the wings leave the bag the slot just empties.
    // hasWings is what Player.update reads for the flight tank.
    if (this.equippedAccessoryId && this.countItem(this.equippedAccessoryId) <= 0) {
      this.equippedAccessoryId = null;
    }
    const wornAccessory = this.equippedAccessoryId ? ITEMS[this.equippedAccessoryId] : null;
    this.player.setWings(wornAccessory);

    // Tell the player ONCE when the wings clamp shut, and once more when they
    // re-arm — a toast per frame would be unreadable.
    if (this.player.flightCooldown > 0) {
      if (!this._wingsLocked) {
        this._wingsLocked = true;
        this.showToast(`🪽 ${wornAccessory ? wornAccessory.name : 'Wings'} spent — recharging for ${Math.ceil(this.player.flightCooldown)}s`);
      }
    } else if (this._wingsLocked) {
      this._wingsLocked = false;
      this.showToast('🪽 Wings recharged — hold JUMP in the air to fly');
    }

    // Percentage soak is the main effect; flat defense and the Ironskin /
    // Well Fed bonuses stack additively on top of it.
    const armorReduction = wornArmor ? (wornArmor.reduction || 0) : 0;
    const armorFlat = wornArmor ? (wornArmor.defense || 0) : 0;
    this.player.armorReduction = Math.min(0.75, armorReduction);
    this.player.armorDefense = armorFlat + this.buffs.bonus('defense');

    // Swiftness and similar buffs feed straight into movement speed.
    this.player.speedMultiplier = this.buffs.multiplier('speed');

    // Regeneration. This used to run flat-out all the time, which — with the
    // old 1.5 HP/s and a Voidscale plate soaking most of a hit — meant the
    // Sovereign could out-damage nothing and the arena could be won by
    // standing in the middle of it. Regen now pauses for four seconds after
    // any hit, so it is downtime recovery, not a second health bar.
    if (this.regenLock > 0) this.regenLock = Math.max(0, this.regenLock - dt);
    const regenHp = this.buffs.bonus('regenHp');
    const regenMana = this.buffs.bonus('regenMana');
    if (regenHp > 0 && this.regenLock <= 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * regenHp);
    }
    if (regenMana > 0) this.player.mana = Math.min(this.player.maxMana, this.player.mana + dt * regenMana);

    // Fishing resolves before ordinary movement so a bite is never eaten by
    // a frame of running.
    if (this.fishing) this.updateFishing(dt);

    // While a wormhole is tearing, the rift drives the player: input, gravity
    // and collision all stand down so nothing fights the pull.
    const inRift = this.updateWormhole(dt);
    this.updateOceanSystems(dt);
    if (!inRift) this.player.update(dt, this.input, this.world, this.sound, this.particles);
    this.updateOceanFish(dt);
    this.journey?.update(dt);

    // Heavy landings kick dust and nudge the camera.
    if (this.player.landedHard) {
      this.player.landedHard = false;
      this.feel.shake(0.14);
      for (let i = 0; i < 8; i++) {
        this.particles.addParticle(
          this.player.x + Math.random() * this.player.width,
          this.player.y + this.player.height - 2,
          (Math.random() - 0.5) * 3,
          -Math.random() * 1.6,
          'rgba(203,213,225,0.6)', 3, 0.3, 0.05
        );
      }
    }

    this.lavaDamageTimer -= dt;
    const playerLeftTile = Math.floor(this.player.x / TILE_SIZE);
    const playerRightTile = Math.floor((this.player.x + this.player.width - 1) / TILE_SIZE);
    const playerTopTile = Math.floor(this.player.y / TILE_SIZE);
    const playerBottomTile = Math.floor((this.player.y + this.player.height - 1) / TILE_SIZE);
    let touchingLava = false;
    for (let tileY = playerTopTile; tileY <= playerBottomTile && !touchingLava; tileY++) {
      for (let tileX = playerLeftTile; tileX <= playerRightTile; tileX++) {
        if (this.world.getTile(tileX, tileY) === TILES.LAVA) {
          touchingLava = true;
          break;
        }
      }
    }
    if (touchingLava && this.lavaDamageTimer <= 0) {
      this.damagePlayer(24, null, '🔥 You were boiled alive in lava.');
      this.lavaDamageTimer = 0.65;
      this.showToast('🔥 Lava burns you!');
    }

    // Campfires create a small recovery zone around the player.
    const playerTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const playerTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    let nearCampfire = false;
    for (let y = playerTileY - 4; y <= playerTileY + 4 && !nearCampfire; y++) {
      for (let x = playerTileX - 4; x <= playerTileX + 4; x++) {
        if (this.world.getTile(x, y) === TILES.CAMPFIRE) {
          nearCampfire = true;
          break;
        }
      }
    }
    if (nearCampfire) {
      // Campfire warmth is now a proper buff, visible in the HUD buff bar.
      this.buffs.add('campfire', 2.5);
      this.campfireToastTimer -= dt;
      if (this.campfireToastTimer <= 0) {
        this.showToast('🔥 Campfire warmth: regenerating life and mana.');
        this.campfireToastTimer = 12;
      }
    } else {
      this.campfireToastTimer = 0;
      this.buffs.remove('campfire');
    }

    // First glimpse of the secret dungeon's stone arch on the surface.
    const dun = this.world.dungeon;
    if (dun && !dun.found) {
      const ex = (dun.x + 0.5) * TILE_SIZE;
      const ey = (dun.entranceY + 0.5) * TILE_SIZE;
      if (Math.abs(this.player.x + this.player.width / 2 - ex) < 34 * TILE_SIZE &&
          Math.abs(this.player.y + this.player.height / 2 - ey) < 14 * TILE_SIZE) {
        dun.found = true;
        this.journey?.discoverDungeon();
        this.showAnnouncement('🪨 A DROWNED OATH-SEAL GLOOMS BESIDE THE BLACKWATER...');
        this.showToast('🗺️ Marked on the minimap — S drops through platforms.');
      }
    }

    // Continuous mouse hold (auto-swing / auto-mine)
    if (this.input.mouseDown && !this.player.isSwinging) {
      this.handleLeftClick();
    }

    // 3. Camera Smooth Following
    const targetCamX = this.player.x + this.player.width / 2 - this.camera.viewportWidth / 2;
    const targetCamY = this.player.y + this.player.height / 2 - this.camera.viewportHeight / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;
    // World bounds
    this.camera.x = Math.max(0, Math.min(this.world.pixelWidth - this.camera.viewportWidth, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.world.pixelHeight - this.camera.viewportHeight, this.camera.y));

    // 4. Friendly wildlife Spawning AI
    // No meadows in the Ossuary: the arena is bone and vacuum, so the surface
    // profile there must never be read as grass to graze on.
    this.critterTimer += dt;
    if (!this.world.isInSpace() && !this.world.isInOcean() && !this.world.isNight() && this.critterTimer >= 5.0) {
      this.critterTimer = 0;
      if (this.critters.length < 6) {
        const spawnDir = Math.random() > 0.5 ? 1 : -1;
        const critterX = this.player.x + spawnDir * (Math.random() * 280 + 180);
        const tileX = Math.floor(critterX / TILE_SIZE);
        if (tileX >= 5 && tileX < this.world.width - 5) {
          const type = Math.random() > 0.42 ? 'sheep' : 'bunny';
          const critterY = (this.world.surfaceHeights[tileX] - 1) * TILE_SIZE - (type === 'sheep' ? 0 : 6);
          this.critters.push(new Critter(critterX, critterY, type));
        }
      }
    }

    for (let i = this.critters.length - 1; i >= 0; i--) {
      const critter = this.critters[i];
      critter.update(dt, this.player, this.world);
      // Wildlife used to have no distance cull at all — only dying removed one
      // — so sheep spawned on a long walk accumulated for the whole session and
      // went on being simulated across the map. Retire anything well out of
      // play, the same way monsters are retired.
      const critterDist = Math.hypot(
        (critter.x + critter.width / 2) - (this.player.x + this.player.width / 2),
        (critter.y + critter.height / 2) - (this.player.y + this.player.height / 2)
      );
      if (critterDist > 2200) {
        this.critters.splice(i, 1);
        continue;
      }
      if (critter.dead) {
        if (critter.type === 'sheep') {
          this.drops.push(new DropItem(critter.x, critter.y, 'wool', 2));
        }
        this.drops.push(new DropItem(critter.x + 5, critter.y, 'raw_mutton', 1));
        this.critters.splice(i, 1);
      }
    }

    // 5. Enemy Spawning AI
    const currentTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const isUnderworld = Math.floor(this.player.y / TILE_SIZE) >= this.world.underworldStart;
    this.spawnTimer += dt;
    // Hostile spawns are deliberately slow: one roll every ~7s, capped low.
    // Daytime surface stays peaceful; ordinary cave spawns are disabled.
    // Daytime biome wildlife (wolves, hyenas...) look scary but never spawn
    // by day — they are night-only encounters.
    if (!this.mp?.isClient && this.spawnTimer >= 7.0) {
      this.spawnTimer = 0;
      const night = this.world.isNight();
      if (this.monsters.length < (isUnderworld ? 10 : night ? 6 : 2)) {
        const spawnDir = Math.random() > 0.5 ? 1 : -1;
        const mX = this.player.x + spawnDir * (Math.random() * 120 + 180);
        const tileX = Math.floor(mX / TILE_SIZE);
        if (tileX >= 5 && tileX < this.world.width - 5) {
          const biome = this.world.getBiomeAtX(tileX);
          const underground = Math.floor(this.player.y / TILE_SIZE) > this.world.surfaceHeights[tileX] + 12;
          const underworld = Math.floor(this.player.y / TILE_SIZE) >= this.world.underworldStart;
          const reefColumn = this.world.isReefAtX(tileX);
          const mY = underworld
            ? Math.max((this.world.underworldStart + 3) * TILE_SIZE, this.player.y - 40 - Math.random() * 120)
            : reefColumn ? (this.world.surfaceHeights[tileX] - 10) * TILE_SIZE
              : underground ? this.player.y - 80 : (this.world.surfaceHeights[tileX] - 3) * TILE_SIZE;
          let mType = 'zombie';
          if (underground && !underworld) {
            // Keep the caves quiet: normal hostile spawns belong above ground.
            this.spawnTimer = 0;
            mType = null;
          } else if (underworld) {
            const roll = Math.random();
            mType = roll < 0.45 ? 'hellhound' : roll < 0.78 ? 'imp' : 'bone_serpent';
          } else if (reefColumn && Math.random() < (night ? 0.32 : 0.2)) {
            mType = 'shark';
          } else if (reefColumn && Math.random() < (night ? 0.45 : 0.28)) {
            mType = 'pirate';
          } else if (night) {
            const roll = Math.random();
            if (biome === 'snow') mType = ['snow_wolf', 'ice_golem', 'snow_bat'][Math.floor(roll * 3)];
            else if (biome === 'plains') mType = ['savanna_hyena', 'zombie', 'demon_eye'][Math.floor(roll * 3)];
            else if (biome === 'savanna') mType = ['savanna_hyena', 'sun_scorpion', 'ostrich'][Math.floor(roll * 3)];
            else if (biome === 'swamp') mType = ['swamp_slime', 'swamp_mosquito', 'bog_witch'][Math.floor(roll * 3)];
            else if (roll < 0.45) mType = 'demon_eye';
            else if (roll < 0.75) mType = 'zombie';
            else mType = 'wraith';
          } else {
            // Peaceful daylight surface: never spawn surface hostiles by day.
            // Reset the timer so day rolls stay slow instead of bursting at dusk.
            this.spawnTimer = 0;
            mType = null;
          }
          const darkness = underworld ? 0.04 : this.world.isNight() ? 0.22 : 0.5;
      const lit = this.world.lightSources.reduce((max, source) => {
        const d = Math.hypot((source.x || 0) - mX, (source.y || 0) - mY);
        return Math.max(max, 1 - d / (source.radius * 3.2));
      }, 0);
      const darkChance = Math.max(0.04, Math.min(0.95, darkness + (1 - lit) * 0.55));
      // The Ossuary breeds nothing: the Sovereign summons its own undead and the
      // overworld's biome tables must not leak a zombie into the arena.
      if (this.world.isInSpace() || this.world.isInOcean() || Math.random() > darkChance) {
        this.spawnTimer = 0;
      } else if (mType && (underworld || !underground)) {
        // Never spawn inside rock. The surface branch above takes its Y straight
        // from the heightmap column and the underground branches use a fixed
        // offset to the player, and neither checked whether that tile was
        // actually open -- so a monster could materialise inside a cave wall
        // and sit there forever. Search outward for somewhere it can stand,
        // and skip the roll entirely when there is nowhere nearby.
        const spot = mType === 'shark'
          ? this.findOpenReefSwimSpawn(mX, mY)
          : this.findOpenSpawn(mX, mY);
        if (spot) {
          const spawn = underworld
            ? new UnderworldMonster(spot.x, spot.y, mType)
            : new Monster(spot.x, spot.y, mType);
          // Elites are promoted more often the longer a world has survived,
          // which keeps late nights dangerous without flooding the screen.
          const eliteChance = underworld ? 0.22 : this.eliteChance + Math.min(0.18, (this.world.dayCount - 1) * 0.015);
          if (mType !== 'shark' && (night || underground || underworld) && Math.random() < eliteChance) spawn.makeElite();
          this.monsters.push(spawn);
        } else {
          this.spawnTimer = 0;
        }
      }
        }
      }
    }

    // 6. Update Monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      // Guests never simulate: position, hp and death arrive as 10Hz host
      // snapshots (multiplayer.js _onMobSnapshot) and the host owns the AI.
      if (this.mp && this.mp.isClient) continue;

      // Despawn anything that has wandered far out of play.
      const farFromPlayer = Math.hypot(
        (m.x + m.width / 2) - (this.player.x + this.player.width / 2),
        (m.y + m.height / 2) - (this.player.y + this.player.height / 2)
      );
      if (farFromPlayer > 2000) {
        this.monsters.splice(i, 1);
        continue;
      }

      // AI chases whoever is actually nearest — in a session that can be a
      // guest's character, not only the host's.
      const aiTarget = (this.mp && this.mp.isHost
        ? this.mp.nearestChaseTarget(m.x + m.width / 2, m.y + m.height / 2)
        : null) || this.player;
      m.update(dt, aiTarget, this.world);

      // Hellfire Venom (Hellstone Greatblade): damage over time, credited to
      // stats so poison kills are attributed the same way as direct hits.
      if (m.poisonTime > 0) {
        const venom = m.tickPoison(dt, this.particles);
        if (venom > 0) this.stats.damageDealt += venom;
      }

      // Monster touches player — or, in a session, whichever character is
      // standing inside it. Host-only: guests receive their hits as 'ph'.
      const pMidX = this.player.x + this.player.width / 2;
      const pMidY = this.player.y + this.player.height / 2;
      const mMidX = m.x + m.width / 2;
      const mMidY = m.y + m.height / 2;
      const touchingHost = Math.abs(pMidX - mMidX) < (this.player.width + m.width) / 2 &&
          Math.abs(pMidY - mMidY) < (this.player.height + m.height) / 2;
      if (!m.touchCooldown || m.touchCooldown <= 0) {
        if (touchingHost) {
          this.damagePlayer(m.damage, mMidX, `${m.displayName} tore you apart.`, false, mMidY);
          m.touchCooldown = 1.0; // one hit per second max per monster
        } else if (this.mp && this.mp.isHost) {
          const victim = this.mp.peerTouchingBox(
            mMidX - m.width / 2, mMidY - m.height / 2,
            mMidX + m.width / 2, mMidY + m.height / 2);
          if (victim) {
            this.mp.sendPlayerHit(victim, m.damage,
              `${m.displayName} tore you apart.`, false, mMidX, mMidY);
            m.touchCooldown = 1.0;
          }
        }
      }
      if (m.touchCooldown > 0) m.touchCooldown -= dt;

      if (m.dead) {
        if (this.mp && this.mp.isClient) {
          // Death and loot belong to the host: the 'kd' frame credits the
          // kill and spawns this player's drops. Client hits are clamped to
          // 1hp so a corpse should never actually reach this line, but splice
          // rather than wedge the array if one does.
          this.monsters.splice(i, 1);
          continue;
        }
        const mpDropStart = this.drops.length;
        this.stats.kills += 1;
        this.journey?.recordActivity('hunt', m.x + m.width / 2, m.y);
        if (this.npcs) this.npcs.onKill(m);
        if (m.isElite) this.stats.eliteKills += 1;
        // Terraria-style loot: coins and materials, better rolls for elites.
        if (Math.random() < 0.5) {
          this.drops.push(new DropItem(m.x, m.y, 'acorn', 1));
        }
        if (m.isElite) {
          this.drops.push(new DropItem(m.x, m.y, 'gold_ore', 2));
          this.drops.push(new DropItem(m.x + 8, m.y, 'crystal', 1));
        }
        if (Math.random() < 0.3) {
          this.drops.push(new DropItem(m.x, m.y, 'healing_potion', 1));
        }
        if (m.type === 'cave_spider' && Math.random() < 0.5) {
          this.drops.push(new DropItem(m.x, m.y, 'crystal', 1));
        }
        if (m.type === 'pirate') {
          this.drops.push(new DropItem(m.x + 6, m.y - 4, 'coral_fragment', 2));
          if (Math.random() < 0.2) this.drops.push(new DropItem(m.x + 12, m.y - 8, 'fish_manta', 1));
        }
        if (m.type === 'shark') {
          this.drops.push(new DropItem(m.x + 8, m.y - 3, 'coral_fragment', 2));
          if (Math.random() < 0.25) this.drops.push(new DropItem(m.x + 16, m.y - 5, 'fish_manta', 1));
        }
        if (m.type === 'snow_wolf' || m.type === 'savanna_hyena' || m.type === 'swamp_slime') {
          this.drops.push(new DropItem(m.x, m.y, 'raw_mutton', 1));
        }
        // Fallen stars now tumble from uncommon and elite monster kills, making
        // the star armor a satisfying expedition reward instead of a boss-only item.
        if (m.isElite ? Math.random() < 0.55 : Math.random() < 0.08) {
          this.drops.push(new DropItem(m.x + 4, m.y - 4, 'fallen_star', 1));
        }
        if (m.underworld) {
          this.drops.push(new DropItem(m.x + 4, m.y - 4, 'hellstone', m.species === 'bone_serpent' ? 3 : 2));
          if (m.species === 'bone_serpent' || Math.random() < 0.65) {
            this.drops.push(new DropItem(m.x + 8, m.y - 6, 'bone', m.species === 'bone_serpent' ? 2 : 1));
          }
          if (m.species === 'imp' || Math.random() < 0.38) this.drops.push(new DropItem(m.x + 12, m.y, 'demon_soul', 1));
        }
        this.monsters.splice(i, 1);
        if (m.dungeonGatekeeper) {
          const gateDungeon = this.world.dungeon;
          if (gateDungeon) gateDungeon.gateDefeated = true;
          this.world.setTile(gateDungeon.x, gateDungeon.entranceY - 1, TILES.AIR);
          this.showAnnouncement('🗝️ THE OATH-SEAL SHATTERS — THE DUNGEON OPENS!');
          this.showToast('The stairway below is now accessible.');
          this.drops.push(new DropItem(m.x, m.y - 8, 'life_crystal', 1));
          this.drops.push(new DropItem(m.x + 12, m.y - 4, 'fallen_star', 2));
        }
        // Flag the loot above as host-owned and ship the kill + drop list to
        // every guest, so each player collects their own copy of the haul.
        this.mp?.hostMobDeath(m, mpDropStart);
      }
    }

    // A defeated boss is removed on the very next frame, before normal update.
    // Keep this outside the `!dead` block below; victory rewards and bar cleanup
    // used to be unreachable because the old guard only entered living bosses.
    if (this.boss && this.boss.dead) {
      // Index of the floor where this machine's boss bag lands. Guests spawn
      // their own bag in this very block, so on the host these drops are
      // marked local instead of broadcast (mp.markLocalDrops).
      const mpBossDropStart = this.drops.length;
      const defeatedKnight = this.boss.kind === 'knight';
      const defeatedDemon = this.boss.kind === 'demon';
      const defeatedDragon = this.boss.kind === 'dragon';
      const defeatedLeviathan = this.boss.kind === 'leviathan';
      this.stats.bossKills += 1;
      this.journey?.recordActivity('hunt', this.boss.x + this.boss.width / 2, this.boss.y);
      // Remember which bosses this world has ever felled — the journal scores
      // variety, so a second Guardian is worth less than a first Knight.
      this._bossKinds = this._bossKinds || {};
      const bossKey = this.boss.kind || 'forest';
      const firstTime = !this._bossKinds[bossKey];
      this._bossKinds[bossKey] = true;
      if (firstTime) {
        this.logDiscovery(`boss_${bossKey}`,
          defeatedLeviathan ? '🌊 First Three-Headed Sea Leviathan Defeated!'
            : defeatedDragon ? '🌌 First Ossuary Sovereign Defeated!'
              : defeatedDemon ? '🔥 First Hellbound Demon Defeated!'
                : defeatedKnight ? '⚔️ First Cursed Knight Defeated!' : '👑 First Forest Guardian Defeated!',
          defeatedLeviathan ? 1000 : defeatedDragon ? 900 : defeatedDemon ? 600 : 300);
      }
      const bossPanel = document.getElementById('boss-panel');
      if (bossPanel) bossPanel.classList.add('hidden');
      this.sound.isBoss = false;
      this.showAnnouncement(defeatedLeviathan
        ? '🌊 THE THREE-HEADED SEA LEVIATHAN HAS FALLEN!'
        : defeatedDragon
        ? '🌌 THE OSSUARY SOVEREIGN HAS FALLEN!'
        : defeatedDemon
          ? '🔥 THE HELLBOUND DEMON HAS FALLEN!'
          : defeatedKnight ? '⚔️ THE CURSED KNIGHT IS UNDONE!' : '👑 THE ANCIENT FOREST GUARDIAN HAS BEEN FELLED!');
      this.feel.slow(defeatedLeviathan ? 2.8 : defeatedDragon ? 3.0 : defeatedDemon ? 2.4 : 1.6,
        defeatedLeviathan ? 0.15 : defeatedDragon ? 0.12 : defeatedDemon ? 0.18 : 0.25);
      this.feel.shake(defeatedLeviathan ? 2.2 : defeatedDragon ? 2.4 : defeatedDemon ? 1.8 : 1.0);
      const rewardIds = defeatedLeviathan
        ? ['sea_scale', 'coral_fragment', 'fish_manta', 'fish_angler', 'sacred_pearl']
        : defeatedDragon
        ? ['dragonbone', 'meteor_shard', 'nebula_crystal', 'crystal', 'life_crystal', 'mana_crystal']
        : defeatedDemon
          ? ['hellstone', 'obsidian_block', 'demon_soul', 'life_crystal', 'mana_crystal']
          : defeatedKnight
            ? ['crystal', 'diamond', 'gold_ore', 'fallen_star', 'life_crystal', 'mana_crystal']
            : ['gold_ore', 'iron_ore', 'crystal', 'diamond', 'fallen_star', 'life_crystal', 'mana_crystal'];
      const bagCount = defeatedLeviathan ? 12 : defeatedDragon ? 18 : defeatedDemon ? 12 : defeatedKnight ? 7 : 8;
      for (let i = 0; i < bagCount; i++) {
        this.drops.push(new DropItem(this.boss.x + i * 10 - 40, this.boss.y, rewardIds[i % rewardIds.length],
          defeatedLeviathan ? 6 : defeatedDragon ? 4 : defeatedDemon ? 3 : 2));
      }
      this.drops.push(new DropItem(this.boss.x, this.boss.y - 12,
        defeatedLeviathan ? 'leviathan_trophy'
          : defeatedDragon ? 'dragon_trophy' : defeatedDemon ? 'demon_trophy'
            : defeatedKnight ? 'cursed_edge' : 'guardian_trophy', 1));
      if (defeatedLeviathan) {
        this.drops.push(new DropItem(this.boss.x + 16, this.boss.y - 20, 'leviathan_trident', 1));
        this.leviathanHP = null;
        this.leviathanSlain = true;
      }
      if (defeatedDemon) this.drops.push(new DropItem(this.boss.x + 12, this.boss.y - 20, 'inferno_brand', 1));
      // The Sovereign drops its own gear: the apex weapon, the wings that let
      // you fly, and the Voidscale plate itself. The forge recipe stays as a
      // backup so a lost piece can be rebuilt from the trophy.
      if (defeatedDragon) this.drops.push(new DropItem(this.boss.x + 16, this.boss.y - 20, 'void_star_blade', 1));
      // FIRST SOVEREIGN ONLY. The wings and the Wyrmplate have no recipe at
      // all, so this first kill is their only source in the game — dragons two,
      // three and onward are fought for the trophy, the fang and the ore, not
      // for gear the player already owns. Read BEFORE onDragonDefeated(), which
      // is what increments the counter.
      const firstSovereign = this.dragonKills < 1;
      if (defeatedDragon && firstSovereign) this.drops.push(new DropItem(this.boss.x - 14, this.boss.y - 18, 'dragon_wings', 1));
      if (defeatedDragon) this.drops.push(new DropItem(this.boss.x + 2, this.boss.y - 34, 'voidscale_armor', 1));
      // Its own plate and its own fang: the apex gear, scattered with the rest
      // of its skeleton. A 100,000 HP fight should not end in one item.
      if (defeatedDragon && firstSovereign) this.drops.push(new DropItem(this.boss.x - 30, this.boss.y - 40, 'ossuary_armor', 1));
      if (defeatedDragon) this.drops.push(new DropItem(this.boss.x + 28, this.boss.y - 8, 'ossuary_blade', 1));
      if (defeatedDragon) this.onDragonDefeated();
      // The final boss gets a finale: snapshot the spine while the boss object
      // still exists (this block nulls it below), and hold the victory screen
      // until the show has had its moment — it is a full-screen overlay and
      // would cover the whole spectacle if it dropped now.
      if (defeatedDragon && typeof DragonFinale === 'function') {
        this.dragonFinale = new DragonFinale(this.boss);
        this.victoryDelay = 6.0;
      }
      const vTitle = document.querySelector('#victory-screen .victory-title');
      const vLead = document.querySelector('#victory-screen .victory-content > p');
      if (defeatedLeviathan) {
        if (vTitle) vTitle.textContent = '🌊 THE SEA LEVIATHAN IS BROKEN!';
        if (vLead) vLead.textContent = 'All three heads have fallen. The Tidal Gate remains open, and the ocean planet is yours to explore. Gather Leviathan Scales and craft the trident from its trophy.';
      } else if (defeatedDragon) {
        if (vTitle) vTitle.textContent = '🌌 THE OSSUARY SOVEREIGN IS BROKEN!';
        if (vLead) vLead.textContent = 'The last king of the dead sky lies in pieces among its own bones. Its wings, the Skeletal Wyrmplate and its own fang fell with it — and they will never fall again, because there is only one of each. The rift home is still open, the arena is full of treasure — and the Sovereign stays dead. Mine the bones, and another Rite of Waking read on them will bring another; it will cost you far more than the first.';
      } else if (defeatedDemon) {
        if (vTitle) vTitle.textContent = '🔥 THE HELLBOUND DEMON IS UNDONE!';
        if (vLead) vLead.textContent = 'The infernal king has fallen. The Underworld is finally quiet... for now.';
      } else if (defeatedKnight) {
        if (vTitle) vTitle.textContent = '⚔️ THE CURSED KNIGHT IS UNDONE!';
        if (vLead) vLead.textContent = 'The statue’s curse is broken — the buried chapel is safe once more.';
      } else {
        if (vTitle) vTitle.textContent = '👑 THE FOREST IS SAVED!';
        if (vLead) vLead.textContent = 'You have conquered the Ancient Forest Guardian and survived the terrors of the night.';
      }
      const victoryStats = document.getElementById('victory-stats');
      if (victoryStats) victoryStats.textContent = this.describeRun();
      const victoryScreen = document.getElementById('victory-screen');
      // Non-dragon bosses curtain-drop immediately; the Sovereign's screen is
      // raised by the update loop once this.victoryDelay runs out.
      if (victoryScreen && !defeatedDragon) victoryScreen.classList.remove('hidden');
      this.mp?.markLocalDrops(mpBossDropStart);
      this.boss = null;
    }

    // The Sovereign's death show runs after the boss object itself is gone:
    // tick it here, and raise the held victory screen when the show is over.
    if (this.dragonFinale) {
      this.dragonFinale.update(dt, this);
      if (this.dragonFinale.done) this.dragonFinale = null;
    }
    if (this.victoryDelay > 0 && !this.isDead) {
      this.victoryDelay -= dt;
      if (this.victoryDelay <= 0) {
        this.victoryDelay = 0;
        const vScreen = document.getElementById('victory-screen');
        if (vScreen) vScreen.classList.remove('hidden');
      }
    }

    // 7. Update Boss
    if (this.boss && !this.boss.dead) {
      if (!(this.mp && this.mp.isClient)) {
        // The host drives the boss, and its AI gives chase to whichever
        // living character is closest — guests included. Guests only
        // interpolate a puppet (multiplayer.js updatePuppets).
        const bossTarget = (this.mp && this.mp.isHost
          ? this.mp.nearestChaseTarget(this.boss.x + this.boss.width / 2,
            this.boss.y + this.boss.height / 2)
          : null) || this.player;
        this.boss.update(dt, bossTarget, this.projectiles, this.sound, this.particles, this.world);

        // Venom on the boss too. Feature-detected because DemonBoss carries its
        // own poison implementation while Monster/UnderworldMonster have theirs.
        if (typeof this.boss.tickPoison === 'function' && this.boss.poisonTime > 0) {
          const venom = this.boss.tickPoison(dt, this.particles);
          if (venom > 0) this.stats.damageDealt += venom;
        }
      }

      // Arcane motes drift off every boss — cheap, constant, very cool.
      if (Math.random() < 0.5) {
        const moteColor = this.boss.kind === 'dragon' ? (this.boss.phase === 3 ? '#fde047' : this.boss.phase === 2 ? '#c084fc' : '#a5f3fc')
          : this.boss.kind === 'demon' ? (this.boss.phase === 3 ? '#f43f5e' : '#fb923c') : this.boss.kind === 'knight'
            ? (this.boss.phase === 2 ? '#c084fc' : '#818cf8')
            : (this.boss.enraged ? '#fde047' : '#4ade80');
        this.particles.addParticle(
          this.boss.x + Math.random() * this.boss.width,
          this.boss.y + Math.random() * this.boss.height,
          (Math.random() - 0.5) * 0.6, -0.6 - Math.random() * 0.5,
          moteColor, 3, 0.7, -0.02
        );
      }

      // Boss touch damage — host/SP only; guests receive their hits as 'ph'.
      if (!(this.mp && this.mp.isClient)) {
        const pMidX = this.player.x + this.player.width / 2;
        const pMidY = this.player.y + this.player.height / 2;
        const bMidX = this.boss.x + this.boss.width / 2;
        const bMidY = this.boss.y + this.boss.height / 2;
        // The Sovereign is a nineteen-piece serpent, so it is asked for its own
        // hit test instead of trusting one circle around the head — otherwise its
        // tail passes straight through you.
        const touching = typeof this.boss.overlapsPlayer === 'function'
          ? this.boss.overlapsPlayer(this.player)
          : Math.hypot(pMidX - bMidX, pMidY - bMidY) < (this.player.width + this.boss.width) / 2;
        const touchDamage = this.boss.kind === 'demon' ? [45, 60, 75][this.boss.phase - 1]
          : typeof this.boss.touchDamage === 'function' ? this.boss.touchDamage()
            : this.boss.phase === 1 ? 25 : 35;
        if (touching) {
          this.damagePlayer(touchDamage, bMidX, `${this.boss.name} crushed you.`, true, bMidY);
        } else if (this.mp && this.mp.isHost) {
          // No guest is exempt: if someone else is inside the boss, THEY wear
          // the stomp instead of the host.
          const victim = this.mp.peerTouchingBox(
            bMidX - this.boss.width / 2, bMidY - this.boss.height / 2,
            bMidX + this.boss.width / 2, bMidY + this.boss.height / 2);
          if (victim) {
            this.mp.sendPlayerHit(victim, touchDamage,
              `${this.boss.name} crushed you.`, true, bMidX, bMidY);
          }
        }
      }

      // Update Boss Bar
      const bossPanel = document.getElementById('boss-panel');
      const bossHpBar = document.getElementById('boss-hp-bar');
      const bossHpText = document.getElementById('boss-hp-text');
      const bossName = document.getElementById('boss-name');
      const bossBadge = document.getElementById('boss-phase-badge');

      if (bossPanel) bossPanel.classList.remove('hidden');
      if (bossHpBar) bossHpBar.style.width = `${Math.max(0, (this.boss.hp / this.boss.maxHp) * 100)}%`;
      if (bossHpText) bossHpText.textContent = `${Math.max(0, Math.floor(this.boss.hp))} / ${this.boss.maxHp}`;
      if (bossName) bossName.textContent = this.boss.name;
      if (bossBadge) {
        bossBadge.textContent = `PHASE ${this.boss.phase}`;
        bossBadge.className = this.boss.phase >= 2 ? 'boss-phase-badge enraged' : 'boss-phase-badge';
      }

      if (this.boss.dead) {
        // Boss Defeated! Victory copy + loot differ per boss.
        const mpBoss2DropStart = this.drops.length;
        const knightWin = this.boss.kind === 'knight';
        this.stats.bossKills += 1;
        document.getElementById('boss-panel').classList.add('hidden');
        this.showAnnouncement(knightWin
          ? '⚔️ THE CURSED KNIGHT IS UNDONE!'
          : '👑 THE ANCIENT FOREST GUARDIAN HAS BEEN FELLED!');
        this.feel.slow(1.6, 0.25);
        this.feel.shake(1.0);

        // Terraria-style boss bag: guaranteed gear plus a trophy.
        const rewards = knightWin
          ? ['crystal', 'diamond', 'gold_ore', 'fallen_star', 'life_crystal', 'mana_crystal']
          : ['gold_ore', 'iron_ore', 'crystal', 'diamond', 'fallen_star', 'life_crystal', 'mana_crystal'];
        const bagCount = knightWin ? 7 : 8;
        for (let l = 0; l < bagCount; l++) {
          const id = rewards[l % rewards.length];
          this.drops.push(new DropItem(this.boss.x + l * 10 - 40, this.boss.y, id, 2));
        }
        this.drops.push(new DropItem(this.boss.x, this.boss.y - 12,
          knightWin ? 'cursed_edge' : 'guardian_trophy', 1));

        // Per-boss victory screen copy.
        const vTitle = document.querySelector('#victory-screen .victory-title');
        const vLead = document.querySelector('#victory-screen .victory-content > p');
        if (knightWin) {
          if (vTitle) vTitle.textContent = '⚔️ THE CURSED KNIGHT IS UNDONE!';
          if (vLead) vLead.textContent = 'The statue’s curse is broken — the buried chapel is safe once more.';
        } else {
          if (vTitle) vTitle.textContent = '👑 THE FOREST IS SAVED!';
          if (vLead) vLead.textContent = 'You have conquered the Ancient Forest Guardian and survived the terrors of the night.';
        }
        const victorySub = document.getElementById('victory-stats');
        if (victorySub) victorySub.textContent = this.describeRun();
        document.getElementById('victory-screen').classList.remove('hidden');
        this.mp?.markLocalDrops(mpBoss2DropStart);
      }
    }

    this.updateCerberus(dt);

    // 8. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.world, this.particles);

      if (p.isHostile) {
        // Hits a player — host/SP only. Hostile shots are born from mob and
        // boss AI, which only the host runs, so a guest's screen has none;
        // the guest wears its hits when the host forwards them as 'ph'.
        if (!(this.mp && this.mp.isClient)) {
          const pMidX = this.player.x + this.player.width / 2;
          const pMidY = this.player.y + this.player.height / 2;
          const nearHost = Math.hypot(p.x - pMidX, p.y - pMidY) < 18;
          const nearGuest = this.mp ? this.mp.avatarNear(p.x, p.y, 18) : false;
          if (nearHost || nearGuest) {
            p.dead = true;
            // Boss skill shots carry `fromBoss` (set at every hostile spawn site)
            // and must sail past the trash ceiling — see trashDamageCeiling.
            // "The dragon's skills only do 4 damage" was this line defaulting to
            // isBoss=false: a 60-92 shard got capped to ~14, then armour
            // finished it. An unflagged hostile projectile is still a trash
            // ranged hit and stays capped. damagePlayer routes the hit to
            // whoever is closest to (p.x, p.y) — host or guest.
            this.damagePlayer(p.damage, p.x, 'You were struck down by a projectile.',
              p.fromBoss === true, p.y);
          }
        }
      } else {
        // Hits monsters
        for (const m of this.monsters) {
          const mMidX = m.x + m.width / 2;
          const mMidY = m.y + m.height / 2;
          if (Math.hypot(p.x - mMidX, p.y - mMidY) < 18) {
            p.dead = true;
            const isCrit = Math.random() < 0.25;
            const roll = this.rollDamage(p.damage, null);
            const crit = isCrit || roll.crit;
            const dealt = m.takeDamage(roll.damage, this.sound, this.particles, crit, {
              kbDir: p.vx >= 0 ? 1 : -1,
              kbForce: 2.6
            }) || 0;
            // Guests report the shot so the host can apply it for real; the
            // helper also keeps a local corpse at 1hp until the host confirms.
            this.mp?.sendMobHit(m, roll.damage, crit);
            if (dealt > 0) {
              this.stats.damageDealt += dealt;
              this.feel.stop(crit ? 0.075 : 0.03, 0.07);
              this.feel.shake(crit ? 0.2 : 0.07);
            }
            break;
          }
        }
        // Hits boss
        if (!p.dead && this.boss && !this.boss.dead) {
          const bMidX = this.boss.x + this.boss.width / 2;
          const bMidY = this.boss.y + this.boss.height / 2;
          // Same story as the melee path: an arrow that clearly crosses the
          // serpent's body has to bite. The skull pays full, the spine pays the
          // 8% body tax; bosses without hit points of their own keep the old
          // 36px centre test.
          let struck = null;
          if (typeof this.boss.nearestHitTarget === 'function') {
            struck = this.boss.nearestHitTarget(p.x, p.y, 0);
          } else if (Math.hypot(p.x - bMidX, p.y - bMidY) < 36) {
            struck = { x: bMidX, y: bMidY, head: true };
          }
          // Cover works against arrows too: the shooter must see the boss.
          // Without this an arrow exploding against the near face of a wall
          // still splashed the boss standing on the far face, because the
          // 36px centre test ignores what is between the two points.
          if (struck) {
            const sMidX = this.player.x + this.player.width / 2;
            const sMidY = this.player.y + this.player.height / 2;
            if (!this.bossLineOfSight(sMidX, sMidY, struck.x, struck.y)) struck = null;
          }
          if (struck) {
            p.dead = true;
            const roll = this.rollDamage(p.damage, null);
            const scaled = typeof this.boss.scaleDamageFor === 'function'
              ? this.boss.scaleDamageFor(struck, roll.damage) : roll.damage;
            const dealt = this.boss.takeDamage(scaled, this.sound, this.particles, roll.crit) || 0;
            this.mp?.sendBossHit(scaled, roll.crit);
            if (dealt > 0) {
              this.stats.damageDealt += dealt;
              this.feel.stop(roll.crit ? 0.06 : 0.035, 0.07);
              this.feel.shake(roll.crit ? 0.18 : 0.09);
            }
          }
        }
      }

      if (p.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // 9. Update Drop Items & Vacuum pickup
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.update(dt, this.world);

      const pMidX = this.player.x + this.player.width / 2;
      const pMidY = this.player.y + this.player.height / 2;
      const dist = Math.hypot(pMidX - (d.x + 7), pMidY - (d.y + 7));

      // Magnet pull towards player
      if (dist < 80 && d.pickupDelay <= 0) {
        d.x += (pMidX - (d.x + 7)) * 0.15;
        d.y += (pMidY - (d.y + 7)) * 0.15;
      }

      // Pickup. addItemUpTo returns what ACTUALLY fit, and the drop is only
      // reduced by that much — so a partly-full bag takes what it can and the
      // rest stays on the floor, with no way to mint the difference.
      if (dist < 22 && d.pickupDelay <= 0) {
        const taken = this.addItemUpTo(d.id, d.count);
        if (taken > 0) {
          if (d.id === 'wood') {
            this.stats.woodCollected += taken;
            this.journey?.recordActivity('gather', d.x, d.y);
          }
          this.sound.playPickup();
          this.particles.magicSparkle(d.x, d.y, '#fef08a', 6);
          this.showToast(`+${taken} ${ITEMS[d.id] ? ITEMS[d.id].name : d.id}`);
          d.count -= taken;
          if (d.count <= 0) {
            this.drops.splice(i, 1);
            continue;
          }
          // Still a partial pickup: freeze the magnet so the remainder does not
          // vacuum itself the instant a slot frees up somewhere else, and give
          // the player a moment to see what is left.
          d.pickupDelay = 0.5;
        }
      }

      if (d.life <= 0) {
        this.drops.splice(i, 1);
      }
    }

    // 10. Update Particles
    this.particles.update(dt, this.world.pixelWidth, this.world.pixelHeight);

    // 11. Villagers, fog-of-war map + timed autosave
    if (this.npcs && !this.world.isInSpace() && !this.world.isInOcean()) this.npcs.update(dt);
    this.minimap.update(dt, this);
    this.minimap.render(this);
    if (this.autosaveTimer <= 0) {
      this.autosaveTimer = this.autosaveInterval || 90;
      this.saveGame(true);
    }
    // Shared-stash writes are batched: Ctrl+clicking twenty items is one write,
    // not twenty synchronous localStorage calls in the middle of gameplay.
    if (this.savedDirty) this.saveSharedInventory();

    // 12. Update HUD Bars, buff rack & clock
    this.updateHUD();

    // 13. Death check (covers starvation and any other stray damage source)
    if (this.player.hp <= 0 && !this.isDead) {
      // Starvation no longer goes through damagePlayer(), so it never set a cause
      // of its own. Name it here, where the death screen reads it from.
      if (this.player.starving) this.deathCause = '🍎 You starved to death.';
      this.isDead = true;
      this.onPlayerDeath();
    }
    if (this.isDead) {
      // While slain the player is harmless and cannot be hit again.
      this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 0.5);
    }
  }

  /**
   * Cache the HUD elements once. updateHUD() runs every frame and used to do
   * ~20 getElementById lookups per call; holding the handles makes it free.
   */
  hudEl(id) {
    if (!this._hudEls) this._hudEls = new Map();
    let el = this._hudEls.get(id);
    if (el === undefined) {
      el = document.getElementById(id);
      this._hudEls.set(id, el);
    }
    // A cached null means "not in this document" — do not re-query it forever.
    return el;
  }

  /** Assign textContent only when it actually changed (avoids style recalc). */
  setText(id, value) {
    const el = this.hudEl(id);
    if (!el) return;
    if (el.textContent !== value) el.textContent = value;
  }

  /** Assign innerHTML only when it actually changed. */
  setHTML(id, value) {
    const el = this.hudEl(id);
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value;
  }

  /** Assign className only when it actually changed. */
  setClass(id, value) {
    const el = this.hudEl(id);
    if (!el) return;
    if (el.className !== value) el.className = value;
  }

  /** Assign style.width only when it actually changed. */
  setWidth(id, pct) {
    const el = this.hudEl(id);
    if (!el) return;
    const v = `${pct}%`;
    if (el.style.width !== v) el.style.width = v;
  }

  updateHUD() {
    // Time & Badges
    this.setText('time-text', this.world.getTimeFormatted());
    const night = this.world.isNight();
    this.setText('time-icon', night ? '🌙' : '☀️');
    this.setClass('cycle-badge', night ? 'badge-night' : 'badge-day');
    this.setText('cycle-badge', night ? 'NIGHT' : 'DAY');

    // Dimension badge: the day/night chip means nothing under a dead sky, so
    // the Ossuary borrows a marker of its own while the buffers are swapped.
    const dimBadge = this.hudEl('dimension-badge');
    if (dimBadge) {
      const inSpecialDimension = this.world.isInSpace() || this.world.isInOcean();
      const shown = inSpecialDimension ? 'dimension-badge' : 'dimension-badge hidden';
      if (dimBadge.className !== shown) dimBadge.className = shown;
      if (inSpecialDimension) dimBadge.textContent = this.world.isInOcean() ? '🌊 THE ABYSSAL PLANET' : '🌌 THE OSSUARY';
    }

    // Weather badge
    const weatherBadge = this.hudEl('weather-badge');
    if (weatherBadge) {
      const w = this.weather;
      if (w && w.intensity > 0.25 && w.label) {
        const cls = {
          rain: 'weather-rain',
          storm: 'weather-storm',
          blizzard: 'weather-blizzard',
          sandstorm: 'weather-sand',
          'swamp fog': 'weather-fog'
        }[w.label.toLowerCase()] || 'weather-rain';
        const label = w.iconFor(w.type) + ' ' + w.label.toUpperCase();
        if (weatherBadge.textContent !== label) weatherBadge.textContent = label;
        const full = 'weather-badge ' + cls;
        if (weatherBadge.className !== full) weatherBadge.className = full;
      } else if (weatherBadge.className !== 'weather-badge hidden') {
        weatherBadge.className = 'weather-badge hidden';
      }
    }

    // Health, Mana, Stamina, Hunger — bars and readouts only rewrite on change.
    const p = this.player;
    const hp = Math.max(0, Math.floor(p.hp));
    this.setWidth('hp-bar', Math.max(0, (p.hp / p.maxHp) * 100));
    this.setText('hp-text', `${hp} / ${p.maxHp}`);

    // Armour readout: the equipped plate's damage reduction, so the tier
    // you're actually wearing is visible without hovering a tooltip.
    const armorChip = this.hudEl('armor-chip');
    if (armorChip) {
      const pct = Math.round((p.armorReduction || 0) * 100);
      if (pct > 0) {
        this.setText('armor-chip-text', `${pct}%`);
        const flat = Math.round(p.armorDefense || 0);
        const label = flat > 0 ? `🛡️ ${pct}% · +${flat} DEF` : `🛡️ ${pct}%`;
        if (armorChip.textContent !== label) armorChip.textContent = label;
        armorChip.classList.remove('hidden');
      } else if (!armorChip.classList.contains('hidden')) {
        armorChip.classList.add('hidden');
      }
    }

    // Wings chip: the flight tank is the only resource the accessory spends,
    // so "can I still climb?" has to be answerable without opening the bag —
    // and so does "how long until I can?", which is the cooldown half.
    const wingsChip = this.hudEl('wings-chip');
    if (wingsChip) {
      if (p.hasWings) {
        let label;
        if (p.flightCooldown > 0) {
          label = `🪽 RECHARGE ${Math.ceil(p.flightCooldown)}s`;
        } else {
          const pct = Math.max(0, Math.round((p.flightFuel / Math.max(0.1, p.maxFlightFuel)) * 100));
          const secs = Math.ceil(p.flightFuel);
          label = p.isFlying ? `🪽 FLAPPING ${pct}% · ${secs}s` : `🪽 ${pct}% · ${secs}s`;
        }
        if (wingsChip.textContent !== label) wingsChip.textContent = label;
        wingsChip.classList.remove('hidden');
      } else if (!wingsChip.classList.contains('hidden')) {
        wingsChip.classList.add('hidden');
      }
    }

    const mana = Math.max(0, Math.floor(p.mana));
    this.setWidth('mana-bar', Math.max(0, (p.mana / p.maxMana) * 100));
    this.setText('mana-text', `${mana} / ${p.maxMana}`);

    const stam = Math.max(0, Math.floor(p.stamina));
    this.setWidth('stamina-bar', Math.max(0, (p.stamina / p.maxStamina) * 100));
    this.setText('stamina-text', `${stam} / ${p.maxStamina}`);

    const hunger = Math.max(0, Math.floor(p.hunger));
    this.setWidth('hunger-bar', Math.max(0, (p.hunger / p.maxHunger) * 100));
    this.setText('hunger-text', `${hunger} / ${p.maxHunger}`);

    // ---- Terraria-style heart pips (1 heart = 20 life) ----
    this.renderLifeHearts();
    // ---- Terraria-style mana stars (1 star = 20 mana) ----
    this.renderManaStars();
    // ---- Buff / debuff rack, exactly like Terraria's top-right icon row ----
    this.buffs.renderHUD(document);
    this.journey?.renderHUD();
  }

  /** One heart per 20 max life, full or empty — Terraria's HUD idiom. */
  renderLifeHearts() {
    const wrap = document.getElementById('hp-hearts');
    if (!wrap) return;
    const total = Math.max(1, Math.ceil(this.player.maxHp / 20));
    const filled = Math.ceil(Math.max(0, this.player.hp) / 20);
    if (this._heartTotal === total && this._heartFilled === filled) return;
    this._heartTotal = total;
    this._heartFilled = filled;
    let html = '';
    for (let i = 0; i < total; i++) {
      html += i < filled ? '<span class="heart full">❤</span>' : '<span class="heart empty">❤</span>';
    }
    wrap.innerHTML = html;
  }

  /** Mana is shown as blue stars, one per 20 mana. */
  renderManaStars() {
    const wrap = document.getElementById('mana-stars');
    if (!wrap) return;
    const total = Math.max(1, Math.ceil(this.player.maxMana / 20));
    const filled = Math.ceil(Math.max(0, this.player.mana) / 20);
    if (this._starTotal === total && this._starFilled === filled) return;
    this._starTotal = total;
    this._starFilled = filled;
    let html = '';
    for (let i = 0; i < total; i++) {
      html += i < filled ? '<span class="star full">✦</span>' : '<span class="star empty">✦</span>';
    }
    wrap.innerHTML = html;
  }

  /**
   * Draw the cast line: rod tip -> bobber, with calm ripples while waiting and
   * urgent gold rings once something is biting.
   */
  renderFishingLine(ctx) {
    const f = this.fishing;
    if (!f || !f.active) return;
    const cam = this.camera;
    const tipX = this.player.x + this.player.width / 2 + this.player.facing * 10 - cam.x;
    const tipY = this.player.y + 8 - cam.y;
    const bobX = f.bobX - cam.x;
    const bobY = f.bobY - cam.y + Math.sin(this.stats.playTime * 4) * 1.5;

    ctx.save();
    // A slack curve reads as a line under tension far better than a straight one.
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo((tipX + bobX) / 2, Math.min(tipY, bobY) - 14, bobX, bobY);
    ctx.stroke();

    // Bobber: red cap over a white body, like a real float.
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bobX - 2, bobY - 2, 4, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bobX - 2, bobY - 3, 4, 2);

    const hooked = f.hooked;
    const t = this.stats.playTime;
    ctx.strokeStyle = hooked ? 'rgba(253, 224, 71, 0.85)' : 'rgba(186, 230, 253, 0.5)';
    ctx.lineWidth = hooked ? 2 : 1;
    const rings = hooked ? 2 : 1;
    for (let i = 0; i < rings; i++) {
      const phase = (t * (hooked ? 2.2 : 0.9) + i * 0.5) % 1;
      ctx.globalAlpha = 1 - phase;
      ctx.beginPath();
      ctx.ellipse(bobX, bobY + 2, 4 + phase * (hooked ? 18 : 9), 2 + phase * (hooked ? 7 : 4), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  render() {
    // Everything world-space is drawn into the low-res buffer, then upscaled below.
    const ctx = this.pixelCtx;
    const vw = this.camera.viewportWidth;
    const vh = this.camera.viewportHeight;
    const internalScale = this.internalScale || this.renderScale || 1;

    // Keep the camera in full world units while scaling the raster surface. This
    // preserves the exact same visible area and mouse coordinates in every mode.
    ctx.setTransform(internalScale, 0, 0, internalScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, vw, vh);
    this.lightCtx.setTransform(internalScale, 0, 0, internalScale, 0, 0);
    this.lightCtx.imageSmoothingEnabled = false;
    if (this.glowCtx) {
      this.glowCtx.setTransform(internalScale, 0, 0, internalScale, 0, 0);
      this.glowCtx.imageSmoothingEnabled = false;
    }

    // Screen shake is applied to the camera for a single frame, so tiles,
    // lighting, bloom and weather all shake together and stay perfectly aligned.
    const shake = this.feel.offset();
    const shakeX = shake.x;
    const shakeY = shake.y;
    this.camera.x += shakeX;
    this.camera.y += shakeY;

    // Keep world-space drawing in viewport coordinates even when the internal
    // canvas is rendered at reduced resolution. Resetting to identity here
    // clipped half the scene into the smaller buffer and looked like zoom.
    ctx.setTransform(internalScale, 0, 0, internalScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, vw, vh);

    // 1. Terraria Parallax Forest Background & Sun/Moon
    // The Ossuary paints its own sky: the forest backdrop's cache key has no
    // notion of dimension, so sharing it once let stale daylight show up in
    // deep space after a return trip.
    if (this.world.isInSpace()) this.world.renderSpaceBackground(ctx, this.camera);
    else if (this.world.isInOcean()) this.world.renderOceanBackground(ctx, this.camera);
    else if (this.world.isReefAtX((this.camera.x + this.camera.viewportWidth / 2) / TILE_SIZE)) {
      this.world.renderOceanBackground(ctx, this.camera);
    } else this.world.renderForestBackground(ctx, this.camera);

    // 2. World Solid & Wall Tiles
    this.world.renderTiles(ctx, this.camera);

    // 2b. Ambient weather layer (rain / snow / sand / fog) sits behind entities
    // (there is no weather in the Ossuary — it is a vacuum.)
    if (this.weather && !this.world.isInSpace() && !this.world.isInOcean()) this.weather.render(this, ctx, this.camera, 'back');

    for (const fish of this.reefFish) fish.render(ctx, this.camera);

    // 3. Drop Items
    for (const d of this.drops) {
      d.render(ctx, this.camera);
    }

    // 4. Friendly wildlife
    for (const critter of this.critters) {
      critter.render(ctx, this.camera);
    }
    if (this.cerberus) this.cerberus.render(ctx, this.camera);
    // 4b. Quest-giving villagers
    if (this.npcs && !this.world.isInSpace() && !this.world.isInOcean()) this.npcs.render(ctx, this.camera);

    // 5. Monsters
    for (const m of this.monsters) {
      m.render(ctx, this.camera);
    }

    // 6. Boss — the Sovereign paints its telegraph rings on the arena floor
    // first, so they read as "where not to stand" instead of covering the body.
    if (this.boss && !this.boss.dead) {
      if (typeof this.boss.renderTelegraph === 'function') this.boss.renderTelegraph(ctx, this.camera);
      this.boss.render(ctx, this.camera);
    }

    // 7. Player & Held Item
    const held = this.inventory[this.player.selectedSlot];
    // While a rift is swallowing them the wormhole owns the player transform:
    // it tracks a shrinking scale and a spin rate, and the sprite spiralling
    // down to nothing is what sells the crossing. Outside a rift this is the
    // plain, untransformed draw the whole game depends on.
    const fx = this.wormhole;
    if (fx && fx.phase !== 'open') {
      const px = this.player.x + this.player.width / 2 - this.camera.x;
      const py = this.player.y + this.player.height / 2 - this.camera.y;
      const scale = Math.max(0.02, Math.min(1, fx.playerScale));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(fx.playerSpin) * 0.9 * (1 - scale));
      ctx.scale(scale, scale);
      ctx.translate(-px, -py);
      this.player.render(ctx, this.camera, held, this.player.activeArmor);
      ctx.restore();
    } else {
      this.player.render(ctx, this.camera, held, this.player.activeArmor);
    }

    // 8. Remote players — every other character in the session, each with a
    // name plate and health bar (multiplayer.js renderPlayers).
    this.mp?.renderPlayers(ctx, this.camera);

    // 8. Projectiles
    for (const p of this.projectiles) {
      p.render(ctx, this.camera);
    }

    // 8b. Fishing line — drawn in world space so it stays attached to the
    // rod tip and the bobber while the camera moves.
    this.renderFishingLine(ctx);

    // 8c. A tearing wormhole is the frontmost thing in the world buffer: it is
    // swallowing the player, so nothing may draw over the mouth.
    if (this.wormhole) this.wormhole.render(ctx, this.camera);

    // 9. Particles, Slashes & Combat Damage Texts
    this.particles.render(ctx, this.camera);

    // 9b. The Sovereign's death show draws over the debris so the shockwaves
    // and the soul pillar read against it.
    if (this.dragonFinale) this.dragonFinale.render(ctx, this.camera);

    // 9c. Touch aim reticle. Without a visible cursor a thumb player has no
    // idea where the next tap will land, which is what made placement feel
    // random. Drawn in world space so it sits exactly on the target tile.
    if (this.platform === 'touch' && !this.paused && !this.titleScreenOpen &&
        !this.isDead && !this.isModalOpen()) {
      this.renderTouchReticle(ctx);
    }

    // 10. Foreground weather (close-up rain streaks + lightning flash)
    if (this.weather && !this.world.isInSpace() && !this.world.isInOcean()) this.weather.render(this, ctx, this.camera, 'front');

    // 11. Multiply Dynamic Lighting Pass
    // Reused scratch array — building a fresh one every frame was needless
    // garbage churn 60 times a second.
    const lit = this._litScratch || (this._litScratch = []);
    lit.length = 0;
    for (const m of this.monsters) lit.push(m);
    for (const p of this.projectiles) lit.push(p);
    // Guests carry a small light so a friend in a cave is never a silhouette.
    this.mp?.pushLit(lit);
    if (this.boss && !this.boss.dead) lit.push(this.boss);
    if (this.dragonFinale) lit.push(this.dragonFinale);
    this.world.renderLighting(this.lightCtx, this.camera, this.player, lit);

    // 12. Additive bloom pass — light that actually glows
    if (this.glowCtx) {
      if (this.glowScale > 0) {
        const glows = this._glowScratch || (this._glowScratch = []);
        glows.length = 0;
        for (const p of this.projectiles) glows.push(p);
        if (this.boss && !this.boss.dead) glows.push(this.boss);
        if (this.dragonFinale) glows.push(this.dragonFinale);
        this.world.renderGlow(this.glowCtx, this.camera, this.player, glows);
      } else {
        this.glowCtx.setTransform(this.internalScale || 1, 0, 0, this.internalScale || 1, 0, 0);
        this.glowCtx.clearRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);
      }
    }

    // 13. Composite the internal pixel buffer to the complete visible canvas.
    // This is intentionally NOT multiplied by renderScale: doing that was the
    // regression that made Low quality appear as a small top-left image.
    const out = this.ctx;
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.imageSmoothingEnabled = false;
    out.clearRect(0, 0, this.canvas.width, this.canvas.height);
    out.drawImage(this.pixelCanvas, 0, 0, this.pixelCanvas.width, this.pixelCanvas.height,
      0, 0, this.canvas.width, this.canvas.height);
    // The wormhole owns the whole screen while it is tearing: this layer is
    // drawn on the OUTPUT canvas (not the pixel buffer) so the violet pressure
    // tint and the white-out that hides the dimension swap stay crisp whatever
    // the render scale happens to be.
    if (this.wormhole) this.wormhole.renderScreenOverlay(out, this.canvas.width, this.canvas.height);
    // The Sovereign's white-out rides the same unscaled output layer.
    if (this.dragonFinale) this.dragonFinale.renderScreenOverlay(out, this.canvas.width, this.canvas.height);
    if (this.showFps) this.renderFpsBadge();
  }

  /**
   * Pull the render resolution down (or back up) to protect the frame rate.
   *
   * Dropping to half resolution is what makes this game smooth on a weak
   * laptop: the lighting and bloom passes are fill-rate bound, so halving the
   * pixel count roughly quadruples the headroom. It also reads as a deliberate
   * chunky pixel look rather than a downgrade, and one keypress flips it back.
   *
   * @param dt   seconds of *work* for the frame just finished (update+render)
   * @param rdt  seconds between rAF callbacks — the real frame interval
   */
  applyQuality(dt, rdt) {
    if (dt > 0 && dt < 0.25) {
      // Smooth over ~40 frames so a single hitch never trips the controller.
      this.quality.avgMs += (dt * 1000 - this.quality.avgMs) * 0.025;
    }

    // ---- FPS readout ----
    // This has to be driven by the rAF interval, NOT by the frame's work time.
    // A 60Hz game rendering in 3ms was previously reported as "333 FPS", which
    // is the number the user rightly called inaccurate. Clamped so a tab that
    // was backgrounded and wakes up (rdt of several seconds) cannot skew it.
    if (rdt > 0.0005 && rdt < 0.5) {
      this._fpsCount += 1;
      this._fpsAccum += rdt;
      this._fpsPeak = Math.max(this._fpsPeak || 0, rdt);
      if (this._fpsAccum >= 0.5) {
        this.fps = Math.round(this._fpsCount / this._fpsAccum);
        // Worst frame in the window, in ms — this is what tells you whether a
        // hitch was you or the machine, which an average alone hides.
        this.worstFrameMs = this._fpsPeak * 1000;
        this._fpsCount = 0;
        this._fpsAccum = 0;
        this._fpsPeak = 0;
        if (this.showFps) this.renderFpsBadge();
      }
    }

    if (!this.autoQuality) return;

    // Particle load is tied to the same decision, so a low-spec machine gets
    // the two heaviest things under control in one go. Weather and the boss
    // summons read this when they spawn their particle bursts.
    this.particleScale = this.effectScale() * (this.quality.lowQuality ? 0.5 : 1);
    this.particles?.setDensity(this.particleScale);

    if (!this.quality.lowQuality) {
      if (this.quality.avgMs > this.quality.budgetMs) {
        this.quality.lowQuality = true;
        this.quality.goodFrames = 0;
        this.renderScale = 0.5;
        this.applyGlowMode(false);
        this.resize();
        this.showToast('⚡ Low spec detected — dropped to half resolution and reduced glow. [F] toggles.');
      }
    } else if (this.quality.avgMs < 13.5) {
      // Only restore after a solid run of fast frames, so the game cannot
      // oscillate between resolutions every other second.
      this.quality.goodFrames += 1;
      if (this.quality.goodFrames >= 300) {
        this.quality.lowQuality = false;
        this.quality.goodFrames = 0;
        this.renderScale = 1;
        this.resize();
        this.showToast('✨ Back to full resolution.');
      }
    } else {
      this.quality.goodFrames = 0;
    }
  }

  /** Small FPS readout, borrowed structurally from the toast container. */
  renderFpsBadge() {
    let el = this._fpsBadge;
    if (!el) {
      el = document.createElement('div');
      el.className = 'fps-badge';
      const layer = document.getElementById('ui-layer');
      if (!layer) return;
      layer.appendChild(el);
      this._fpsBadge = el;
    }
    el.textContent = `${this.fps} FPS · ${Math.round(this.quality.avgMs * 10) / 10}ms · ` +
      `${Math.round((this.renderScale || 1) * 100)}% RES · ${this.particles.particles.length} FX`;
  }

  loop(currentTime) {
    // Guard against a non-finite or repeated timestamp (some browsers hand back
    // the same value twice, which would otherwise spike the FPS average).
    const rawDelta = (currentTime - this.lastTime) / 1000;
    const rdt = Number.isFinite(rawDelta) && rawDelta > 0 ? Math.min(1, rawDelta) : 0;
    this.lastTime = currentTime;

    // Recompute the pad's visibility before anything can read it: pausing,
    // dying, opening a modal or walking into the world all change the answer,
    // and doing it in one place means it cannot drift out of step.
    this.refreshTouchControls();

    // ---- Fixed-timestep simulation -------------------------------------
    // Every movement constant in this game (gravity 0.38, speed 4.2, accel 0.6,
    // terminal velocity 12) is written as a PER-FRAME amount, tuned when the
    // loop ran at ~60Hz. The loop used to call update(realDt) once per rAF, so
    // a 144Hz monitor integrated the physics 2.4x more often per second than a
    // 60Hz one: everything moved, fell and attacked that much faster. The fix
    // is to run the simulation on a fixed 1/60s clock regardless of how often
    // rAF fires, so those old constants keep their intended meaning. Any time
    // already spent past the fixed step is carried in _stepAccum; a slow frame
    // catches up with a few extra steps, a fast one runs none. The catch-up is
    // capped (maxCatchUpSteps) so a long stall - a backgrounded tab, a GC
    // pause - cannot spiral into hundreds of steps and lock the page.
    const FIXED_DT = 1 / 60;
    const maxCatchUpSteps = 5;
    if (!Number.isFinite(this._stepAccum)) this._stepAccum = 0;
    // Only the guard band is needed here; rdt is already clamped to 1s, and the
    // 0.1s per-frame ceiling keeps a hiccup from being replayed as a lurch.
    this._stepAccum += Math.min(0.1, rdt);

    const workStart = performance.now();
    let steps = 0;
    while (this._stepAccum >= FIXED_DT && steps < maxCatchUpSteps) {
      this.update(FIXED_DT);
      this._stepAccum -= FIXED_DT;
      steps += 1;
    }
    // Dropped time (more than maxCatchUpSteps worth) is discarded rather than
    // queued, so the game slows under extreme load instead of teleporting.
    if (this._stepAccum > FIXED_DT * maxCatchUpSteps) this._stepAccum = 0;

    // Nothing to simulate this frame (very high refresh rate, e.g. 240Hz):
    // still paint, and still feed the quality/FPS controller the real interval.
    this.render();
    const work = (performance.now() - workStart) / 1000;

    // Presented only once the whole update/render pair is done, so the quality
    // controller measures real work rather than rAF's own clamped timing.
    requestAnimationFrame((nextTime) => this.loop(nextTime));
    this.applyQuality(work, rdt);
  }
}

window.ITEMS = ITEMS;
window.RECIPES = RECIPES;
window.UNCRAFTABLE_RECIPE_IDS = UNCRAFTABLE_RECIPE_IDS;
window.Game = Game;

// Boot game on load or immediately if already loaded
// Self-exposing is essential: this script sits at the end of <body>, before
// DOMContentLoaded fires, so the listener branch below would register a callback
// that never runs and leave window.game undefined forever.
function bootTerracraft() {
  try {
    window.game = new Game();
  } catch (error) {
    console.error('Terracraft failed to start:', error);
    window.game = null;
    try {
      if (typeof window.__terraShowBootError === 'function') {
        window.__terraShowBootError((error && error.stack) || (error && error.message) || String(error));
      }
    } catch (_) {}
    throw error;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootTerracraft);
} else {
  bootTerracraft();
}
