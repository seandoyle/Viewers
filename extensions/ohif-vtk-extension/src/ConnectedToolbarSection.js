import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core';

const { setToolActive } = OHIF.redux.actions;

const mapStateToProps = state => {
  return {
    buttons: [
      {
        command: 'WWWC',
        type: 'tool',
        text: 'WWWC',
        icon: 'level',
        active: true,
        onClick: () => {
          // TODO: Make these use setToolActive instead
          window.commandsManager.runCommand('enableLevelTool', {}, 'vtk');
        }
      },
      /*{ // This is currently disabled until we can correctly switch interactor styles (https://github.com/Kitware/vtk-js/issues/1110)
        command: 'Rotate',
        type: 'tool',
        text: 'Rotate',
        icon: '3d-rotate',
        active: false,
        onClick: () => {
          // TODO: Make these use setToolActive instead
          window.commandsManager.runCommand('enableRotateTool', {}, 'vtk');
        }
      },*/
    ],
    activeCommand: 'WWWC'
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  null
)(ToolbarSection);

export default ConnectedToolbarSection;
