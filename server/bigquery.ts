import { BigQuery } from '@google-cloud/bigquery';

const projectId = process.env.BIGQUERY_PROJECT_ID || 'qa-dashboard-prototype';
const dataset = process.env.BIGQUERY_DATASET || 'qa_proto_full';
const location = process.env.BIGQUERY_LOCATION || 'asia-south2';

let bqClientInstance: BigQuery | null = null;

export function getBigQueryClient(): BigQuery {
  if (bqClientInstance) {
    return bqClientInstance;
  }

  const saJson = process.env.BIGQUERY_SERVICE_ACCOUNT_JSON;

  if (saJson && saJson.trim().length > 0) {
    try {
      const credentials = JSON.parse(saJson);
      const effectiveProjectId = projectId || credentials.project_id;
      bqClientInstance = new BigQuery({
        projectId: effectiveProjectId,
        credentials,
        location,
      });
    } catch (err) {
      console.error('Failed to parse BIGQUERY_SERVICE_ACCOUNT_JSON. Falling back to ADC.');
      bqClientInstance = new BigQuery({
        projectId,
        location,
      });
    }
  } else {
    bqClientInstance = new BigQuery({
      projectId,
      location,
    });
  }

  return bqClientInstance;
}

export function getBigQueryConfig() {
  return {
    projectId: process.env.BIGQUERY_PROJECT_ID || 'qa-dashboard-prototype',
    dataset: process.env.BIGQUERY_DATASET || 'qa_proto_full',
    location: process.env.BIGQUERY_LOCATION || 'asia-south2',
  };
}

/**
 * Recursively converts BigQuery custom object representations (e.g. BigQueryDate,
 * BigQueryTimestamp, BigNumber, BigInt, custom objects with .value property)
 * into standard JSON primitives (string, number, boolean, null, array, plain object).
 */
export function serializeBigQueryValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigQueryValue(item));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Handle BigQueryDate / BigQueryTimestamp / BigQueryDatetime / BigNumber ({ value: ... })
    if ('value' in obj && Object.keys(obj).length === 1 && typeof obj.value === 'string') {
      // Check if it's a numeric string that fits in safe number
      const num = Number(obj.value);
      if (!isNaN(num) && obj.value.trim() !== '' && !obj.value.includes('-') && !obj.value.includes(':')) {
        return num;
      }
      return obj.value;
    }

    // Handle bignumber.js / decimal instances
    if (typeof (obj as { toNumber?: () => number }).toNumber === 'function') {
      try {
        return (obj as { toNumber: () => number }).toNumber();
      } catch {
        return String(value);
      }
    }

    if (typeof (obj as { toJSON?: () => unknown }).toJSON === 'function') {
      return (obj as { toJSON: () => unknown }).toJSON();
    }

    const plainObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      plainObj[k] = serializeBigQueryValue(v);
    }
    return plainObj;
  }

  return String(value);
}
