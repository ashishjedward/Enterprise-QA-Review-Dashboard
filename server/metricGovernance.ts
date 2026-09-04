/**
 * Authoritative Metric & RAG Governance Registry
 * Production Integrity Pass 2: Single Source of Truth for Metric Targets and RAG Evaluation
 */

export type TargetBasis = 
  | 'FIXED_METRIC_TARGET' 
  | 'ACCOUNT_TARGET' 
  | 'CATEGORICAL' 
  | 'NOT_APPLICABLE';

export type MetricDirection = 'Higher' | 'Lower';

export type MetricScale = 'DECIMAL_PERCENTAGE' | 'ZERO_TO_100' | 'ONE_TO_FIVE';

export type RAGColor = 'Green' | 'Amber' | 'Red';

export interface StructuredThresholdRule {
  greenFloor?: number;       // For Higher-is-better: actual >= greenFloor
  greenCeiling?: number;     // For Lower-is-better: actual <= greenCeiling
  amberFloor?: number;       // For Higher-is-better: actual >= amberFloor AND actual < greenFloor
  amberCeiling?: number;     // For Lower-is-better: actual > greenCeiling AND actual <= amberCeiling
  redCeiling?: number;       // For Higher-is-better: actual < redCeiling (equals amberFloor)
  redFloor?: number;         // For Lower-is-better: actual > redFloor (equals amberCeiling)
  targetOffsetPp?: number;   // For ACCOUNT_TARGET: Amber threshold is target - targetOffsetPp
}

export interface MetricGovernanceDefinition {
  Metric_ID: string;
  Metric_Name: string;
  Category: 'Enterprise' | 'Process Health' | 'Hygiene' | 'QA Team';
  Category_Sort_Order: number;
  Display_Order: number;
  Unit: '%' | 'Score' | '1-5';
  Metric_Scale: MetricScale;
  Direction: MetricDirection;
  Is_Higher_Better: boolean;
  Target_Basis: TargetBasis;
  Default_Target: number;
  Target_Display: string;
  Has_Account_Target: boolean;
  Semantic_View: string;
  
  // Structured non-overlapping boundary definitions
  Thresholds: StructuredThresholdRule;
  
  // Normalized rule descriptions (no gaps, no overlaps, explicit boundaries)
  Green_Rule_Text: string;
  Amber_Rule_Text: string;
  Red_Rule_Text: string;
  
  // Executable evaluation
  evaluateRAG: (actualValue: number | null | undefined, targetValue?: number | null) => RAGColor | null;
}

export const METRIC_GOVERNANCE: Record<string, MetricGovernanceDefinition> = {
  M001: {
    Metric_ID: 'M001',
    Metric_Name: 'Client Sentiment',
    Category: 'Enterprise',
    Category_Sort_Order: 1,
    Display_Order: 1,
    Unit: '1-5',
    Metric_Scale: 'ONE_TO_FIVE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 4.2,
    Target_Display: '4.2',
    Has_Account_Target: false,
    Semantic_View: 'vw_client_sentiment',
    Thresholds: {
      greenFloor: 4.2,
      amberFloor: 3.6,
      redCeiling: 3.6,
    },
    Green_Rule_Text: 'Score >= 4.2 (Target)',
    Amber_Rule_Text: 'Score >= 3.6 and Score < 4.2',
    Red_Rule_Text: 'Score < 3.6',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 4.2) return 'Green';
      if (val >= 3.6) return 'Amber';
      return 'Red';
    },
  },

  M002: {
    Metric_ID: 'M002',
    Metric_Name: 'SLA Achievement',
    Category: 'Process Health',
    Category_Sort_Order: 2,
    Display_Order: 2,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'ACCOUNT_TARGET',
    Default_Target: 0.95,
    Target_Display: '95%',
    Has_Account_Target: true, // 193 accounts have contractual targets in Account_Master.SLA_Target
    Semantic_View: 'vw_sla_achievement',
    Thresholds: {
      targetOffsetPp: 0.05, // 5 percentage points
    },
    Green_Rule_Text: 'Actual >= Target',
    Amber_Rule_Text: 'Actual >= Target - 0.05 (within 5 percentage points)',
    Red_Rule_Text: 'Actual < Target - 0.05 (more than 5 percentage points below target)',
    evaluateRAG: (val, target) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      const effectiveTarget = target != null && !isNaN(target) ? target : 0.95;
      if (val >= effectiveTarget) return 'Green';
      if (val >= effectiveTarget - 0.05) return 'Amber';
      return 'Red';
    },
  },

  M003: {
    Metric_ID: 'M003',
    Metric_Name: 'RNP Format',
    Category: 'Process Health',
    Category_Sort_Order: 2,
    Display_Order: 3,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.95,
    Target_Display: '95%',
    Has_Account_Target: false,
    Semantic_View: 'vw_rnp_format',
    Thresholds: {
      greenFloor: 0.95,
      amberFloor: 0.90,
      redCeiling: 0.90,
    },
    Green_Rule_Text: 'Compliance >= 95% (0.95)',
    Amber_Rule_Text: 'Compliance >= 90% (0.90) and Compliance < 95% (0.95)',
    Red_Rule_Text: 'Compliance < 90% (0.90)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.95) return 'Green';
      if (val >= 0.90) return 'Amber';
      return 'Red';
    },
  },

  M004: {
    Metric_ID: 'M004',
    Metric_Name: 'EURA',
    Category: 'Process Health',
    Category_Sort_Order: 2,
    Display_Order: 4,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.95,
    Target_Display: '95%',
    Has_Account_Target: false,
    Semantic_View: 'vw_eura',
    Thresholds: {
      greenFloor: 0.95,
      amberFloor: 0.90,
      redCeiling: 0.90,
    },
    Green_Rule_Text: 'Achievement >= 95% (0.95)',
    Amber_Rule_Text: 'Achievement >= 90% (0.90) and Achievement < 95% (0.95)',
    Red_Rule_Text: 'Achievement < 90% (0.90)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.95) return 'Green';
      if (val >= 0.90) return 'Amber';
      return 'Red';
    },
  },

  M005: {
    Metric_ID: 'M005',
    Metric_Name: 'BEST QM',
    Category: 'Process Health',
    Category_Sort_Order: 2,
    Display_Order: 5,
    Unit: 'Score',
    Metric_Scale: 'ZERO_TO_100',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 90.0,
    Target_Display: '90',
    Has_Account_Target: false,
    Semantic_View: 'vw_best_qm',
    Thresholds: {
      greenFloor: 90.0,
      amberFloor: 85.0,
      redCeiling: 85.0,
    },
    Green_Rule_Text: 'Score >= 90.0',
    Amber_Rule_Text: 'Score >= 85.0 and Score < 90.0',
    Red_Rule_Text: 'Score < 85.0',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 90.0) return 'Green';
      if (val >= 85.0) return 'Amber';
      return 'Red';
    },
  },

  M006: {
    Metric_ID: 'M006',
    Metric_Name: 'Audit & Feedback',
    Category: 'Hygiene',
    Category_Sort_Order: 3,
    Display_Order: 6,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.95,
    Target_Display: '95%',
    Has_Account_Target: false,
    Semantic_View: 'vw_audit_feedback',
    Thresholds: {
      greenFloor: 0.95,
      amberFloor: 0.90,
      redCeiling: 0.90,
    },
    Green_Rule_Text: 'Achievement >= 95% (0.95)',
    Amber_Rule_Text: 'Achievement >= 90% (0.90) and Achievement < 95% (0.95)',
    Red_Rule_Text: 'Achievement < 90% (0.90)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.95) return 'Green';
      if (val >= 0.90) return 'Amber';
      return 'Red';
    },
  },

  M007: {
    Metric_ID: 'M007',
    Metric_Name: 'Hygiene Audits',
    Category: 'Hygiene',
    Category_Sort_Order: 3,
    Display_Order: 7,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.96,
    Target_Display: '96%',
    Has_Account_Target: false,
    Semantic_View: 'vw_hygiene_audits',
    Thresholds: {
      greenFloor: 0.96,
      amberFloor: 0.90,
      redCeiling: 0.90,
    },
    Green_Rule_Text: 'Accuracy >= 96% (0.96)',
    Amber_Rule_Text: 'Accuracy >= 90% (0.90) and Accuracy < 96% (0.96)',
    Red_Rule_Text: 'Accuracy < 90% (0.90)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.96) return 'Green';
      if (val >= 0.90) return 'Amber';
      return 'Red';
    },
  },

  M008: {
    Metric_ID: 'M008',
    Metric_Name: 'Calibration',
    Category: 'Hygiene',
    Category_Sort_Order: 3,
    Display_Order: 8,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.95,
    Target_Display: '95%',
    Has_Account_Target: false,
    Semantic_View: 'vw_calibration',
    Thresholds: {
      greenFloor: 0.95,
      amberFloor: 0.90,
      redCeiling: 0.90,
    },
    Green_Rule_Text: 'Attendance >= 95% (0.95)',
    Amber_Rule_Text: 'Attendance >= 90% (0.90) and Attendance < 95% (0.95)',
    Red_Rule_Text: 'Attendance < 90% (0.90)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.95) return 'Green';
      if (val >= 0.90) return 'Amber';
      return 'Red';
    },
  },

  M009: {
    Metric_ID: 'M009',
    Metric_Name: 'ATA Internal',
    Category: 'Hygiene',
    Category_Sort_Order: 3,
    Display_Order: 9,
    Unit: 'Score',
    Metric_Scale: 'ZERO_TO_100',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 95.0,
    Target_Display: '95',
    Has_Account_Target: false,
    Semantic_View: 'vw_ata_internal',
    Thresholds: {
      greenFloor: 95.0,
      amberFloor: 90.0,
      redCeiling: 90.0,
    },
    Green_Rule_Text: 'Score >= 95.0',
    Amber_Rule_Text: 'Score >= 90.0 and Score < 95.0',
    Red_Rule_Text: 'Score < 90.0',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 95.0) return 'Green';
      if (val >= 90.0) return 'Amber';
      return 'Red';
    },
  },

  M010: {
    Metric_ID: 'M010',
    Metric_Name: 'ATA External',
    Category: 'Hygiene',
    Category_Sort_Order: 3,
    Display_Order: 10,
    Unit: 'Score',
    Metric_Scale: 'ZERO_TO_100',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 94.0,
    Target_Display: '94',
    Has_Account_Target: false,
    Semantic_View: 'vw_ata_external_msa',
    Thresholds: {
      greenFloor: 94.0,
      amberFloor: 90.0,
      redCeiling: 90.0,
    },
    Green_Rule_Text: 'Score >= 94.0',
    Amber_Rule_Text: 'Score >= 90.0 and Score < 94.0',
    Red_Rule_Text: 'Score < 90.0',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 94.0) return 'Green';
      if (val >= 90.0) return 'Amber';
      return 'Red';
    },
  },

  M011: {
    Metric_ID: 'M011',
    Metric_Name: 'QA Utilization',
    Category: 'QA Team',
    Category_Sort_Order: 4,
    Display_Order: 11,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Higher',
    Is_Higher_Better: true,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.90,
    Target_Display: '90%',
    Has_Account_Target: false,
    Semantic_View: 'vw_qa_utilization',
    Thresholds: {
      greenFloor: 0.90,
      amberFloor: 0.85,
      redCeiling: 0.85,
    },
    Green_Rule_Text: 'Utilization >= 90% (0.90)',
    Amber_Rule_Text: 'Utilization >= 85% (0.85) and Utilization < 90% (0.90)',
    Red_Rule_Text: 'Utilization < 85% (0.85)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val >= 0.90) return 'Green';
      if (val >= 0.85) return 'Amber';
      return 'Red';
    },
  },

  M012: {
    Metric_ID: 'M012',
    Metric_Name: 'QA Attrition',
    Category: 'QA Team',
    Category_Sort_Order: 4,
    Display_Order: 12,
    Unit: '%',
    Metric_Scale: 'DECIMAL_PERCENTAGE',
    Direction: 'Lower',
    Is_Higher_Better: false,
    Target_Basis: 'FIXED_METRIC_TARGET',
    Default_Target: 0.10,
    Target_Display: '10%',
    Has_Account_Target: false,
    Semantic_View: 'vw_qa_attrition_rag',
    Thresholds: {
      greenCeiling: 0.10,
      amberCeiling: 0.15,
      redFloor: 0.15,
    },
    Green_Rule_Text: 'Annualized Attrition <= 10% (0.10)',
    Amber_Rule_Text: 'Annualized Attrition > 10% (0.10) and Annualized Attrition <= 15% (0.15)',
    Red_Rule_Text: 'Annualized Attrition > 15% (0.15)',
    evaluateRAG: (val) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      if (val <= 0.10) return 'Green';
      if (val <= 0.15) return 'Amber';
      return 'Red';
    },
  },
};

/**
 * Returns the normalized governance definition for a given Metric_ID
 */
export function getMetricGovernance(metricId: string): MetricGovernanceDefinition | undefined {
  return METRIC_GOVERNANCE[metricId];
}

/**
 * Evaluates RAG for any metric using the normalized authoritative rule
 */
export function evaluateMetricRAG(
  metricId: string,
  actualValue: number | null | undefined,
  targetValue?: number | null
): RAGColor | null {
  const gov = METRIC_GOVERNANCE[metricId];
  if (!gov) return null;
  return gov.evaluateRAG(actualValue, targetValue);
}
