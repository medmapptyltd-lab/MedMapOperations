-- RLS write policies for the doctor pipeline and ambassador management.
-- These tables have RLS enabled. Without policies every authenticated user is
-- denied, so the new doctor pipeline and ambassador management features cannot
-- read or write. Access is scoped to the authenticated user's organisation where
-- the table carries organization_id, and through the owning doctor otherwise.

-- ============================================================
-- doctors (carries organization_id)
-- ============================================================
DROP POLICY IF EXISTS doctors_org_select ON public.doctors;
CREATE POLICY doctors_org_select ON public.doctors
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctors_org_insert ON public.doctors;
CREATE POLICY doctors_org_insert ON public.doctors
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctors_org_update ON public.doctors;
CREATE POLICY doctors_org_update ON public.doctors
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctors_org_delete ON public.doctors;
CREATE POLICY doctors_org_delete ON public.doctors
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- doctor_acquisition (no organization_id; scope through the doctor)
-- ============================================================
DROP POLICY IF EXISTS doctor_acquisition_org_select ON public.doctor_acquisition;
CREATE POLICY doctor_acquisition_org_select ON public.doctor_acquisition
  FOR SELECT TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS doctor_acquisition_org_insert ON public.doctor_acquisition;
CREATE POLICY doctor_acquisition_org_insert ON public.doctor_acquisition
  FOR INSERT TO authenticated
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS doctor_acquisition_org_update ON public.doctor_acquisition;
CREATE POLICY doctor_acquisition_org_update ON public.doctor_acquisition
  FOR UPDATE TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS doctor_acquisition_org_delete ON public.doctor_acquisition;
CREATE POLICY doctor_acquisition_org_delete ON public.doctor_acquisition
  FOR DELETE TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- doctor_contact_attempts (carries organization_id)
-- ============================================================
DROP POLICY IF EXISTS doctor_contact_attempts_org_select ON public.doctor_contact_attempts;
CREATE POLICY doctor_contact_attempts_org_select ON public.doctor_contact_attempts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctor_contact_attempts_org_insert ON public.doctor_contact_attempts;
CREATE POLICY doctor_contact_attempts_org_insert ON public.doctor_contact_attempts
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctor_contact_attempts_org_update ON public.doctor_contact_attempts;
CREATE POLICY doctor_contact_attempts_org_update ON public.doctor_contact_attempts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS doctor_contact_attempts_org_delete ON public.doctor_contact_attempts;
CREATE POLICY doctor_contact_attempts_org_delete ON public.doctor_contact_attempts
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- ambassadors (no organization_id; the table is organisation-wide, so access is
-- limited to authenticated employees of the organisation)
-- ============================================================
DROP POLICY IF EXISTS ambassadors_org_all ON public.ambassadors;
CREATE POLICY ambassadors_org_all ON public.ambassadors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- ambassador_referrals (no organization_id; scope through the doctor)
-- ============================================================
DROP POLICY IF EXISTS ambassador_referrals_org_all ON public.ambassador_referrals;
CREATE POLICY ambassador_referrals_org_all ON public.ambassador_referrals
  FOR ALL TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      WHERE d.organization_id IN (
        SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- ambassador_cohorts (no organization_id; organisation-wide config)
-- ============================================================
DROP POLICY IF EXISTS ambassador_cohorts_org_all ON public.ambassador_cohorts;
CREATE POLICY ambassador_cohorts_org_all ON public.ambassador_cohorts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid()
    )
  );
