-- Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Anyone can set needs_password_reset" ON profiles;
DROP POLICY IF EXISTS "Service role can clear needs_password_reset" ON profiles;
DROP POLICY IF EXISTS "Admins can manage needs_password_reset" ON profiles;
DROP POLICY IF EXISTS "Users can read own needs_password_reset" ON profiles;
DROP POLICY IF EXISTS "Anyone can set needs_password_reset via email" ON profiles;

-- Добавляем поле (если ещё нет)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT false;

-- Индекс
CREATE INDEX IF NOT EXISTS idx_profiles_needs_password_reset
ON profiles (needs_password_reset)
WHERE needs_password_reset = true;

-- Функция: установить флаг (вызывается из формы "забыли пароль")
CREATE OR REPLACE FUNCTION set_password_reset_flag(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id UUID;
BEGIN
  SELECT id INTO found_id FROM profiles WHERE email = target_email;
  IF found_id IS NULL THEN RETURN false; END IF;
  UPDATE profiles SET needs_password_reset = true WHERE id = found_id;
  RETURN true;
END;
$$;

-- Функция: сбросить флаг (вызывается из админки при сбросе пароля)
CREATE OR REPLACE FUNCTION clear_password_reset_flag(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET needs_password_reset = false WHERE id = target_user_id;
  RETURN true;
END;
$$;

-- Права на вызов функций
GRANT EXECUTE ON FUNCTION set_password_reset_flag(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION set_password_reset_flag(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_password_reset_flag(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION clear_password_reset_flag(UUID) TO anon;
GRANT EXECUTE ON FUNCTION clear_password_reset_flag(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_password_reset_flag(UUID) TO service_role;