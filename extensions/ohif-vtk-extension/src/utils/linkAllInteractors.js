function linkInteractors(renderWindow1, renderWindow2) {
  const i1 = renderWindow1.getInteractor();
  const i2 = renderWindow2.getInteractor();
  const sync = {};

  let src = null;

  function linkOneWay(from, to) {
    from.onStartAnimation(() => {
      if (!src) {
        src = from;
        to.requestAnimation(sync);
      }
    });

    from.onEndAnimation(() => {
      if (src === from) {
        src = null;
        to.cancelAnimation(sync);
        // roughly wait for widgetManager.capture() to finish
        setTimeout(to.render, 1000);
      }
    });
  }

  linkOneWay(i1, i2);
  linkOneWay(i2, i1);
}

export default function linkAllInteractors(renderWindows) {
  if (renderWindows.length < 2) {
    return;
  }

  for (let i = 0; i < renderWindows.length - 1; i++) {
    for (let j = i + 1; j < renderWindows.length; j++) {
      linkInteractors(renderWindows[i], renderWindows[j]);
    }
  }
}
