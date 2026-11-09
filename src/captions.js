export const MAX_CAPTIONS = 8;

export const captionDefaults = Object.freeze({
  outline: '#17131c',
  thickness: 14,
  shadow: false,
  align: 'center',
});

const coordinate = value => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;

export function restoreCaptions(layout, top = '', bottom = '') {
  const layers = Array.isArray(layout?.layers) && layout.layers.length >= 2
    ? layout.layers.slice(0, MAX_CAPTIONS)
    : [{ text: top }, { text: bottom }];
  return {
    layers: layers.map(layer => ({
      text: typeof layer?.text === 'string' ? layer.text.slice(0, 140) : '',
      x: coordinate(layer?.x),
      y: coordinate(layer?.y),
    })),
    outline: /^#[\da-f]{6}$/i.test(layout?.outline ?? '') ? layout.outline : captionDefaults.outline,
    thickness: Number.isFinite(layout?.thickness)
      ? Math.max(0, Math.min(30, layout.thickness))
      : captionDefaults.thickness,
    shadow: layout?.shadow === true,
    align: ['left', 'center', 'right'].includes(layout?.align) ? layout.align : captionDefaults.align,
  };
}
