import * as React from 'react';
import { makeStyles, StylesProvider, MuiThemeProvider, CssBaseline } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import { mandarin as theme } from './theme/theme';
import { BrowserRouter as Router } from 'react-router-dom';
import AppStateProvider from './state';
import { Routes } from './Routes';
import { useAnalyticsUserIdentity } from './hooks/useAnalyticsUserIdentity/useAnalyticsUserIdentity';
import { FlaggProvider } from 'flagg/dist/react';
import { featureFlags } from './featureFlags';
import { ReactQueryCacheProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query-devtools';
import { queryCache } from './queryCache';

export interface IAppProps {}

// styles to override the default styles
const useStyles = makeStyles((themeObj) => ({
  success: {
    color: `${themeObj.palette.common.black} !important`,
    backgroundColor: `${themeObj.palette.success.main} !important`,
  },
  error: {
    color: themeObj.palette.success.contrastText,
    backgroundColor: `${themeObj.palette.error.main} !important`,
  },
}));

const SnackbarWrapper = (props: any) => {
  const { children } = props;
  const styles = useStyles();
  return (
    <SnackbarProvider
      maxSnack={3}
      classes={{
        variantSuccess: styles.success,
        variantError: styles.error,
      }}
      hideIconVariant
    >
      {children}
    </SnackbarProvider>
  );
};

export const App: React.FC<IAppProps> = () => {
  // on load, if the user is logged in, identify them to various
  // tooling
  useAnalyticsUserIdentity();

  return (
    <>
      <ReactQueryCacheProvider queryCache={queryCache}>
        <FlaggProvider featureFlags={featureFlags}>
          <StylesProvider injectFirst>
            <MuiThemeProvider theme={theme}>
              <SnackbarWrapper>
                <CssBaseline />
                <Router>
                  <AppStateProvider>
                    <Routes />
                  </AppStateProvider>
                </Router>
              </SnackbarWrapper>
            </MuiThemeProvider>
          </StylesProvider>
        </FlaggProvider>
      </ReactQueryCacheProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
};
