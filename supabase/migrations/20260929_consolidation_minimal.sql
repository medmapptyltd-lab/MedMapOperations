-- Phase 8 Final Consolidation: cleanup only.
-- T2a column probe confirmed all 13 lifecycle tables have the columns required
-- for 8 user flows (employees, departments, teams, roles, tasks, tickets,
-- customer_cases, meetings, deadlines, kpi_targets, kpi_results, revenue,
-- expenses).  No schema additions required.

DROP TABLE IF EXISTS public._phase7_audit_out;
