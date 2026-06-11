-- Revogar acesso público e de usuários autenticados a funções SECURITY DEFINER críticas
-- Isso resolve os avisos de segurança que impedem a publicação do projeto.

-- Nota: Como os nomes das funções não foram listados no linter, 
-- aplicamos uma política geral de segurança para funções no schema public 
-- que são SECURITY DEFINER (se houver).

DO $$ 
DECLARE 
    func_name text;
BEGIN 
    FOR func_name IN 
        SELECT quote_ident(routine_name)
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND external_language = 'PLPGSQL'
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || func_name || '() FROM PUBLIC;';
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || func_name || '() FROM anon;';
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || func_name || '() FROM authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || func_name || '() TO service_role;';
    END LOOP;
END $$;
