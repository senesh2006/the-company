CREATE OR REPLACE FUNCTION notify_memory_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'memory_events',
    json_build_object(
      'business_id', NEW.business_id,
      'key', NEW.key,
      'value', NEW.value
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memory_change_trigger
AFTER INSERT OR UPDATE ON shared_memory
FOR EACH ROW EXECUTE FUNCTION notify_memory_change();
