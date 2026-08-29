import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { fetchReportingContext, ReportingContext, ScopeFilters } from './scopedOverview';

export interface ProcessHealthKpiCell {
  Actual_Value: number | null;
  Actual_Display: string | null;
  Target_Value: number | null;
  Target_Display: string | null;
  RAG: string | null;
  Data_Presence_Status: string | null;
}

export interface ProcessHealthMatrixRow {
  Account_ID: string;
  Account_Name: string;
  Vertical: string;
  QA_Leader: string;
  SLA: ProcessHealthKpiCell;
  BEST_QM: ProcessHealthKpiCell;
  EURA: ProcessHealthKpiCell;
  RNP_Format: ProcessHealthKpiCell;
  Open_Escalations: number;
  High_Critical_Escalations: number;
  Open_CQM: number;
  CQM_30_Plus: number;
}

export interface ProcessHealthMatrixData {
  Scope: {
    vertical: string | null;
    qaLeader: string | null;
    srDirector: string | null;
    accountId: string | null;
    site: string | null;
    lob: string | null;
    accountCount: number;
  };
  Reporting_Context: ReportingContext;
  Rows: ProcessHealthMatrixRow[];
}

export async function fetchProcessHealthMatrix(filters: ScopeFilters): Promise<ProcessHealthMatrixData> {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const conditions: string[] = [];
  const params: Record<string, string> = {};
  const types: Record<string, string> = {};

  if (filters.vertical && filters.vertical.trim() !== '') {
    conditions.push('m.Vertical = @vertical');
    params.vertical = filters.vertical.trim();
    types.vertical = 'STRING';
  }
  if (filters.qaLeader && filters.qaLeader.trim() !== '') {
    conditions.push('m.QA_Leader = @qaLeader');
    params.qaLeader = filters.qaLeader.trim();
    types.qaLeader = 'STRING';
  }
  if (filters.srDirector && filters.srDirector.trim() !== '') {
    conditions.push('m.Sr_Director = @srDirector');
    params.srDirector = filters.srDirector.trim();
    types.srDirector = 'STRING';
  }
  if (filters.accountId && filters.accountId.trim() !== '') {
    conditions.push('m.Account_ID = @accountId');
    params.accountId = filters.accountId.trim();
    types.accountId = 'STRING';
  }
  if (filters.site && filters.site.trim() !== '') {
    conditions.push('m.Site = @site');
    params.site = filters.site.trim();
    types.site = 'STRING';
  }
  if (filters.lob && filters.lob.trim() !== '') {
    conditions.push('m.LOB = @lob');
    params.lob = filters.lob.trim();
    types.lob = 'STRING';
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

  const query = `
    WITH rep_context AS (
      SELECT Latest_Closed_Month, FORMAT_DATE('%b-%y', Latest_Closed_Month) AS Official_Reporting_Month
      FROM \`${projectId}.${dataset}.vw_reporting_context\`
      LIMIT 1
    ),
    scoped_accounts AS (
      SELECT
        m.Account_ID,
        m.Account AS Account_Name,
        m.Vertical,
        m.QA_Leader,
        m.Sr_Director,
        m.Site,
        m.LOB
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${whereClause}
    ),
    acc_360 AS (
      SELECT
        a.Account_ID,
        a.Open_Escalation_Count,
        a.High_Critical_Escalation_Count,
        a.Open_CQM_Count,
        a.CQM_30_Plus_Count
      FROM \`${projectId}.${dataset}.vw_account_360\` a
      JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    ),
    kpi_scoped AS (
      SELECT
        k.Account_ID,
        k.Metric_ID,
        k.Actual_Value,
        k.Actual_Display,
        k.Target_Value,
        k.Target_Display,
        k.Effective_RAG AS RAG,
        k.Data_Presence_Status
      FROM \`${projectId}.${dataset}.vw_kpi_snapshot_official\` k
      JOIN scoped_accounts s ON k.Account_ID = s.Account_ID
      JOIN rep_context r ON k.Month = r.Latest_Closed_Month
      WHERE k.Metric_ID IN ('M002', 'M003', 'M004', 'M005')
    )
    SELECT
      s.Account_ID,
      s.Account_Name,
      s.Vertical,
      s.QA_Leader,
      COALESCE(a.Open_Escalation_Count, 0) AS Open_Escalations,
      COALESCE(a.High_Critical_Escalation_Count, 0) AS High_Critical_Escalations,
      COALESCE(a.Open_CQM_Count, 0) AS Open_CQM,
      COALESCE(a.CQM_30_Plus_Count, 0) AS CQM_30_Plus,
      
      -- M002 SLA
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.Actual_Value END) AS SLA_Actual_Value,
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.Actual_Display END) AS SLA_Actual_Display,
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.Target_Value END) AS SLA_Target_Value,
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.Target_Display END) AS SLA_Target_Display,
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.RAG END) AS SLA_RAG,
      MAX(CASE WHEN k.Metric_ID = 'M002' THEN k.Data_Presence_Status END) AS SLA_Data_Presence_Status,

      -- M005 BEST QM
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.Actual_Value END) AS BEST_QM_Actual_Value,
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.Actual_Display END) AS BEST_QM_Actual_Display,
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.Target_Value END) AS BEST_QM_Target_Value,
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.Target_Display END) AS BEST_QM_Target_Display,
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.RAG END) AS BEST_QM_RAG,
      MAX(CASE WHEN k.Metric_ID = 'M005' THEN k.Data_Presence_Status END) AS BEST_QM_Data_Presence_Status,

      -- M004 EURA
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.Actual_Value END) AS EURA_Actual_Value,
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.Actual_Display END) AS EURA_Actual_Display,
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.Target_Value END) AS EURA_Target_Value,
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.Target_Display END) AS EURA_Target_Display,
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.RAG END) AS EURA_RAG,
      MAX(CASE WHEN k.Metric_ID = 'M004' THEN k.Data_Presence_Status END) AS EURA_Data_Presence_Status,

      -- M003 RNP
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.Actual_Value END) AS RNP_Actual_Value,
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.Actual_Display END) AS RNP_Actual_Display,
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.Target_Value END) AS RNP_Target_Value,
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.Target_Display END) AS RNP_Target_Display,
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.RAG END) AS RNP_RAG,
      MAX(CASE WHEN k.Metric_ID = 'M003' THEN k.Data_Presence_Status END) AS RNP_Data_Presence_Status

    FROM scoped_accounts s
    LEFT JOIN acc_360 a ON s.Account_ID = a.Account_ID
    LEFT JOIN kpi_scoped k ON s.Account_ID = k.Account_ID
    GROUP BY
      s.Account_ID,
      s.Account_Name,
      s.Vertical,
      s.QA_Leader,
      a.Open_Escalation_Count,
      a.High_Critical_Escalation_Count,
      a.Open_CQM_Count,
      a.CQM_30_Plus_Count
    ORDER BY s.Account_Name ASC
  `;

  const [rawRows, reportingContext] = await Promise.all([
    bq.query({ query, params, types, location }).then(([r]) => r),
    fetchReportingContext(bq, projectId, dataset, location),
  ]);

  const rows: ProcessHealthMatrixRow[] = (rawRows || []).map((r) => {
    const serialized = serializeBigQueryValue(r) as Record<string, any>;
    return {
      Account_ID: serialized.Account_ID,
      Account_Name: serialized.Account_Name,
      Vertical: serialized.Vertical,
      QA_Leader: serialized.QA_Leader,
      SLA: {
        Actual_Value: serialized.SLA_Actual_Value ?? null,
        Actual_Display: serialized.SLA_Actual_Display ?? null,
        Target_Value: serialized.SLA_Target_Value ?? null,
        Target_Display: serialized.SLA_Target_Display ?? null,
        RAG: serialized.SLA_RAG ?? null,
        Data_Presence_Status: serialized.SLA_Data_Presence_Status ?? null,
      },
      BEST_QM: {
        Actual_Value: serialized.BEST_QM_Actual_Value ?? null,
        Actual_Display: serialized.BEST_QM_Actual_Display ?? null,
        Target_Value: serialized.BEST_QM_Target_Value ?? null,
        Target_Display: serialized.BEST_QM_Target_Display ?? null,
        RAG: serialized.BEST_QM_RAG ?? null,
        Data_Presence_Status: serialized.BEST_QM_Data_Presence_Status ?? null,
      },
      EURA: {
        Actual_Value: serialized.EURA_Actual_Value ?? null,
        Actual_Display: serialized.EURA_Actual_Display ?? null,
        Target_Value: serialized.EURA_Target_Value ?? null,
        Target_Display: serialized.EURA_Target_Display ?? null,
        RAG: serialized.EURA_RAG ?? null,
        Data_Presence_Status: serialized.EURA_Data_Presence_Status ?? null,
      },
      RNP_Format: {
        Actual_Value: serialized.RNP_Actual_Value ?? null,
        Actual_Display: serialized.RNP_Actual_Display ?? null,
        Target_Value: serialized.RNP_Target_Value ?? null,
        Target_Display: serialized.RNP_Target_Display ?? null,
        RAG: serialized.RNP_RAG ?? null,
        Data_Presence_Status: serialized.RNP_Data_Presence_Status ?? null,
      },
      Open_Escalations: Number(serialized.Open_Escalations) || 0,
      High_Critical_Escalations: Number(serialized.High_Critical_Escalations) || 0,
      Open_CQM: Number(serialized.Open_CQM) || 0,
      CQM_30_Plus: Number(serialized.CQM_30_Plus) || 0,
    };
  });

  return {
    Scope: {
      vertical: filters.vertical || null,
      qaLeader: filters.qaLeader || null,
      srDirector: filters.srDirector || null,
      accountId: filters.accountId || null,
      site: filters.site || null,
      lob: filters.lob || null,
      accountCount: rows.length,
    },
    Reporting_Context: reportingContext,
    Rows: rows,
  };
}
