import vtkInteractorStyleMPRSlice from 'vtk.js/Sources/Interaction/Style/InteractorStyleMPRSlice';
import { CustomSliceInteractorStyle } from 'react-vtkjs-viewport';

import linkAllInteractors from './utils/linkAllInteractors.js';
import setViewportToVTK from './utils/setViewportToVTK.js'
import setMPRLayout from './utils/setMPRLayout.js'

// TODO: Should be another way to get this
const commandsManager = window.commandsManager;

// TODO: Put this somewhere else
let apis = {};

async function _getActiveViewportVTKApi(viewports) {
  const { layout, viewportSpecificData, activeViewportIndex } = viewports;

  const currentData = layout.viewports[activeViewportIndex];
  if (currentData && currentData.plugin === 'vtk') {
    // TODO: I was storing/pulling this from Redux but ran into weird issues
    if (apis[activeViewportIndex]) {
      return apis[activeViewportIndex];
    }
  }

  const displaySet = viewportSpecificData[activeViewportIndex];

  let api;
  if (!api) {
    try {
      api = await setViewportToVTK(displaySet, activeViewportIndex, layout, viewportSpecificData);
    } catch(error) {
      throw new Error(error)
    }
  }

  return api;
}


function _setView(api, sliceNormal, viewUp) {
  const renderWindow = api.genericRenderWindow.getRenderWindow()
  const renderer = api.genericRenderWindow.getRenderer();
  const camera = renderer.getActiveCamera();
  const istyle = renderWindow.getInteractor().getInteractorStyle();
  istyle.setSliceNormal(...sliceNormal);
  camera.setViewUp(...viewUp);

  renderWindow.render();
}

function _setViewSlice(api, slicingMode, viewUp) {
  const renderWindow = api.genericRenderWindow.getRenderWindow()

  // TODO: This is a hacky workaround because disabling the vtkInteractorStyleMPRSlice is currently
  // broken. The camera.onModified is never removed. (https://github.com/Kitware/vtk-js/issues/1110)
  const currentIStyle = renderWindow.getInteractor().getInteractorStyle();
  if (currentIStyle.setVolumeMapper) {
    currentIStyle.setVolumeMapper(null);
  }

  const sliceIstyle = CustomSliceInteractorStyle.newInstance();

  renderWindow.getInteractor().setInteractorStyle(sliceIstyle)
  sliceIstyle.setCurrentVolumeNumber(0) // background volume
  sliceIstyle.setSlicingMode(slicingMode, true);

  const extentMinMax = api.volumes[0].getMapper().getInputData().getExtent();
  const sliceMax = extentMinMax[slicingMode * 2 + 1];
  sliceIstyle.setSlice(Math.round(sliceMax / 2));

  const renderer = api.genericRenderWindow.getRenderer();
  const camera = renderer.getActiveCamera();

  camera.setViewUp(...viewUp);

  renderWindow.render();
}

const actions = {
  axial: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    //_setView(api, [0, 0, 1], [0, -1, 0]);
    _setViewSlice(api, 2, [0, -1, 0]);
  },
  sagittal: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    //_setView(api, [1, 0, 0], [0, 0, 1]);
    _setViewSlice(api, 0, [0, 0, 1]);
  },
  coronal: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    //_setView(api, [0, 1, 0], [0, 0, 1]);
    _setViewSlice(api, 1, [0, 0, 1]);
  },
  enableRotateTool: async ({viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    const renderWindow = api.genericRenderWindow.getRenderWindow();
    const istyle = vtkInteractorStyleMPRSlice.newInstance();
    renderWindow.getInteractor().setInteractorStyle(istyle)

    // TODO: Not sure why this is required the second time this function is called
    istyle.setInteractor(renderWindow.getInteractor());

    istyle.setVolumeMapper(api.volumes[0]);
  },
  enableLevelTool: async ({viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    const renderWindow = api.genericRenderWindow.getRenderWindow();
    const istyle = CustomSliceInteractorStyle.newInstance();

    renderWindow.getInteractor().setInteractorStyle(istyle)
    istyle.setCurrentVolumeNumber(0)
  },
  mpr2d: async ({viewports}) => {
    const displaySet = viewports.viewportSpecificData[viewports.activeViewportIndex];

    let apiByViewport;
    try {
      apiByViewport = await setMPRLayout(displaySet);
    } catch (error) {
      throw new Error(error);
    }

    apis = apiByViewport;

    const renderWindows = [];
    apiByViewport.forEach((api, index) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow()
      renderWindows.push(renderWindow);

      const istyle = renderWindow.getInteractor().getInteractorStyle();

      // TODO: This is a hacky workaround because disabling the vtkInteractorStyleMPRSlice is currently
      // broken. The camera.onModified is never removed. (https://github.com/Kitware/vtk-js/issues/1110)
      const currentIStyle = renderWindow.getInteractor().getInteractorStyle();
      if (currentIStyle.setVolumeMapper) {
        currentIStyle.setVolumeMapper(null);
      }

      const sliceIstyle = CustomSliceInteractorStyle.newInstance();

      renderWindow.getInteractor().setInteractorStyle(sliceIstyle)
      sliceIstyle.setCurrentVolumeNumber(0) // background volume

      const renderer = api.genericRenderWindow.getRenderer();
      const camera = renderer.getActiveCamera();

      let slicingMode;

      switch (index) {
        default:
        case 0:
          //Axial
          //istyle.setSliceNormal(0, 0, 1);
          slicingMode = 2;
          camera.setViewUp(0, -1, 0);

          break;
        case 1:
          // sagittal
          //istyle.setSliceNormal(1, 0, 0);
          slicingMode = 0;
          //camera.setViewUp(0, 0, 1);
          break;
        case 2:
          // Coronal
          //istyle.setSliceNormal(0, 1, 0);
          slicingMode = 1;
          //camera.setViewUp(0, 0, 1);
          break;
      }

      sliceIstyle.setSlicingMode(slicingMode, true) // force set slice mode
      const extentMinMax = api.volumes[0].getMapper().getInputData().getExtent();
      const sliceMax = extentMinMax[slicingMode * 2 + 1];
      sliceIstyle.setSlice(Math.round(sliceMax / 2));

      renderWindow.render();
    });

    linkAllInteractors(renderWindows);
  }
};

const definitions = {
  axial: {
    commandFn: actions.axial,
    storeContexts: ['viewports'],
    options: {},
  },
  coronal: {
    commandFn: actions.coronal,
    storeContexts: ['viewports'],
    options: {},
  },
  sagittal: {
    commandFn: actions.sagittal,
    storeContexts: ['viewports'],
    options: {},
  },
  enableRotateTool: {
    commandFn: actions.enableRotateTool,
    storeContexts: ['viewports'],
    options: {},
  },
  enableLevelTool: {
    commandFn: actions.enableLevelTool,
    storeContexts: ['viewports'],
    options: {},
  },
  mpr2d: {
    commandFn: actions.mpr2d,
    storeContexts: ['viewports'],
    options: {},
  },
};

export { definitions };
