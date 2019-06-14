import { vtkInteractorStyleMPRWindowLevel, vtkInteractorStyleMPRSlice, vtkInteractorStyleMPRCrosshairs } from 'react-vtkjs-viewport';

import setViewportToVTK from './utils/setViewportToVTK.js'
import setMPRLayout from './utils/setMPRLayout.js'
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

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

  api.volumes[0].getMapper().setSampleDistance(5.0);
  api.volumes[0].getMapper().setMaximumSamplesPerRay(2000)

  renderWindow.render();
}

const actions = {
  axial: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [0, 0, 1], [0, -1, 0]);
  },
  sagittal: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [1, 0, 0], [0, 0, 1]);
  },
  coronal: async ({viewports}) => {
    const api = await _getActiveViewportVTKApi(viewports);

    apis[viewports.activeViewportIndex] = api;

    _setView(api, [0, 1, 0], [0, 0, 1]);
  },
  enableRotateTool: async ({viewports }) => {
    const api = await _getActiveViewportVTKApi(viewports);

    const renderWindow = api.genericRenderWindow.getRenderWindow();
    renderWindow.getInteractor().getInteractorStyle().setInteractor(null);
    renderWindow.getInteractor().getInteractorStyle().delete();

    const istyle = vtkInteractorStyleMPRSlice.newInstance();
    renderWindow.getInteractor().setInteractorStyle(istyle)

    // TODO: Not sure why this is required the second time this function is called
    istyle.setInteractor(renderWindow.getInteractor());

    if (istyle.getVolumeMapper() !== api.volumes[0]) {
      istyle.setVolumeMapper(api.volumes[0]);
    }
  },
  enableCrosshairsTool: async ({viewports }) => {
    apiByViewport.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const renderer = api.genericRenderWindow.getRenderer();
      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();

      // TODO: This attempts to avoid the lingering subscription in the MPR Interactor Style
      renderWindow.getInteractor().getInteractorStyle().setInteractor(null);

      renderWindow.getInteractor().setInteractorStyle(istyle)

      // TODO: Not sure why this is required the second time this function is called
      istyle.setInteractor(renderWindow.getInteractor());

      // Note: we are actually passing the volume actor itself...
      if (istyle.getVolumeMapper() !== api.volumes[0]) {
        istyle.setVolumeMapper(api.volumes[0]);
      }
    });
  },
  enableLevelTool: async ({viewports }) => {
    apiByViewport.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();
      const renderer = api.genericRenderWindow.getRenderer();
      const istyle = vtkInteractorStyleMPRWindowLevel.newInstance();

      // TODO: This attempts to avoid the lingering subscription in the MPR Interactor Style
      renderWindow.getInteractor().getInteractorStyle().setInteractor(null);

      renderWindow.getInteractor().setInteractorStyle(istyle)

      // TODO: Not sure why this is required the second time this function is called
      istyle.setInteractor(renderWindow.getInteractor());

      // Note: we are actually passing the volume actor itself...
      if (istyle.getVolumeMapper() !== api.volumes[0]) {
        istyle.setVolumeMapper(api.volumes[0]);
      }
    });
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

    function getCrosshairCallbackForIndex(index) {
      return (worldPos) => {
        console.warn(`crosshairs callback ${index}`);
        console.warn(worldPos);

        // Set camera focal point to world coordinate for linked views
        apiByViewport.forEach((api, viewportIndex) => {
          if (viewportIndex === index) {
            return;
          }


          // We are basically doing the same as getSlice but with the world coordinate
          // that we want to jump to instead of the camera focal point.
          // I would rather do the camera adjustment directly but I keep
          // doing it wrong and so this is good enough for now.
          const renderWindow = api.genericRenderWindow.getRenderWindow()
          const istyle = renderWindow.getInteractor().getInteractorStyle();
          const sliceNormal = istyle.getSliceNormal();
          const transform = vtkMatrixBuilder
            .buildFromDegree()
            .identity()
            .rotateFromDirections(sliceNormal, [1, 0, 0]);

          const mutatedWorldPos = worldPos.slice();
          transform.apply(mutatedWorldPos);
          const slice = mutatedWorldPos[0];

          istyle.setSlice(slice);

          renderWindow.render();
        });
      }
    }

    const rgbTransferFunction = apiByViewport[0].volumes[0].getProperty().getRGBTransferFunction(0);
    rgbTransferFunction.onModified(() => {
      apiByViewport.forEach(a => {
        const renderWindow = a.genericRenderWindow.getRenderWindow();

        renderWindow.render();
      })
    });

    apiByViewport.forEach((api, index) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow()
      const renderer = api.genericRenderWindow.getRenderer();
      const camera = renderer.getActiveCamera();

      // TODO: This is a hacky workaround because disabling the vtkInteractorStyleMPRSlice is currently
      // broken. The camera.onModified is never removed. (https://github.com/Kitware/vtk-js/issues/1110)
      renderWindow.getInteractor().getInteractorStyle().setInteractor(null);

      const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();
      istyle.setVolumeMapper(api.volumes[0])
      istyle.setCallback(getCrosshairCallbackForIndex(index));

      renderWindow.getInteractor().setInteractorStyle(istyle)

      switch (index) {
        default:
        case 0:
          //Axial
          istyle.setSliceNormal(0, 0, 1);
          camera.setViewUp(0, -1, 0);

          break;
        case 1:
          // sagittal
          istyle.setSliceNormal(1, 0, 0);
          camera.setViewUp(0, 0, 1);
          break;
        case 2:
          // Coronal
          istyle.setSliceNormal(0, 1, 0);
          camera.setViewUp(0, 0, 1);
          break;
      }

      renderWindow.render();
    });
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
  enableCrosshairsTool: {
    commandFn: actions.enableCrosshairsTool,
    storeContexts: ['viewports'],
    options: {},
  }
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
