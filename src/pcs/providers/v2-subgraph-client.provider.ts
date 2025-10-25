import { Provider } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { PANCAKE_V2_SUBGRAPH_URL, V2_SUBGRAPH_CLIENT } from '../pcs.constant';

export const v2SubgraphClientProvider: Provider<GraphQLClient> = {
  provide: V2_SUBGRAPH_CLIENT,
  useFactory: () => {
    return new GraphQLClient(PANCAKE_V2_SUBGRAPH_URL);
  },
};
