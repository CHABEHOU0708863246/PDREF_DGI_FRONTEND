export interface WorkflowFeatureFlag {
  key: string;
  enabled: boolean;
}

export interface WorkflowStep {
  code: string;
  name: string;
  kind: string;
  orderNumber: number;
  delayParameterKey: string | null;
  roleCodes: string[];
  prerequisiteStepCodes: string[];
  groupCode: string | null;
  isTerminal: boolean;
  isEarlyExit: boolean;
}

export interface WorkflowJoin {
  code: string;
  groupCode: string;
  branchStepCodes: string[];
  nextStepCode: string;
  nonFavorableStepCode: string;
  stopAtFirstParameterKey: string;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  versionDef: number;
  status: 'BROUILLON' | 'ACTIVE' | 'HISTORIQUE';
  name: string;
  description: string | null;
  sourceRef: string | null;
  provisional: boolean;
  featureFlag: WorkflowFeatureFlag;
  steps: WorkflowStep[];
  joins: WorkflowJoin[];
  createdAt: string;
  updatedAt: string | null;
  version: number;
}
