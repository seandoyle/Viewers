import { connect } from 'react-redux';
import PluginSwitch from './PluginSwitch.js';
import OHIF from 'ohif-core';

const { setLayout } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, layout } = state.viewports;

  return {
    activeViewportIndex,
    layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLayout: data => {
      dispatch(setLayout(data));
    },
  };
};

function setSingleLayoutData(originalArray, viewportIndex, data) {
  const viewports = originalArray.slice();
  const layoutData = Object.assign({}, viewports[viewportIndex], data);

  viewports[viewportIndex] = layoutData;

  return viewports;
}

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { activeViewportIndex, layout } = propsFromState;
  const { setLayout } = propsFromDispatch;

  // TODO: Do not display certain options if the current display set
  // cannot be displayed using these view types
  const buttons = [
    {
      text: 'Acquired',
      type: 'command',
      icon: 'bars',
      active: false,
      onClick: () => {
        console.warn('Original Acquisition');

        const layoutData = setSingleLayoutData(
          layout.viewports,
          activeViewportIndex,
          { plugin: 'cornerstone' }
        );

        setLayout({ viewports: layoutData });
      },
    },
    {
      text: 'Axial',
      icon: 'cube',
      active: false,
      onClick: () => {
        console.warn('Axial');
        const data = {
          plugin: 'vtk',
          vtk: {
            mode: 'mpr',
            sliceNormal: [0, 0, 1],
          },
        };

        const layoutData = setSingleLayoutData(
          layout.viewports,
          activeViewportIndex,
          data
        );

        setLayout({ viewports: layoutData });
      },
    },
    {
      text: 'Sagittal',
      icon: 'cube',
      active: false,
      onClick: () => {
        console.warn('Sagittal');
        const data = {
          plugin: 'vtk',
          vtk: {
            mode: 'mpr',
            sliceNormal: [1, 0, 0],
          },
        };

        const layoutData = setSingleLayoutData(
          layout.viewports,
          activeViewportIndex,
          data
        );

        setLayout({ viewports: layoutData });
      },
    },
    {
      text: 'Coronal',
      icon: 'cube',
      active: false,
      onClick: () => {
        console.warn('Coronal');
        const data = {
          plugin: 'vtk',
          vtk: {
            mode: 'mpr',
            sliceNormal: [0, 1, 0],
          },
        };

        const layoutData = setSingleLayoutData(
          layout.viewports,
          activeViewportIndex,
          data
        );

        setLayout({ viewports: layoutData });
      },
    },
    /*{
      text: '3D',
      icon: `#cube`,
      onClick: (click) => {
        console.warn('3D Perspective');
        const data = {
          plugin: 'vtk',
          vtk: {
            mode: '3d',
          }
        };

        const layoutData = setSingleLayoutData(layout.viewports, activeViewportIndex, data);

        setLayout({ viewports: layoutData });
      }
    }*/
  ];

  return {
    buttons,
  };
};

const ConnectedPluginSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PluginSwitch);

export default ConnectedPluginSwitch;
