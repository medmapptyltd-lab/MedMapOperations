-- Fix the customer_cases SLA trigger: cast numeric SLA hours to integer
-- for make_interval(hours => ...). Previously this raised
-- "function make_interval(hours => numeric) does not exist" on case insert.
CREATE OR REPLACE FUNCTION public.apply_customer_case_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_response_hours numeric;
    v_resolution_hours numeric;
BEGIN

    SELECT
        response_hours,
        resolution_hours
    INTO
        v_response_hours,
        v_resolution_hours
    FROM public.sla_definitions
    WHERE organization_id = NEW.organization_id
      AND priority = NEW.priority
      AND active = true
    LIMIT 1;

    IF v_response_hours IS NULL
       OR v_resolution_hours IS NULL THEN

        SELECT
            default_response_hours,
            default_resolution_hours
        INTO
            v_response_hours,
            v_resolution_hours
        FROM public.case_categories
        WHERE id = NEW.category_id
          AND organization_id = NEW.organization_id
          AND active = true;

    END IF;

    IF TG_OP = 'INSERT' THEN

        IF v_response_hours IS NOT NULL THEN
            NEW.sla_response_due_at :=
                NEW.created_at
                + make_interval(hours => v_response_hours::integer);
        END IF;

        IF v_resolution_hours IS NOT NULL THEN
            NEW.sla_resolution_due_at :=
                NEW.created_at
                + make_interval(hours => v_resolution_hours::integer);
        END IF;

    END IF;

    IF NEW.first_response_at IS NOT NULL
       AND OLD.first_response_at IS NULL THEN

        IF NEW.sla_response_due_at IS NOT NULL THEN
            NEW.sla_response_breached :=
                NEW.first_response_at > NEW.sla_response_due_at;
        END IF;

    END IF;

    IF NEW.resolved_at IS NOT NULL
       AND OLD.resolved_at IS NULL THEN

        IF NEW.sla_resolution_due_at IS NOT NULL THEN
            NEW.sla_resolution_breached :=
                NEW.resolved_at > NEW.sla_resolution_due_at;
        END IF;

    END IF;

    RETURN NEW;
END;
$function$;
