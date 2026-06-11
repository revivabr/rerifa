-- Set search_path to public for the reserve_numbers function
ALTER FUNCTION public.reserve_numbers(UUID, INTEGER[], TEXT, TEXT, TEXT) SET search_path = public;