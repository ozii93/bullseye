import { Dimensions, Platform, PixelRatio, Appearance } from 'react-native';
const { width, height } = Dimensions.get('window');

export const Normalize = size => {
  const scale = width / 320;
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

export const Resize = size => {
  const newSize = width / size;

  return Math.round(newSize);
};

const colorScheme = Appearance.getColorScheme();
export const COLORS = {
  // base colors
  primary: '#EF5350',
  secondary: '#3087d8',
  tertiary: '#2b384b',
  background: '#10182b',

  white: '#FFFFFF',
  black: '#000000',
  blackLighten: '#181818',
  blackLighten2: '#070707',
  accentBlackLighten: '#4d4d4d',
  accentBlackLighten2: '#262626',

  Red: '#FF0203',
  lightRed: '#D50000',
  darkRed: '#E40014',
  accentRed: '#FF3F00',

  Pink: '#E91E63',
  lightPink: '#EC407A',
  darkPink: '#880E4F',
  accentPink: '#C51162',

  Purple: '#9C27B0',
  lightPurple: '#AB47BC',
  darkPurple: '#4A148C',
  accentPurple: '#AA00FF',

  Indigo: '#3F51B5',
  lightIndigo: '#5C6BC0',
  darkIndigo: '#1A237E',
  accentIndigo: '#304FFE',

  Blue: '#2196F3',
  lightBlue: '#42A5F5',
  darkBlue: '#0D47A1',
  accentBlue: '#2962FF',

  Cyan: '#00BCD4',
  lightCyan: '#26C6DA',
  darkCyan: '#006064',
  accentCyan: '#00B8D4',

  Teal: '#009688',
  lightTeal: '#26A69A',
  darkTeal: '#004D40',
  accentTeal: '#00BFA5',

  Green: '#4CAF50',
  lightGreen: '#66BB6A',
  darkGreen: '#1B5E20',
  accentGreen: '#00C853',

  Lime: '#CDDC39',
  lightLime: '#D4E157',
  darkLime: '#827717',
  accentLime: '#AEEA00',

  Yellow: '#FFEB3B',
  lightYellow: '#FFEE58',
  darkYellow: '#F57F17',
  accentYellow: '#FFD600',

  Amber: '#FFC107',
  lightAmber: '#FFCA28',
  darkAmber: '#FF6F00',
  accentAmber: '#FFAB00',

  Orange: '#FF9800',
  lightOrange: '#FFA726',
  darkOrange: '#E65100',
  accentOrange: '#FF6D00',

  Grey: '#9E9E9E',
  accentGrey: '#c8c8c8ff',
  lightGrey: '#EAEAEA',
  darkGrey: '#212121',

  baseColor: '#FA0670',
  secondaryColor: '#F7941D',

  transparent: 'transparent',
  light: colorScheme == 'light' ? '#212121' : '#EAEAEA',
  dark: colorScheme == 'light' ? '#EAEAEA' : '#212121',
};

export const EVACOLOR = {
  colors: {
    primary: {
      100: '#F2F6FF',
      200: '#D9E4FF',
      300: '#A6C1FF',
      400: '#598BFF',
      500: '#3366FF',
      600: '#274BDB',
      700: '#1A34B8',
      800: '#102694',
      900: '#091C7A',
      transparent: {
        100: 'rgba(51, 102, 255, 0.08)',
        200: 'rgba(51, 102, 255, 0.16)',
        300: 'rgba(51, 102, 255, 0.24)',
        400: 'rgba(51, 102, 255, 0.32)',
        500: 'rgba(51, 102, 255, 0.40)',
        600: 'rgba(51, 102, 255, 0.48)',
      },
    },
    success: {
      100: '#EDFFF3',
      200: '#B3FFD6',
      300: '#8CFAC7',
      400: '#51F0B0',
      500: '#00E096',
      600: '#00B383',
      700: '#008F72',
      800: '#007566',
      900: '#00524C',
      transparent: {
        100: 'rgba(0, 224, 150, 0.08)',
        200: 'rgba(0, 224, 150, 0.16)',
        300: 'rgba(0, 224, 150, 0.24)',
        400: 'rgba(0, 224, 150, 0.32)',
        500: 'rgba(0, 224, 150, 0.40)',
        600: 'rgba(0, 224, 150, 0.48)',
      },
    },
    info: {
      100: '#F2F8FF',
      200: '#C7E2FF',
      300: '#94CBFF',
      400: '#42AAFF',
      500: '#0095FF',
      600: '#006FD6',
      700: '#0057C2',
      800: '#0041A8',
      900: '#002885',
      transparent: {
        100: 'rgba(0, 149, 255, 0.08)',
        200: 'rgba(0, 149, 255, 0.16)',
        300: 'rgba(0, 149, 255, 0.24)',
        400: 'rgba(0, 149, 255, 0.32)',
        500: 'rgba(0, 149, 255, 0.40)',
        600: 'rgba(0, 149, 255, 0.48)',
      },
    },
    warning: {
      100: '#FFFDF2',
      200: '#FFF1C2',
      300: '#FFE59E',
      400: '#FFC94D',
      500: '#FFAA00',
      600: '#DB8B00',
      700: '#B86E00',
      800: '#945400',
      900: '#703C00',
      transparent: {
        100: 'rgba(255, 170, 0, 0.08)',
        200: 'rgba(255, 170, 0, 0.16)',
        300: 'rgba(255, 170, 0, 0.24)',
        400: 'rgba(255, 170, 0, 0.32)',
        500: 'rgba(255, 170, 0, 0.40)',
        600: 'rgba(255, 170, 0, 0.48)',
      },
    },
    danger: {
      100: '#FFF2F2',
      200: '#FFD6D9',
      300: '#FFA8B4',
      400: '#FF708D',
      500: '#FF3D71',
      600: '#DB2C66',
      700: '#B81D5B',
      800: '#94124E',
      900: '#700940',
      transparent: {
        100: 'rgba(255, 61, 113, 0.08)',
        200: 'rgba(255, 61, 113, 0.16)',
        300: 'rgba(255, 61, 113, 0.24)',
        400: 'rgba(255, 61, 113, 0.32)',
        500: 'rgba(255, 61, 113, 0.40)',
        600: 'rgba(255, 61, 113, 0.48)',
      },
    },
    basic: {
      100: '#FFFFFF',
      200: '#F7F9FC',
      300: '#EDF1F7',
      400: '#E4E9F2',
      500: '#C5CEE0',
      600: '#8F9BB3',
      700: '#2E3A59',
      800: '#222B45',
      900: '#1A2138',
      1000: '#151A30',
      1100: '#101426',
      transparent: {
        100: 'rgba(143, 155, 179, 0.08)',
        200: 'rgba(143, 155, 179, 0.16)',
        300: 'rgba(143, 155, 179, 0.24)',
        400: 'rgba(143, 155, 179, 0.32)',
        500: 'rgba(143, 155, 179, 0.40)',
        600: 'rgba(143, 155, 179, 0.48)',
      },
    },
  },
  background: {
    basic: {
      1: '#FFFFFF',
      2: '#F7F9FC',
      3: '#EDF1F7',
      4: '#E4E9F2',
    },
    alternative: {
      1: '#222B45',
      2: '#1A2138',
      3: '#151A30',
      4: '#101426',
    },
  },
  border: {
    basic: {
      1: '#FFFFFF',
      2: '#F7F9FC',
      3: '#EDF1F7',
      4: '#E4E9F2',
      5: '#C5CEE0',
    },
    alternative: {
      1: '#222B45',
    },
  },
};

export const SIZES = {
  // global sizes
  base: Resize(60),
  font: Resize(34),
  radius: Resize(16),
  padding: Resize(48),
  padding2: Resize(40),
  padding3: Resize(30),
  padding4: Resize(24),
  padding5: Resize(20),

  // font sizes
  largeTitle: 50,
  h1: 30,
  h2: 22,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  h7: 12,
  body1: 30,
  body2: 20,
  body3: 16,
  body4: 14,
  body5: 12,
  body6: 10,

  // SIZING
  large: Normalize(50),
  medium: Normalize(35),
  small: Normalize(20),

  // app dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: {
    fontFamily: 'Poppins-regular',
    fontSize: SIZES.largeTitle,
    lineHeight: Normalize(55),
  },
  h1: {
    fontFamily: 'Poppins-Black',
    fontSize: SIZES.h1,
    lineHeight: Normalize(36),
  },
  h2: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h2,
    lineHeight: Normalize(30),
  },
  h3: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h3,
    lineHeight: Normalize(22),
  },
  h4: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h4,
    lineHeight: Normalize(22),
  },
  h5: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h5,
    lineHeight: Normalize(22),
  },
  h6: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h6,
    lineHeight: Normalize(22),
  },
  h7: {
    fontFamily: 'Poppins-Bold',
    fontSize: SIZES.h7,
    lineHeight: Normalize(22),
  },
  body1: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body1,
    lineHeight: Normalize(36),
  },
  body2: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body2,
    lineHeight: Normalize(30),
  },
  body3: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body3,
    lineHeight: Normalize(22),
  },
  body4: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body4,
    lineHeight: Normalize(22),
  },
  body5: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body5,
    lineHeight: Normalize(22),
  },
  body6: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body6,
    lineHeight: Normalize(22),
  },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
