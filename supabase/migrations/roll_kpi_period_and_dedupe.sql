-- Roll the open KPI period forward so it covers the current date.
-- The seeded "Current Month" period (2026-09-01..2026-09-30) had already
-- elapsed, which made the KPI register render no rows for any viewer.
UPDATE public.kpi_periods
SET start_date = date_trunc('month', CURRENT_DATE)::date,
    end_date   = (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date
WHERE lower(status) IN ('open', 'current', 'active')
  AND NOT (CURRENT_DATE BETWEEN start_date AND end_date);

-- Repoint any result that references a duplicate target at the surviving row.
UPDATE public.kpi_results r
SET target_id = keep.id
FROM public.kpi_targets dup
JOIN LATERAL (
  SELECT k.id
  FROM public.kpi_targets k
  WHERE k.kpi_id = dup.kpi_id
    AND k.period_id = dup.period_id
    AND k.target_value IS NOT DISTINCT FROM dup.target_value
  ORDER BY k.ctid
  LIMIT 1
) keep ON true
WHERE r.target_id = dup.id
  AND dup.id <> keep.id;

-- Remove duplicate KPI targets (identical kpi/period/target value).
DELETE FROM public.kpi_targets t
WHERE EXISTS (
  SELECT 1
  FROM public.kpi_targets k
  WHERE k.kpi_id = t.kpi_id
    AND k.period_id = t.period_id
    AND k.target_value IS NOT DISTINCT FROM t.target_value
    AND k.ctid < t.ctid
);

-- Remove duplicate KPI results (identical kpi/period/actual value).
DELETE FROM public.kpi_results r
WHERE EXISTS (
  SELECT 1
  FROM public.kpi_results k
  WHERE k.kpi_id = r.kpi_id
    AND k.period_id = r.period_id
    AND k.actual_value IS NOT DISTINCT FROM r.actual_value
    AND k.ctid < r.ctid
);
