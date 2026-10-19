-- RLS policies for kpi_targets and kpi_results.
-- Both tables have RLS enabled but no policies, which denies every authenticated
-- user. Scope is derived from the owning kpi's organization, since neither table
-- carries an organization_id column of its own.

-- kpi_targets -----------------------------------------------------------------
DROP POLICY IF EXISTS kpi_targets_org_select ON public.kpi_targets;
CREATE POLICY kpi_targets_org_select ON public.kpi_targets
  FOR SELECT TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_targets_org_insert ON public.kpi_targets;
CREATE POLICY kpi_targets_org_insert ON public.kpi_targets
  FOR INSERT TO authenticated
  WITH CHECK (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_targets_org_update ON public.kpi_targets;
CREATE POLICY kpi_targets_org_update ON public.kpi_targets
  FOR UPDATE TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  )
  WITH CHECK (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_targets_org_delete ON public.kpi_targets;
CREATE POLICY kpi_targets_org_delete ON public.kpi_targets
  FOR DELETE TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

-- kpi_results -----------------------------------------------------------------
DROP POLICY IF EXISTS kpi_results_org_select ON public.kpi_results;
CREATE POLICY kpi_results_org_select ON public.kpi_results
  FOR SELECT TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_results_org_insert ON public.kpi_results;
CREATE POLICY kpi_results_org_insert ON public.kpi_results
  FOR INSERT TO authenticated
  WITH CHECK (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_results_org_update ON public.kpi_results;
CREATE POLICY kpi_results_org_update ON public.kpi_results
  FOR UPDATE TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  )
  WITH CHECK (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );

DROP POLICY IF EXISTS kpi_results_org_delete ON public.kpi_results;
CREATE POLICY kpi_results_org_delete ON public.kpi_results
  FOR DELETE TO authenticated
  USING (
    kpi_id IN (
      SELECT k.id FROM public.kpis k
      WHERE public.user_belongs_to_organization(k.organization_id)
    )
  );
