export type RoleKind =
  | 'ceo'
  | 'coo'
  | 'cto'
  | 'executive_other'
  | 'department_head'
  | 'manager'
  | 'employee';

type ClassifyInput = {
  job_title?: string | null;
  roleName?: string | null;
  roleLevel?: string | null;
  isExecutive?: boolean | null;
};

function hasKeyword(value: string | null | undefined, keyword: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export function classifyRoleKind(input: ClassifyInput): RoleKind {
  const { job_title, roleName, roleLevel, isExecutive } = input ?? {};

  if (hasKeyword(job_title, 'chief executive') || hasKeyword(job_title, 'ceo')) return 'ceo';
  if (hasKeyword(job_title, 'chief operating') || hasKeyword(job_title, 'coo')) return 'coo';
  if (hasKeyword(job_title, 'chief technology') || hasKeyword(job_title, 'cto')) return 'cto';

  if (hasKeyword(roleName, 'chief executive') || hasKeyword(roleName, 'ceo')) return 'ceo';
  if (hasKeyword(roleName, 'chief operating') || hasKeyword(roleName, 'coo')) return 'coo';
  if (hasKeyword(roleName, 'chief technology') || hasKeyword(roleName, 'cto')) return 'cto';

  if (roleLevel === 'executive' && isExecutive === true) return 'executive_other';
  if (roleLevel === 'department_head') return 'department_head';
  if (roleLevel === 'manager') return 'manager';

  return 'employee';
}
