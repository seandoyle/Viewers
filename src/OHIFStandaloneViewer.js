import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import asyncComponent from './components/AsyncComponent.js'
import IHEInvokeImageDisplay from './routes/IHEInvokeImageDisplay.js';
import ViewerRouting from './routes/ViewerRouting.js';
import StudyListRouting from './studylist/StudyListRouting.js';
import StandaloneRouting from './routes/StandaloneRouting.js';
import CallbackPage from './CallbackPage.js';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext } from 'react-viewerbase';
import Container from './Container.js';
import Bar from './Bar.js';
import { setLoadingBar } from './redux/actions.js';

import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';

// Dynamic Import Routes (CodeSplitting)
// const IHEInvokeImageDisplay = asyncComponent(() =>
//   import('./routes/IHEInvokeImageDisplay.js')
// )
// const ViewerRouting = asyncComponent(() => import('./routes/ViewerRouting.js'))
// const StudyListRouting = asyncComponent(() =>
//   import('./studylist/StudyListRouting.js')
// )
// const StandaloneRouting = asyncComponent(() =>
//   import('./routes/StandaloneRouting.js')
// )
// const CallbackPage = asyncComponent(() => import('./CallbackPage.js'))
//

const reload = () => window.location.reload();

class OHIFStandaloneViewer extends Component {
  constructor(props) {
    super(props);
    this.props.setLoadingBar(true);
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    user: PropTypes.object,
  };

  componentDidMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      if (this.props.setContext) {
        this.props.setContext(window.location.pathname);
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { user, userManager } = this.props;

    const userNotLoggedIn = userManager && (!user || user.expired);
    if (userNotLoggedIn) {
      const pathname = this.props.location.pathname;

      if (pathname !== '/callback') {
        sessionStorage.setItem('ohif-redirect-to', pathname);
      }

      return (
        <Switch>
          <Route exact path="/silent-refresh.html" onEnter={reload} />
          <Route exact path="/logout-redirect.html" onEnter={reload} />
          <Route
            path="/callback"
            render={() => <CallbackPage userManager={userManager} />}
          />
          <Route
            component={() => {
              userManager.signinRedirect();

              return null;
            }}
          />
        </Switch>
      );
    }

    return (
      <Switch>
        <Route
          render={({ location }) => (
            <React.Fragment>
              <NProgress isAnimating={this.props.isLoading} key={location.key}>
                {({ isFinished, progress, animationDuration }) => (
                  <Container
                    isFinished={isFinished}
                    animationDuration={animationDuration}
                  >
                    <Bar
                      progress={progress}
                      animationDuration={animationDuration}
                    />
                  </Container>
                )}
              </NProgress>
              <Route exact path="/silent-refresh.html" onEnter={reload} />
              <Route exact path="/logout-redirect.html" onEnter={reload} />
              <Route exact path="/studylist" component={StudyListRouting} />
              <Route exact path="/" component={StudyListRouting} />
              <Route exact path="/viewer" component={StandaloneRouting} />
              <Route
                path="/viewer/:studyInstanceUids"
                component={ViewerRouting}
              />
              <Route
                path="/study/:studyInstanceUid/series/:seriesInstanceUids"
                component={ViewerRouting}
              />
              <Route
                path="/IHEInvokeImageDisplay"
                component={IHEInvokeImageDisplay}
              />
              <Route
                render={() => <div> Sorry, this page does not exist. </div>}
              />
            </React.Fragment>
          )}
        />
      </Switch>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    isLoading: state.ui.isLoading,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoadingBar: options => {
      dispatch(setLoadingBar(options));
    },
  };
};

const ConnectedOHIFStandaloneViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(OHIFStandaloneViewer);

export default ViewerbaseDragDropContext(
  withRouter(ConnectedOHIFStandaloneViewer)
);