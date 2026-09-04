import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

export const indexEmail = async (document: any) => {
  try {
    await client.index({
      index: 'emails',
      document,
    });
  } catch (error) {
    console.error('Elasticsearch indexing failed:', error);
  }
};

export const searchEmails = async (query: string) => {
  try {
    const result = await client.search({
      index: 'emails',
      query: {
        multi_match: {
          query,
          fields: ['subject', 'body', 'receiver']
        }
      }
    });
    return result.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Elasticsearch search failed:', error);
    return [];
  }
};
