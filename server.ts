import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './server/bigquery';
import { fetchScopedDashboardOverview } from './server/scopedOverview';
import { fetchAccount360 } from './server/account360';
import { fetchProcessHealthMatrix } from './server/processHealth';
import { fetchSlaDiagnostic } from './server/slaDiagnostic';
import { fetchBestQmDiagnostic } from './server/bestQmDiagnostic';
import { fetchHygieneDiagnostic } from './server/hygieneDiagnostic';
import { fetchQaTeamDiagnostic } from './server/qaTeamDiagnostic';
import { fetchActionsDiagnostic } from './server/actionsDiagnostic';
import { fetchValueAddsDiagnostic } from './server/valueAddsDiagnostic';

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // ----------------------------------------------------
  // ENDPOINT 1: GET /api/health
  // Proves actual BigQuery connectivity via SELECT 1 AS connection_test
  // ----------------------------------------------------
  app.get('/api/health', async (_req, res) => {
    try {
      const bq = getBigQueryClient();
      const { location } = getBigQueryConfig();

      const [rows] = await bq.query({
        query: 'SELECT 1 AS connection_test',
        location,
      });

      if (rows && rows.length > 0) {
        return res.status(200).json({
          status: 'ok',
          bigquery: 'connected',
        });
      }

      return res.status(502).json({
        status: 'error',
        error: {
          message: 'BigQuery returned empty health check result',
        },
      });
    } catch (err: unknown) {
      console.error('BigQuery health check failed:', (err as Error)?.message || err);
      return res.status(500).json({
        status: 'error',
        error: {
          message: 'Unable to connect to BigQuery',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 2: GET /api/dashboard/overview
  // Queries `qa-dashboard-prototype.qa_proto_full.vw_dashboard_overview`
  // Expected to return exactly ONE record.
  // ----------------------------------------------------
  app.get('/api/dashboard/overview', async (_req, res) => {
    try {
      const bq = getBigQueryClient();
      const { projectId, dataset, location } = getBigQueryConfig();

      const query = `SELECT * FROM \`${projectId}.${dataset}.vw_dashboard_overview\` LIMIT 1`;
      const [rows] = await bq.query({
        query,
        location,
      });

      if (!rows || rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Dashboard overview record not found',
          },
        });
      }

      const serializedRecord = serializeBigQueryValue(rows[0]);
      return res.status(200).json({
        data: serializedRecord,
      });
    } catch (err: unknown) {
      console.error('Failed to query vw_dashboard_overview:', (err as Error)?.message || err);
      return res.status(500).json({
        error: {
          message: 'Unable to load dashboard data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 2B: GET /api/dashboard/scoped-overview
  // Supports optional query parameters: vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/dashboard/scoped-overview', async (req, res) => {
    try {
      const filters = {
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchScopedDashboardOverview(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      console.error('Failed to query scoped overview:', (err as Error)?.message || err);
      return res.status(500).json({
        error: {
          message: 'Unable to load scoped dashboard data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 3: GET /api/meta/accounts
  // Queries `qa-dashboard-prototype.qa_proto_full.vw_account_master`
  // Return only specified fields ordered by Account.
  // ----------------------------------------------------
  app.get('/api/meta/accounts', async (_req, res) => {
    try {
      const bq = getBigQueryClient();
      const { projectId, dataset, location } = getBigQueryConfig();

      const query = `
        SELECT
          Account_ID,
          Account,
          BU,
          Vertical,
          QA_VP,
          Sr_Director,
          QA_Director,
          QA_Leader,
          Site,
          LOB,
          Process
        FROM \`${projectId}.${dataset}.vw_account_master\`
        ORDER BY Account
      `;

      const [rows] = await bq.query({
        query,
        location,
      });

      const serializedRows = (rows || []).map((row) => serializeBigQueryValue(row));

      return res.status(200).json({
        data: serializedRows,
      });
    } catch (err: unknown) {
      console.error('Failed to query vw_account_master:', (err as Error)?.message || err);
      return res.status(500).json({
        error: {
          message: 'Unable to load accounts metadata',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 4: GET /api/accounts/:accountId/360
  // Live Account 360 semantic endpoint
  // ----------------------------------------------------
  app.get('/api/accounts/:accountId/360', async (req, res) => {
    try {
      const accountId = req.params.accountId;
      if (!accountId || typeof accountId !== 'string') {
        return res.status(400).json({
          error: 'Account ID is required',
        });
      }

      const data = await fetchAccount360(accountId);
      if (!data) {
        return res.status(404).json({
          error: 'Account not found',
        });
      }

      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      console.error(`Failed to fetch Account 360 for ${req.params.accountId}:`, (err as Error)?.message || err);
      return res.status(500).json({
        error: 'Unable to load account 360 data',
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 5: GET /api/process-health/matrix
  // Returns row-level Process Health telemetry across scoped accounts
  // ----------------------------------------------------
  app.get('/api/process-health/matrix', async (req, res) => {
    try {
      const filters = {
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchProcessHealthMatrix(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      console.error('Failed to query process health matrix:', (err as Error)?.message || err);
      return res.status(500).json({
        error: {
          message: 'Unable to load process health matrix',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 6: GET /api/sla-diagnostic
  // Returns SLA Diagnostic headline, trend, comparisons, root causes, escalations, and accounts
  // ----------------------------------------------------
  app.get('/api/sla-diagnostic', async (req, res) => {
    try {
      const timePeriod = typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined;
      const filters = {
        timePeriod,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchSlaDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load SLA diagnostic data';
      if (errMsg.includes('Invalid timePeriod')) {
        return res.status(400).json({
          error: {
            message: errMsg,
          },
        });
      }
      console.error('Failed to query SLA diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load SLA diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 6: GET /api/best-qm-diagnostic
  // Supports optional query parameters: timePeriod, vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/best-qm-diagnostic', async (req, res) => {
    try {
      const filters = {
        timePeriod: typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchBestQmDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load BEST QM diagnostic data';
      if (errMsg.includes('Invalid timePeriod')) {
        return res.status(400).json({
          error: {
            message: errMsg,
          },
        });
      }
      console.error('Failed to query BEST QM diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load BEST QM diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 7: GET /api/hygiene-diagnostic
  // Supports optional query parameters: timePeriod, vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/hygiene-diagnostic', async (req, res) => {
    try {
      const filters = {
        timePeriod: typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchHygieneDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load Hygiene diagnostic data';
      if (errMsg.includes('Invalid timePeriod')) {
        return res.status(400).json({
          error: {
            message: errMsg,
          },
        });
      }
      console.error('Failed to query Hygiene diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load Hygiene diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 8: GET /api/qa-team-diagnostic
  // Supports optional query parameters: timePeriod, vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/qa-team-diagnostic', async (req, res) => {
    try {
      const filters = {
        timePeriod: typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchQaTeamDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load QA Team diagnostic data';
      if (errMsg.includes('Invalid timePeriod')) {
        return res.status(400).json({
          error: {
            message: errMsg,
          },
        });
      }
      console.error('Failed to query QA Team diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load QA Team diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 9: GET /api/actions-diagnostic
  // Supports optional query parameters: timePeriod, vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/actions-diagnostic', async (req, res) => {
    try {
      const filters = {
        timePeriod: typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchActionsDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load Actions diagnostic data';
      if (errMsg.includes('Invalid timePeriod')) {
        return res.status(400).json({
          error: {
            message: errMsg,
          },
        });
      }
      console.error('Failed to query Actions diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load Actions diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // ENDPOINT 10: GET /api/value-adds-diagnostic
  // Supports optional query parameters: timePeriod, vertical, qaLeader, srDirector, accountId, site, lob
  // Fully parameterized queries against BigQuery semantic views
  // ----------------------------------------------------
  app.get('/api/value-adds-diagnostic', async (req, res) => {
    try {
      const timePeriodQuery = typeof req.query.timePeriod === 'string' ? req.query.timePeriod : undefined;
      const validTimePeriods = ['3M', '6M', 'YTD', '12M'];
      if (timePeriodQuery && !validTimePeriods.includes(timePeriodQuery)) {
        return res.status(400).json({
          error: {
            message: `Invalid timePeriod: ${timePeriodQuery}. Allowed values: 3M, 6M, YTD, 12M`,
          },
        });
      }

      const filters = {
        timePeriod: timePeriodQuery,
        vertical: typeof req.query.vertical === 'string' ? req.query.vertical : undefined,
        qaLeader: typeof req.query.qaLeader === 'string' ? req.query.qaLeader : undefined,
        srDirector: typeof req.query.srDirector === 'string' ? req.query.srDirector : undefined,
        accountId: typeof req.query.accountId === 'string' ? req.query.accountId : undefined,
        site: typeof req.query.site === 'string' ? req.query.site : undefined,
        lob: typeof req.query.lob === 'string' ? req.query.lob : undefined,
      };

      const data = await fetchValueAddsDiagnostic(filters);
      return res.status(200).json({
        data,
      });
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Unable to load Value-adds diagnostic data';
      console.error('Failed to query Value-adds diagnostic:', errMsg);
      return res.status(500).json({
        error: {
          message: 'Unable to load Value-adds diagnostic data',
        },
      });
    }
  });

  // ----------------------------------------------------
  // Vite Middleware / Static Serving
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
