import { Provider } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { PANCAKE_V3_SUBGRAPH_URL, V3_SUBGRAPH_CLIENT } from '../pcs.constant';

export const v3SubgraphClientProvider: Provider<GraphQLClient> = {
  provide: V3_SUBGRAPH_CLIENT,
  useFactory: () => {
    return new GraphQLClient(PANCAKE_V3_SUBGRAPH_URL);
  },
};
