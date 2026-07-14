/**
 * Static Data and Presets for Promontoire de Résonance Alpine
 */

import { Mountain, Preset } from './types';

export const MOUNTAINS: Mountain[] = [
  {
    id: 'jungfrau',
    name: 'La Jungfrau',
    xPercent: 12,
    yPercent: 42,
    frequency: 440, // A4 (pure crystal resonance)
    harmonics: [1.0, 2.0, 3.0],
    color: '#38bdf8', // sky blue
    type: 'pure-sine',
    description: 'La cime blanche immaculée, symbole de pureté acoustique absolue et de résonance cristalline.'
  },
  {
    id: 'matterhorn',
    name: 'Le Cervin',
    xPercent: 28,
    yPercent: 26,
    frequency: 220, // A3 (deep, warm, breathing)
    harmonics: [1.0, 1.5, 2.0, 2.5],
    color: '#e2e8f0', // slate light
    type: 'alphorn',
    description: 'La majestueuse pyramide de pierre, résonnant du souffle de bois profond des cor d\'alpes.'
  },
  {
    id: 'montblanc',
    name: 'Le Mont Blanc',
    xPercent: 52,
    yPercent: 14,
    frequency: 261.63, // C4 (epic, airy wind center)
    harmonics: [1.0, 2.0, 4.0],
    color: '#ffffff', // pure white
    type: 'noise-wind',
    description: 'Le dôme souverain des Alpes, où les échos glaciaires se mélangent aux sifflements des vents.'
  },
  {
    id: 'eiger',
    name: 'L\'Eiger',
    xPercent: 74,
    yPercent: 32,
    frequency: 329.63, // E4 (crisp bell, bold face)
    harmonics: [1.0, 1.33, 1.66, 2.0],
    color: '#94a3b8', // rock slate
    type: 'chime',
    description: 'La terrible face nord abrupte, renvoyant un tintement métallique clair d\'airain et d\'étain.'
  },
  {
    id: 'monterosa',
    name: 'Le Mont Rose',
    xPercent: 90,
    yPercent: 20,
    frequency: 392, // G4 (shimmering pentatonic chime)
    harmonics: [1.0, 1.25, 1.75, 2.25],
    color: '#fda4af', // rose pink
    type: 'crystal-bell',
    description: 'Le massif étincelant aux reflets de quartz rose, vibrant de carillons cristallins célestes.'
  }
];

export const PRESETS: Preset[] = [
  {
    id: 'misty-morning',
    name: 'Matin de Brume',
    description: 'Une brume de coton enveloppe la vallée d\'un calme d\'or. Les échos y glissent avec une infinie douceur.',
    iconName: 'CloudFog',
    settings: {
      altitude: 35,
      valleyWidth: 30,
      rockDensity: 40,
      windVelocity: 15,
      harmonyMode: 'quartz',
      backgroundWind: true,
      backgroundBells: true,
      backgroundStream: true
    }
  },
  {
    id: 'summit-storm',
    name: 'Tempête des Cimes',
    description: 'Le vent hurle sur les parois de granite. Une résonance sombre, grave et grandiose emporte la vallée.',
    iconName: 'Wind',
    settings: {
      altitude: 85,
      valleyWidth: 75,
      rockDensity: 80,
      windVelocity: 85,
      harmonyMode: 'drone',
      backgroundWind: true,
      backgroundBells: false,
      backgroundStream: false
    }
  },
  {
    id: 'echo-twilight',
    name: 'Crépuscule d\'Écho',
    description: 'Le soleil décline derrière les aiguilles rocheuses. Les échos de quartz s\'étirent à l\'infini dans le silence suspendu.',
    iconName: 'Sunset',
    settings: {
      altitude: 60,
      valleyWidth: 95,
      rockDensity: 85,
      windVelocity: 20,
      harmonyMode: 'solfeggio',
      backgroundWind: true,
      backgroundBells: true,
      backgroundStream: true
    }
  },
  {
    id: 'secret-valley',
    name: 'Vallée Secrète',
    description: 'L\'eau vive des torrents et les cloches des pâturages s\'accordent en harmonie avec le murmure éternel des sapins.',
    iconName: 'Compass',
    settings: {
      altitude: 45,
      valleyWidth: 55,
      rockDensity: 55,
      windVelocity: 35,
      harmonyMode: 'pentatonic',
      backgroundWind: true,
      backgroundBells: true,
      backgroundStream: true
    }
  }
];
