import * as React from 'react';
import * as auth0 from 'auth0-js';
import { Auth0Lock } from 'auth0-lock';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import ButtonGroup from '@mui/material/ButtonGroup';

const theme = createTheme();

function useDidMount() {
  const didMountRef = React.useRef(true);

  React.useEffect(() => {
    didMountRef.current = false;
  }, []);
  return didMountRef.current;
};

let webAuth: auth0.WebAuth | undefined = undefined
const initializeAuth0Instance = (config: any) => {

  var leeway = config.internalOptions.leeway;
  if (leeway) {
    var convertedLeeway = parseInt(leeway);

    if (!isNaN(convertedLeeway)) {
      config.internalOptions.leeway = convertedLeeway;
    }
  }

  var params = Object.assign({
    overrides: {
      __tenant: config.auth0Tenant,
      __token_issuer: config.authorizationServer.issuer
    },
    domain: config.auth0Domain,
    clientID: config.clientID,
    redirectUri: config.callbackURL,
    responseType: 'code'
  }, config.internalOptions);

  webAuth = new auth0.WebAuth(params);
}

let lock: typeof Auth0Lock | undefined = undefined
const initializeLockInstance = (config: any) => {
  // Decode utf8 characters properly
  console.log(config)
  config.extraParams = config.extraParams || {};
  var connection = config.connection;
  var prompt = config.prompt;
  var languageDictionary;
  var language;

  if (config.dict && config.dict.signin && config.dict.signin.title) {
    languageDictionary = { title: config.dict.signin.title };
  } else if (typeof config.dict === 'string') {
    language = config.dict;
  }
  var loginHint = config.extraParams.login_hint;
  var colors = config.colors || {};

  // Available Lock configuration options: https://auth0.com/docs/libraries/lock/v11/configuration
  lock = new Auth0Lock(config.clientID, config.auth0Domain, {
    container: 'hiw-login-container',
    auth: {
      redirectUrl: config.callbackURL,
      responseType: (config.internalOptions || {}).response_type ||
        (config.callbackOnLocationHash ? 'token' : 'code'),
      params: config.internalOptions
    },
    configurationBaseUrl: config.clientConfigurationBaseUrl,
    overrides: {
      __tenant: config.auth0Tenant,
      __token_issuer: config.authorizationServer.issuer
    },
    assetsUrl: config.assetsUrl,
    allowedConnections: connection ? [connection] : null,
    rememberLastLogin: !prompt,
    language: language,
    languageBaseUrl: config.languageBaseUrl,
    languageDictionary: languageDictionary,
    theme: {
      //logo:            'YOUR LOGO HERE',
      primaryColor: colors.primary ? colors.primary : 'green'
    },
    prefill: loginHint ? { email: loginHint, username: loginHint } : null,
    closable: false,
    defaultADUsernameFromEmailPrefix: false
  } as any);

  if (colors.page_background) {
    var css = '.auth0-lock.auth0-lock .auth0-lock-overlay { background: ' +
      colors.page_background +
      ' }';
    var style = document.createElement('style');

    style.appendChild(document.createTextNode(css));

    document.body.appendChild(style);
  }

}

export default function SignIn() {

  const [state, setState] = React.useState({
    sdk: 'auth0',
    auth0JsEmail: "",
    auth0JsPassword: ""
  });

  const didMount = useDidMount();

  React.useEffect(() => {
    if (didMount) {
      const config = (window as any).config
      initializeAuth0Instance(config)
      initializeLockInstance(config)
    }
  }, [didMount]);

  const handleAuth0JsSignIn = () => {
    if (state.sdk !== "auth0") { return }
    if (!webAuth) {
      console.log(`error: webAuth is not initialized`)
      return
    }
    webAuth.login({
      realm: (window as any).config.connection || "basic-spa-connection",
      username: state.auth0JsEmail,
      password: state.auth0JsPassword,
      // captcha: captcha.getValue()
    }, function (err) {
      console.log(err)
    });
  }

  const handleAuth0JsSignUp = () => {
    if (state.sdk !== "auth0") { return }
    if (!webAuth) {
      console.log(`error: webAuth is not initialized`)
      return
    }
    webAuth.redirect.signupAndLogin({
      connection: (window as any).config.connection || "basic-spa-connection",
      email: state.auth0JsEmail,
      password: state.auth0JsPassword,
      // captcha: captcha.getValue()
    }, function (err) {
      console.log(err)
    });
  }

  const handleSdkChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string,
  ) => {
    setState({
      ...state,
      sdk: newValue
    });
    if (lock) {
      if (newValue === "lock") {
        lock.show();
      } else {
        lock.hide()
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ToggleButtonGroup
            color="primary"
            value={state.sdk}
            exclusive
            onChange={handleSdkChange}
            aria-label="Platform"
          >
            <ToggleButton value="auth0">Auth0.js</ToggleButton>
            <ToggleButton value="lock">Lock.js</ToggleButton>
          </ToggleButtonGroup>
          <div id="hiw-login-container"></div>
          {
            state.sdk === "auth0" && (<Box component="form" noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoFocus
                value={state.auth0JsEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ ...state, auth0JsEmail: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={state.auth0JsPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ ...state, auth0JsPassword: e.target.value })}
              />

              <ButtonGroup variant="text" aria-label="text button group" fullWidth>
                <Button
                  onClick={handleAuth0JsSignIn}
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign In
                </Button>
                <Button
                  type="submit"
                  onClick={handleAuth0JsSignUp}
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign Up
                </Button>
              </ButtonGroup>
            </Box>)
          }
        </Box>
      </Container>
    </ThemeProvider>
  );
}