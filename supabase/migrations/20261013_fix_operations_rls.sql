-- Fix RLS write policies for tickets, tasks, and customer_cases (CTO write enablement)
-- Allows active employees of the same organisation to read, create, update, and delete
-- operational records scoped to their organisation.

-- ============================================================
-- tickets
-- ============================================================
DROP POLICY IF EXISTS "tickets_select" ON tickets;
DROP POLICY IF EXISTS "tickets_insert" ON tickets;
DROP POLICY IF EXISTS "tickets_update" ON tickets;
DROP POLICY IF EXISTS "tickets_delete" ON tickets;

CREATE POLICY "tickets_select" ON tickets
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tickets_insert" ON tickets
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tickets_update" ON tickets
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tickets_delete" ON tickets
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- tasks
-- ============================================================
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- customer_cases
-- ============================================================
DROP POLICY IF EXISTS "customer_cases_select" ON customer_cases;
DROP POLICY IF EXISTS "customer_cases_insert" ON customer_cases;
DROP POLICY IF EXISTS "customer_cases_update" ON customer_cases;
DROP POLICY IF EXISTS "customer_cases_delete" ON customer_cases;

CREATE POLICY "customer_cases_select" ON customer_cases
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "customer_cases_insert" ON customer_cases
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "customer_cases_update" ON customer_cases
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "customer_cases_delete" ON customer_cases
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );
