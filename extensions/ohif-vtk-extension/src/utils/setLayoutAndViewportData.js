// TODO: Should not be getting dispatch from the window, but I'm not sure how else to do it cleanly
export default function setLayoutAndViewportData (layout, viewportSpecificData) {
  window.store.dispatch({
    type: 'SET_LAYOUT_AND_VIEWPORT_DATA',
    layout,
    viewportSpecificData,
  });
}
