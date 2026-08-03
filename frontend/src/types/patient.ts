export interface PatientDemographics {
  ageDays: number;
  weightKg: number;
  gestationalAgeWeeks: number;
  feverActive: boolean;
}

export interface PatientPhenotype extends PatientDemographics {
  bsaM2: number;
  baselineCypActivity: number;
  baselineRenalFunction: number;
}
