import { AWSAppSyncClient, createAppSyncLink } from "aws-appsync";
import fetch from "node-fetch";
import { ApolloLink } from "apollo-link";

let apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch;
}

function create(initialState, appsyncConfig, stateLink) {
  const client = new AWSAppSyncClient(
    {
      ...appsyncConfig,
      disableOffline: true,
    },
    {
      link: ApolloLink.from([
        stateLink,
        createAppSyncLink({
          url: appsyncConfig.url,
          region: appsyncConfig.region,
          auth: appsyncConfig.auth,
          // complexObjectsCredentials: () => Auth.currentCredentials(),
        }),
      ]),
      ssrMode: true,
    },
  );

  if (initialState) {
    client.cache.restore(initialState);
  }

  return client;
}

export default function initApollo(initialState, appsyncConfig, stateLink) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState, appsyncConfig, stateLink);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, appsyncConfig, stateLink);
  }

  return apolloClient;
}
