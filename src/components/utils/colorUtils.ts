// src/utils/colorUtils.ts
import { colord, extend } from 'colord'
import harmonies from 'colord/plugins/harmonies' // 导入colord的harmonies插件

// 扩展colord，使其支持harmonies插件，用于更方便地生成配色方案
extend([harmonies]) // <--- **ENSURE randomPlugin IS INCLUDED HERE**

/**
 * 定义 HSL 颜色类型
 */
export interface HSLColor {
  h: number // 色相 (0-360)
  s: number // 饱和度 (0-100)
  l: number // 亮度 (0-100)
}

interface RGB {
  r: number
  g: number
  b: number
}

/**
 * 将 RGB 颜色字符串 (e.g., "#RRGGBB") 转换为 HSL 对象。
 * @param hexColor Hex 格式的颜色字符串。
 * @returns HSLColor 对象。
 */
export const hexToHsl = (hexColor: string): HSLColor => {
  const { h, s, l } = colord(hexColor).toHsl()
  return { h, s, l }
}

/**
 * 将 HSL 对象转换为 Hex 颜色字符串。
 * @param hsl HSLColor 对象。
 * @returns Hex 格式的颜色字符串。
 */
export const hslToHex = (hsl: HSLColor): string => {
  return colord(hsl).toHex()
}

/**
 * Converts a hex color string to an RGB object.
 * @param hex The hex color string (e.g., "#RRGGBB" or "RRGGBB").
 * @returns An RGB object.
 */
export function hexToRgb (hex: string): RGB {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return { r, g, b }
}

/**
 * Converts an RGB color to an HSL object.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 100].
 * @param r Red value.
 * @param g Green value.
 * @param b Blue value.
 * @returns An HSL object.
 */
export function rgbToHsl (r: number, g: number, b: number): HSLColor {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 * @param h Hue.
 * @param s Saturation.
 * @param l Lightness.
 * @returns An RGB object.
 */
export function hslToRgb (h: number, s: number, l: number): RGB {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * Converts an RGB object to a hex color string.
 * @param r Red value.
 * @param g Green value.
 * @param b Blue value.
 * @returns Hex color string (e.g., "#RRGGBB").
 */
export function rgbToHex (r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase() // Convert to uppercase for consistency
}

/**
 * 计算给定 HSL 颜色在色相环上移动指定度数后的新 HSL 颜色。
 * @param hsl 原始 HSL 颜色。
 * @param degrees 移动的度数。
 * @returns 新的 HSL 颜色。
 */
export const rotateHue = (hsl: HSLColor, degrees: number): HSLColor => {
  let newHue = (hsl.h + degrees) % 360
  if (newHue < 0) {
    newHue += 360 // 确保色相在 0-359 范围内
  }
  return { ...hsl, h: newHue }
}

/**
 * 单色方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含主色和两种变体的颜色数组
 */
export const generateMonochromaticColors = (primaryHsl: HSLColor): string[] => {
  const bright = hslToHex({
    ...primaryHsl,
    l: Math.min(primaryHsl.l + 15, 100)
  })
  const dark = hslToHex({ ...primaryHsl, l: Math.max(primaryHsl.l - 15, 0) })
  const softer = hslToHex({ ...primaryHsl, s: Math.max(primaryHsl.s - 20, 0) })
  const pure = hslToHex(primaryHsl) // 原始主色

  return [pure, bright, dark, softer]
}

/**
 * 邻近色方案
 * @param primaryHsl 主色 (HSL)
 * @param angle 邻近色的角度间隔 (e.g., 30)
 * @returns 包含主色和两个邻近色的颜色数组
 */
export const generateAnalogousColors = (
  primaryHsl: HSLColor,
  angle: number = 30
): string[] => {
  // colord的harmonies插件提供了更简洁的方法
  const colors = colord(hslToHex(primaryHsl))
    .harmonies('analogous')
    .map(c => c.toHex())
  // harmonies插件会返回3个颜色，中间是主色
  return colors
}

/**
 * 互补色方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含主色和互补色的颜色数组
 */
export const generateComplementaryColors = (primaryHsl: HSLColor): string[] => {
  const colors = colord(hslToHex(primaryHsl))
    .harmonies('complementary')
    .map(c => c.toHex())
  return colors // 返回主色和互补色
}

/**
 * 分离互补色方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含主色和两个分离互补色的颜色数组
 */
export const generateSplitComplementaryColors = (
  primaryHsl: HSLColor
): string[] => {
  const colors = colord(hslToHex(primaryHsl))
    .harmonies('split-complementary')
    .map(c => c.toHex())
  return colors // 返回主色和两个分离互补色
}

/**
 * 三色方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含三个等距颜色的数组
 */
export const generateTriadicColors = (primaryHsl: HSLColor): string[] => {
  const colors = colord(hslToHex(primaryHsl))
    .harmonies('triadic')
    .map(c => c.toHex())
  return colors // 返回三个三色方案的颜色
}

/**
 * 四色方案 / 矩形方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含四个颜色的数组
 */
export const generateTetradicColors = (primaryHsl: HSLColor): string[] => {
  const colors = colord(hslToHex(primaryHsl))
    .harmonies('tetradic')
    .map(c => c.toHex())
  return colors // 返回四个四色方案的颜色
}

/**
 * 正方形方案
 * @param primaryHsl 主色 (HSL)
 * @returns 包含四个颜色的数组
 */
// export const generateSquareColors = (primaryHsl: HSLColor): string[] => {
//   const colors = colord(hslToHex(primaryHsl))
//     .harmonies('square')
//     .map(c => c.toHex())
//   return colors // 返回四个正方形方案的颜色
// }

/**
 * 随机生成一个 Hex 格式的颜色字符串。
 * @returns 随机的 Hex 颜色字符串。
 */
export const generateRandomHexColor = (): string => {
  // Generate random R, G, B values (0-255)
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)

  // Convert RGB to Hex using colord
  return colord({ r, g, b }).toHex()
}

/**
 * 给定一个hsv中的h，生成7个shades
 * @param h 色相
 * return 一个包含七个shades的数组
 */
export const generateShadesFromHue = (h: number): string[] => {
  const shades: string[] = []
  const sArray: number[] = [8, 17, 64, 94, 94, 95, 95] // Saturation levels
  const lArray: number[] = [99, 98, 94, 91, 73, 37, 27] // Lightness levels
  for (let i = 0; i < 7; i++) {
    const s = sArray[i] // Saturation from predefined array
    const l = lArray[i] // Lightness from predefined array
    const hslColor: HSLColor = { h, s, l }
    shades.push(hslToHex(hslColor))
  }
  return shades
}

export const generateNeutralColorShades = (): string[] => {
  return [
    '#F2F2F2',
    '#D8D8D8',
    '#B2B2B2',
    '#7F7F7F',
    '#4C4C4C',
    '#191919',
    '#000000'
  ]
}

/**
 * Generates an 7-color monochromatic palette based on a base color.
 * The palette includes tints, tones (desaturated lighter versions), and shades.
 *
 * @param baseHexColor The base color in hex format (e.g., "#E609DB").
 * @returns An array of 7 hex color strings representing the monochromatic palette.
 */
export function generateMonochromaticPalette (baseHexColor: string): string[] {
  const baseRgb = hexToRgb(baseHexColor)
  const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b)

  const palette: string[] = []
  const baseHue = baseHsl.h
  const baseSaturation = baseHsl.s
  const baseLightness = baseHsl.l

  const targetLightnessSteps = [
    95, // Very Light Tint
    90, // Light Tint
    66, // Lighter Tone
    baseLightness, // Base Color (placeholder, will be adjusted)
    42, // Darker Shade
    21, // Dark Shade
    15 // Very Dark Shade
  ]

  // Adjust the target lightness steps to fit the base color's lightness
  let closestIndex = 0
  let minDiff = Infinity
  for (let i = 0; i < targetLightnessSteps.length; i++) {
    // If the current step is the placeholder for baseLightness, we explicitly use baseLightness
    // Otherwise, find the closest one to replace.
    if (targetLightnessSteps[i] === baseLightness) {
      // This check is a bit naive if baseLightness equals a fixed step value
      closestIndex = i
      break // Found it
    }
    const diff = Math.abs(targetLightnessSteps[i] - baseLightness)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }
  // If the base lightness is very close to an existing step, it might already be there.
  // Ensure the actual base lightness is used at its intended position.
  targetLightnessSteps[closestIndex] = baseLightness
  targetLightnessSteps.sort((a, b) => b - a) // Sort descending for tints first

  // Ensure uniqueness and that we have exactly 8 steps.
  // Remove duplicates if baseLightness was identical to a predefined step.
  const uniqueLightnessSteps = Array.from(new Set(targetLightnessSteps))
  // If we ended up with less than 8 unique steps (due to baseLightness overlap),
  // we might need to re-evaluate the steps or add a filler.
  // For simplicity, we'll proceed, assuming overlaps are rare or acceptable.
  // If strict 7 unique steps are needed, a more complex distribution algorithm would be used.

  // To ensure exactly 7 colors without duplicates and including base:
  const finalLightnessSteps: number[] = []
  const sortedUniqueSteps = Array.from(new Set(targetLightnessSteps)).sort(
    (a, b) => b - a
  )

  // Add the base lightness to ensure it's in the list
  if (!sortedUniqueSteps.includes(baseLightness)) {
    sortedUniqueSteps.push(baseLightness)
    sortedUniqueSteps.sort((a, b) => b - a)
  }

  // If there are more than 7 unique steps after adding base, take 7 representative ones
  if (sortedUniqueSteps.length > 7) {
    // A simple way is to sample from the sorted unique steps
    for (let i = 0; i < 7; i++) {
      finalLightnessSteps.push(
        sortedUniqueSteps[Math.floor((i * (sortedUniqueSteps.length - 1)) / 6)]
      )
    }
  } else if (sortedUniqueSteps.length < 6) {
    // If less than 7, we need to add more. Simplest is to fill in between or extend ends.
    // For this example, let's just use what we have and assume we aim for 7 if possible.
    // For robustness, one might add more interpolated steps.
    for (let i = 0; i < sortedUniqueSteps.length; i++) {
      finalLightnessSteps.push(sortedUniqueSteps[i])
    }
    // Fill remaining spots by interpolating or adding more standard steps if needed
    while (finalLightnessSteps.length < 7) {
      // This is a simple filler, could be more sophisticated
      finalLightnessSteps.push(
        finalLightnessSteps[finalLightnessSteps.length - 1] - 5
      )
    }
    finalLightnessSteps.sort((a, b) => b - a) // Re-sort after adding fillers
    finalLightnessSteps.splice(7) // Ensure exactly 7 elements
  } else {
    finalLightnessSteps.push(...sortedUniqueSteps)
  }

  // Ensure exactly 7 steps. If fewer, duplicate the base or nearest. If more, truncate.
  while (finalLightnessSteps.length < 7) {
    finalLightnessSteps.push(baseLightness) // Simple fill: just add base color
  }
  finalLightnessSteps.splice(7) // Trim to exactly 7

  // Generate colors
  for (let i = 0; i < 7; i++) {
    const targetL = finalLightnessSteps[i]
    let targetS = baseSaturation

    // Adjust saturation based on lightness for a more nuanced palette
    if (targetL > 70) {
      targetS = Math.max(10, baseSaturation * 0.4)
    } else if (targetL > 50 && targetL <= 70) {
      targetS = Math.max(20, baseSaturation * 0.7)
    } else if (targetL < 20) {
      targetS = Math.max(baseSaturation * 0.8, 30)
    }

    targetS = Math.max(0, Math.min(100, targetS)) // Ensure saturation is within [0, 100]

    // Ensure lightness is within [0, 100]
    const finalL = Math.max(0, Math.min(100, targetL))

    const newRgb = hslToRgb(baseHue, targetS, finalL)
    palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b))
  }

  return palette
}

export interface ColorScheme {
  baseColorShades: string[] // 主色调的阴影
  neutralColorShades: string[] // 中性色调
  secondaryColor1Shades: string[] // 第二色调1
  secondaryColor2Shades: string[] // 第二色调2
  secondaryColor3Shades: string[] // 第二色调3
  secondaryColor4Shades: string[] // 第二色调4
}

/**
 * Generates a color scheme based on a base color hue
 * @param baseHue The hue of the base color (0-360).
 * @return A ColorScheme object containing shades of the base color and neutral colors.
 */
export function generateColorScheme (refBaseHexColor: string): ColorScheme {
    const baseColorShades = generateMonochromaticPalette(refBaseHexColor)
//   const baseColorShades = generateShadesFromHue(hexToHsl(refBaseHexColor).h) // Generate shades for the base color using its hue
  const baseColor = baseColorShades[3] // Use the middle shade as the base color
  const baseColorHsl = hexToHsl(baseColor)

  const splitComplementaryColors =
    generateSplitComplementaryColors(baseColorHsl)
  const secondaryColor1 = splitComplementaryColors[2]
  const secondaryColor4 = splitComplementaryColors[1]

  const tetradicColors = generateTetradicColors(baseColorHsl)
  const secondaryColor3 = tetradicColors[1] // Second color in tetradic scheme
  const secondaryColor2 = tetradicColors[3] // Fourth color in tetradic scheme

  const neutralColorShades = generateNeutralColorShades()
  // const neutralColorShades = generateMonochromaticPalette(#7F7F7F)
  return {
    baseColorShades: baseColorShades,
    neutralColorShades: neutralColorShades,
    // secondaryColor1Shades: generateShadesFromHue(hexToHsl(secondaryColor1).h), // Generate shades for secondary color 1
    // secondaryColor2Shades: generateShadesFromHue(hexToHsl(secondaryColor2).h), // Generate shades for secondary color 2
    // secondaryColor3Shades: generateShadesFromHue(hexToHsl(secondaryColor3).h), // Generate shades for secondary color 3
    // secondaryColor4Shades: generateShadesFromHue(hexToHsl(secondaryColor4).h) // Generate shades for secondary color 4
    secondaryColor1Shades: generateMonochromaticPalette(secondaryColor1), // Generate shades for secondary color 1
    secondaryColor2Shades: generateMonochromaticPalette(secondaryColor2), // Generate shades for secondary color 2
    secondaryColor3Shades: generateMonochromaticPalette(secondaryColor3), // Generate shades for secondary color 3
    secondaryColor4Shades: generateMonochromaticPalette(secondaryColor4) // Generate shades for secondary color 4
  }
}
