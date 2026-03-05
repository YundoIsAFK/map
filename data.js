// data.js
// Cleaned version: same TILES shape + same tiles + same paths, but less repetition.

const TILE_PRESETS = {
  // Common terrain presets
  IMPASSABLE: {
    buildable: false,
    passable: false,
    cost: 0,
    points: 0,
    defense_modifier: 0,
    attack_modifier: 0
  },

  // Resource tiles (Mine/Library/Village) share these stats across themes in your original.
  RESOURCE_COMMON: {
    buildable: false,
    passable: true,
    cost: 45,
    points: 1,
    defense_modifier: 1.3, // These might be wrong
    attack_modifier: 0.7   // These might be wrong
  }
};

function makeTile({
  name,
  color,
  src,
  buildable,
  passable,
  cost,
  points,
  defense_modifier,
  attack_modifier
}) {
  return {
    name,
    color,
    src,
    buildable,
    passable,
    cost,
    points,
    defense_modifier,
    attack_modifier
  };
}

function makeImpassable({ name, color, src }) {
  return makeTile({ name, color, src, ...TILE_PRESETS.IMPASSABLE });
}

function makeResource({ name, src }) {
  // Your original uses the same color for resource tiles across themes
  return makeTile({
    name,
    color: '#eeeeee',
    src,
    ...TILE_PRESETS.RESOURCE_COMMON
  });
}

const TILES = {
  // Tile type
  standard: {
    // Tile Theme
    grass: [
      makeTile({
        name: 'Grassland',
        color: '#00ad2f',
        src: './img/standard/grass/Grassland.png',
        buildable: true,
        passable: true,
        cost: 25,
        points: 1,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Green Hills',
        color: '#83b92d',
        src: './img/standard/grass/Green_Hills.png',
        buildable: true,
        passable: true,
        cost: 33,
        points: 1,
        defense_modifier: 1.1,
        attack_modifier: 0.9
      }),
      // Impassable
      makeImpassable({
        name: 'Mountains',
        color: '#777777',
        src: './img/standard/grass/Mountains.png'
      }),
      // Unbuildable but passable
      makeTile({
        name: 'Rocky Hills',
        color: '#999999',
        src: './img/standard/grass/Rocky_Hills.png',
        buildable: false,
        passable: true,
        cost: 38,
        points: 1,
        defense_modifier: 0.7,
        attack_modifier: 1.5
      }),
      makeTile({
        name: 'Forest',
        color: '#237007',
        src: './img/standard/grass/Forest.png',
        buildable: true,
        passable: true,
        cost: 45,
        points: 1,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Swamp',
        color: '#377e78',
        src: './img/standard/grass/Swamp.png',
        buildable: true,
        passable: true,
        cost: 50,
        points: 1,
        defense_modifier: 1.0,
        attack_modifier: 1.0
      }),
      // Impassable
      makeImpassable({
        name: 'Water',
        color: '#6495ed',
        src: './img/standard/grass/Water.png'
      })
    ],

    sand: [
      makeTile({
        name: 'Desert',
        color: '#bba484',
        src: './img/standard/sand/Desert.png',
        buildable: true,
        passable: true,
        cost: 26,
        points: 1,
        defense_modifier: 0.5,
        attack_modifier: 0.8
      }),
      makeTile({
        name: 'Green Hills',
        color: '#83b92d',
        src: './img/standard/sand/Green_Hills.png',
        buildable: true,
        passable: true,
        cost: 33,
        points: 1,
        defense_modifier: 1.1,
        attack_modifier: 0.9
      }),
      // Impassable
      makeImpassable({
        name: 'Mountains',
        color: '#777777',
        src: './img/standard/sand/Sandy_Mountains.png'
      }),
      // Unbuildable but passable
      makeTile({
        name: 'Sandy Hills',
        color: '#BB9C87',
        src: './img/standard/sand/Sandy_Hills.png',
        buildable: false,
        passable: true,
        cost: 38,
        points: 1,
        defense_modifier: 0.7,
        attack_modifier: 0.9
      }),
      makeTile({
        name: 'Forest',
        color: '#237007',
        src: './img/standard/sand/Forest.png',
        buildable: true,
        passable: true,
        cost: 45,
        points: 1,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Swamp',
        color: '#377e78',
        src: './img/standard/sand/Swamp.png',
        buildable: true,
        passable: true,
        cost: 50,
        points: 1,
        defense_modifier: 1.0,
        attack_modifier: 1.0
      }),
      // Impassable
      makeImpassable({
        name: 'Water',
        color: '#6495ed',
        src: './img/standard/sand/Water.png'
      })
    ],

    easter: [
      makeTile({
        name: 'Spring Meadows',
        color: '#00ad2f',
        src: './img/standard/easter/Spring_Meadows.png',
        buildable: true,
        passable: true,
        cost: 20,
        points: 1,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Springtime Hills',
        color: '#83b92d',
        src: './img/standard/easter/Springtime_Hills.png',
        buildable: true,
        passable: true,
        cost: 26,
        points: 1,
        defense_modifier: 1.10,
        attack_modifier: 0.9
      }),
      // Impassable
      makeImpassable({
        name: 'Mountains',
        color: '#777777',
        src: './img/standard/easter/Mountains.png'
      }),
      // Unbuildable but passable
      makeTile({
        name: 'Practice Ground',
        color: '#999999',
        src: './img/standard/easter/Practice_Ground.png',
        buildable: false,
        passable: true,
        cost: 30,
        points: 1,
        defense_modifier: 1.5,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Woods of Joy',
        color: '#237007',
        src: './img/standard/easter/Woods_of_Joy.png',
        buildable: true,
        passable: true,
        cost: 45,
        points: 1,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Daffodil Marsh',
        color: '#377e78',
        src: './img/standard/easter/Daffodil_Marsh.png',
        buildable: true,
        passable: true,
        cost: 50,
        points: 1,
        defense_modifier: 1.0,
        attack_modifier: 1.0
      }),
      // Impassable
      makeImpassable({
        name: 'Water',
        color: '#6495ed',
        src: './img/standard/easter/Water.png'
      })
    ],

    halloween: [
      makeTile({
        name: 'Withered Meadow',
        color: '#00ad2f',
        src: './img/standard/halloween/Withered_Meadow.png',
        buildable: true,
        passable: true,
        cost: 25,
        points: 1,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Green Hills',
        color: '#83b92d',
        src: './img/standard/halloween/Green_Hills.png',
        buildable: true,
        passable: true,
        cost: 33,
        points: 1,
        defense_modifier: 1.1,
        attack_modifier: 0.9
      }),
      // Impassable
      makeImpassable({
        name: 'Ghastly Mountain',
        color: '#777777',
        src: './img/standard/halloween/Ghastly_Mountain.png'
      }),
      // Unbuildable but passable
      makeTile({
        name: 'Rocky Hills',
        color: '#999999',
        src: './img/standard/halloween/Rocky_Hills.png',
        buildable: false,
        passable: true,
        cost: 38,
        points: 1,
        defense_modifier: 0.7,
        attack_modifier: 1.5
      }),
      makeTile({
        name: 'Forest of Despair',
        color: '#237007',
        src: './img/standard/halloween/Forest_of_Despair.png',
        buildable: true,
        passable: true,
        cost: 45,
        points: 1,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Swamp of Terror',
        color: '#377e78',
        src: './img/standard/halloween/Swamp_of_Terror.png',
        buildable: true,
        passable: true,
        cost: 63,
        points: 1,
        defense_modifier: 1.0,
        attack_modifier: 1.0
      }),
      // Impassable
      makeImpassable({
        name: 'Piranha Resivour',
        color: '#6495ed',
        src: './img/standard/halloween/Piranha_Resivour.png'
      })
    ],

    winter: [
      makeTile({
        name: 'Icy Meadows',
        color: '#eeeeee',
        src: './img/standard/winter/Icy_Meadows.png',
        buildable: true,
        passable: true,
        cost: 25,
        points: 1,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Snowball Hills',
        color: '#dddddd',
        src: './img/standard/winter/Snowball_Hills.png',
        buildable: true,
        passable: true,
        cost: 33,
        points: 1,
        defense_modifier: 1.1,
        attack_modifier: 0.9
      }),
      // Impassable
      makeImpassable({
        name: 'Mt. Frosty',
        color: '#777777',
        src: './img/standard/winter/Mt._Frosty.png'
      }),
      // Unbuildable but passable
      makeTile({
        name: 'Slippery Slopes',
        color: '#999999',
        src: './img/standard/winter/Slippery_Slopes.png',
        buildable: false,
        passable: true,
        cost: 38,
        points: 1,
        defense_modifier: 0.7,
        attack_modifier: 1.5
      }),
      makeTile({
        name: 'Fir Forest',
        color: '#237007',
        src: './img/standard/winter/Fir_Forest.png',
        buildable: true,
        passable: true,
        cost: 36,
        points: 1,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Frozen Swamp',
        color: '#377e78',
        src: './img/standard/winter/Frozen_Swamp.png',
        buildable: true,
        passable: true,
        cost: 63,
        points: 1,
        defense_modifier: 1.0,
        attack_modifier: 1.0
      }),
      // Impassable
      makeImpassable({
        name: 'Water',
        color: '#6495ed',
        src: './img/standard/winter/Water.png'
      })
    ]
  },

  special: {
    grass: [
      makeTile({
        name: 'Enchanted Windmill',
        color: '#ddeebb',
        src: './img/special/grass/Enchanted_Windmill.png',
        buildable: false,
        passable: true,
        cost: 20,
        points: 5,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Boneyard/Manfred',
        color: '#ddeebb',
        src: './img/special/grass/Boneyard.png',
        buildable: false,
        passable: true,
        cost: 20,
        points: 5,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Mysterious Shrine',
        color: '#eeeeee',
        src: './img/special/grass/Mysterious_Shrine.png',
        buildable: false,
        passable: true,
        cost: 45,
        points: 35,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      makeTile({
        name: 'Yggdrasil',
        color: '#eeeeee',
        src: './img/special/grass/Yggdrasil.png',
        buildable: false,
        passable: true,
        cost: 20,
        points: 35,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      })
    ],

    sand: [
      makeTile({
        name: 'Dragon skull',
        color: '#eeddbb',
        src: './img/special/sand/Dragon_Skull.png',
        buildable: false,
        passable: true,
        cost: 26,
        points: 5,
        defense_modifier: 0.5,
        attack_modifier: 0.8
      })
    ],

    halloween: [
      makeTile({
        name: 'Pal Sematary',
        color: '#999999',
        src: './img/special/halloween/Pal_Sematary.png',
        buildable: false,
        passable: true,
        cost: 38,
        points: 2,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Haunted Windmill',
        color: '#ddeebb',
        src: './img/special/halloween/Haunted_Windmill.png',
        buildable: false,
        passable: true,
        cost: 25,
        points: 5,
        defense_modifier: 0.8,
        attack_modifier: 1.0
      }),
      makeTile({
        name: 'Fields of Misery',
        color: '#eeeeee',
        src: './img/special/halloween/Fields_of_Misery.png',
        buildable: false,
        passable: true,
        cost: 45,
        points: 20,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      })
    ],

    easter: [
      makeTile({
        name: 'Imposing Structure',
        color: '#ddeebb',
        src: './img/special/easter/Imposing_Structure.png',
        buildable: false,
        passable: true,
        cost: 26,
        points: 5,
        defense_modifier: 0.10,
        attack_modifier: 0.9
      }),
      makeTile({
        name: 'Miracle Shrine',
        color: '#eeeeee',
        src: './img/special/easter/Miracle_Shrine.png',
        buildable: false,
        passable: true,
        cost: 36,
        points: 20,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      // These three were in "special" but their src points to ./img/resource/easter/... in your original, so kept exactly.
      makeTile({
        name: 'Egg Mine',
        color: '#eeeeee',
        src: './img/resource/easter/Egg_Mine.png',
        buildable: false,
        passable: true,
        cost: 26,
        points: 5,
        defense_modifier: 1.10, // These might be wrong
        attack_modifier: 0.9   // These might be wrong
      }),
      makeTile({
        name: 'Giant Hare',
        color: '#eeeeee',
        src: './img/resource/easter/Giant_Hare.png',
        buildable: false,
        passable: true,
        cost: 40,
        points: 5,
        defense_modifier: 0.8, // These might be wrong
        attack_modifier: 1.0   // These might be wrong
      }),
      makeTile({
        name: 'Eggsercise Yard',
        color: '#eeeeee',
        src: './img/resource/easter/Eggsercise_Yard.png',
        buildable: false,
        passable: true,
        cost: 20,
        points: 5,
        defense_modifier: 0.8, // These might be wrong
        attack_modifier: 1.0   // These might be wrong
      })
    ],

    winter: [
      makeTile({
        name: 'Wintery Mill',
        color: '#eeeeee',
        src: './img/special/winter/Wintery_Mill.png',
        buildable: false,
        passable: true,
        cost: 10,
        points: 5,
        defense_modifier: 0.8,
        attack_modifier: 1.00
      }),
      makeTile({
        name: 'Manfred',
        color: '#eeeeee',
        src: './img/special/winter/Manfred.png',
        buildable: false,
        passable: true,
        cost: 20,
        points: 5,
        defense_modifier: 0.8,
        attack_modifier: 1.00
      }),
      makeTile({
        name: 'Frostbitten Ruins',
        color: '#eeeeee',
        src: './img/special/winter/Frostbitten_Ruins.png',
        buildable: false,
        passable: true,
        cost: 33,
        points: 10,
        defense_modifier: 0.9,
        attack_modifier: 1.10
      }),
      makeTile({
        name: 'Festive Tree',
        color: '#eeeeee',
        src: './img/special/winter/Festive_Tree.png',
        buildable: false,
        passable: true,
        cost: 36,
        points: 35,
        defense_modifier: 1.3,
        attack_modifier: 0.7
      }),
      // Impassable
      makeImpassable({
        name: 'Ice Floes',
        color: '#999999',
        src: './img/standard/winter/Ice_Floes.png'
      })
    ]
  },

  resource: {
    grass: [
      makeResource({ name: 'Mine', src: './img/resource/grass/Mine.png' }),
      makeResource({ name: 'Library', src: './img/resource/grass/Library.png' }),
      makeResource({ name: 'Remote Village', src: './img/resource/grass/Village.png' })
    ],
    sand: [
      makeResource({ name: 'Mine', src: './img/resource/sand/Mine.png' }),
      makeResource({ name: 'Library', src: './img/resource/sand/Library.png' }),
      makeResource({ name: 'Remote Village', src: './img/resource/sand/Village.png' })
    ],
    halloween: [
      makeResource({ name: 'Mine', src: './img/resource/halloween/Mine.png' }),
      makeResource({ name: 'Library', src: './img/resource/halloween/Library.png' }),
      makeResource({ name: 'Remote Village', src: './img/resource/halloween/Village.png' })
    ],
    easter: [
      makeResource({ name: 'Mine', src: './img/resource/easter/Mine.png' }),
      makeResource({ name: 'Library', src: './img/resource/easter/Library.png' }),
      makeResource({ name: 'Remote Village', src: './img/resource/easter/Village.png' })
    ],
    winter: [
      makeResource({ name: 'Mine', src: './img/resource/winter/Mine.png' }),
      makeResource({ name: 'Library', src: './img/resource/winter/Library.png' }),
      makeResource({ name: 'Remote Village', src: './img/resource/winter/Village.png' })
    ]
  },

  // Should these mock the same format as above?
  blank: [
    makeTile({
      name: 'Unexplored Territory',
      color: '#6f624e',
      src: '',
      ...TILE_PRESETS.IMPASSABLE
    }),
    makeTile({
      name: 'Void Tile',
      color: '#282828',
      src: '',
      ...TILE_PRESETS.IMPASSABLE
    })
  ],

  // Methods?
  getIndex: (theme, set) => {
    // keep behavior but make it safe
    return TILES[theme]?.[set]?.length ?? 0;
  }
};