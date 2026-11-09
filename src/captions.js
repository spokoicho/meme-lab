export const MAX_CAPTIONS = 8;

export const captionDefaults = Object.freeze({
  outline: '#17131c',
  thickness: 14,
  shadow: false,
  align: 'center',
});

const coordinate = value => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;

export function restoreCaptionStyle(style, fallback = captionDefaults) {
  const color = key => /^#[\da-f]{6}$/i.test(style?.[key] ?? '') ? style[key] : fallback[key];
  const number = (key, min, max) => Number.isFinite(style?.[key])
    ? Math.max(min, Math.min(max, style[key])) : fallback[key];
  return {
    size: number('size', 24, 92),
    color: color('color'),
    outline: color('outline'),
    thickness: number('thickness', 0, 30),
    shadow: typeof style?.shadow === 'boolean' ? style.shadow : fallback.shadow,
  };
}

export function restoreCaptions(layout, top = '', bottom = '') {
  const layers = Array.isArray(layout?.layers) && layout.layers.length >= 2
    ? layout.layers.slice(0, MAX_CAPTIONS)
    : [{ text: top }, { text: bottom }];
  return {
    layers: layers.map(layer => ({
      text: typeof layer?.text === 'string' ? layer.text.slice(0, 140) : '',
      x: coordinate(layer?.x),
      y: coordinate(layer?.y),
      ...(layer?.style && typeof layer.style === 'object'
        ? { style: restoreCaptionStyle(layer.style) } : {}),
    })),
    outline: /^#[\da-f]{6}$/i.test(layout?.outline ?? '') ? layout.outline : captionDefaults.outline,
    thickness: Number.isFinite(layout?.thickness)
      ? Math.max(0, Math.min(30, layout.thickness))
      : captionDefaults.thickness,
    shadow: layout?.shadow === true,
    align: ['left', 'center', 'right'].includes(layout?.align) ? layout.align : captionDefaults.align,
  };
}
